import { readFile, writeFile, mkdir } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { comparePngBuffers } from './png.mjs';
import { assertSafeRunId, readJson, validateCapturePair, validateRecord, validateSuiteResults } from './evidence.mjs';
import { captureVariants } from './matrix.mjs';

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, '../..');
const allowedPaintPattern = /^(?:color|background(?:-color|-image)?|border-(?:top-|right-|bottom-|left-)?color|box-shadow|outline(?:-color|-style|-width|-offset)?)$/;
const generatedIdentityPattern = /^(?:id|data-ext-id)$/i;

function stable(value) {
    if (Array.isArray(value)) {
        return value.map(stable);
    }
    if (value && typeof value === 'object') {
        return Object.fromEntries(Object.keys(value).sort().map((key) => [key, stable(value[key])]));
    }
    return value;
}

function equal(left, right) {
    return JSON.stringify(stable(left)) === JSON.stringify(stable(right));
}

function deepDifferences(left, right, prefix = '') {
    const differences = [];
    const keys = new Set([
        ...Object.keys(left && typeof left === 'object' ? left : {}),
        ...Object.keys(right && typeof right === 'object' ? right : {})
    ]);
    for (const key of [...keys].sort()) {
        const nextPath = prefix ? `${prefix}.${key}` : key;
        const leftHas = left && typeof left === 'object' && Object.hasOwn(left, key);
        const rightHas = right && typeof right === 'object' && Object.hasOwn(right, key);
        const leftValue = leftHas ? left[key] : undefined;
        const rightValue = rightHas ? right[key] : undefined;
        if (leftHas && rightHas && leftValue && rightValue && typeof leftValue === 'object' && typeof rightValue === 'object') {
            differences.push(...deepDifferences(leftValue, rightValue, nextPath));
        } else if (!leftHas || !rightHas || !Object.is(leftValue, rightValue)) {
            differences.push({ path: nextPath, expected: leftValue, actual: rightValue });
        }
    }
    return differences;
}

function category(status, differences = []) {
    return { status, differences };
}

function layoutObservationIsSufficient(observation) {
    const work = observation?.observedWork;
    return Boolean(
        observation && observation.sufficient === true &&
        typeof observation.method === 'string' && observation.method.trim() !== '' &&
        typeof observation.scope === 'string' && observation.scope.trim() !== '' &&
        work && typeof work === 'object' &&
        work.original && typeof work.original === 'object' && Object.keys(work.original).length > 0 &&
        work.candidate && typeof work.candidate === 'object' && Object.keys(work.candidate).length > 0 &&
        Array.isArray(observation.limitations)
    );
}

function legacyCssDifferences(reference, actual) {
    const differences = [];
    for (const field of ['legacyDeclarations', 'inlineOrder', 'applicationOrder']) {
        if (!equal(reference.stylesheets?.[field] ?? [], actual.stylesheets?.[field] ?? [])) {
            differences.push({ path: `stylesheets.${field}`, expected: reference.stylesheets?.[field] ?? [], actual: actual.stylesheets?.[field] ?? [] });
        }
    }
    for (const field of ['external', 'inlineStylesheets']) {
        const expected = reference.stylesheets?.[field] ?? [];
        const candidate = actual.stylesheets?.[field] ?? [];
        if (expected.length !== candidate.length) {
            differences.push({ path: `stylesheets.${field}.length`, expected: expected.length, actual: candidate.length });
        }
        const expectedOrder = expected.map((sheet) => sheet.order);
        const actualOrder = candidate.map((sheet) => sheet.order);
        if (!equal(expectedOrder, actualOrder)) {
            differences.push({ path: `stylesheets.${field}.order`, expected: expectedOrder, actual: actualOrder });
        }
        if (field === 'inlineStylesheets') {
            const expectedHashes = expected.map((sheet) => sheet.sha256);
            const actualHashes = candidate.map((sheet) => sheet.sha256);
            if (!equal(expectedHashes, actualHashes)) {
                differences.push({ path: 'stylesheets.inlineStylesheets.sha256', expected: expectedHashes, actual: actualHashes });
            }
        }
    }
    return differences;
}

function stylesheetIdentityChanges(reference, actual) {
    const changes = [];
    for (const field of ['external', 'inlineStylesheets']) {
        const expected = reference.stylesheets?.[field] ?? [];
        const candidate = actual.stylesheets?.[field] ?? [];
        for (let index = 0; index < Math.min(expected.length, candidate.length); index += 1) {
            for (const property of field === 'external' ? ['url', 'sha256'] : []) {
                if (expected[index][property] !== candidate[index][property]) {
                    changes.push({
                        path: `stylesheets.${field}[${index}].${property}`,
                        expected: expected[index][property],
                        actual: candidate[index][property]
                    });
                }
            }
        }
    }
    return changes;
}

function styleDifferences(reference, actual, { phase, approvedPaintProperties = [], protectedProperties = [] }) {
    const all = deepDifferences(reference.computedStyles || {}, actual.computedStyles || {});
    const allowed = new Set(approvedPaintProperties);
    const protectedSet = new Set(protectedProperties);
    const cssFailures = [];
    const geometryFailures = [];
    const unexpected = [];
    for (const difference of all) {
        const property = difference.path.split('.').at(-1);
        const isProtected = protectedSet.has(property) || protectedSet.has(difference.path);
        const paintApproved = phase === 'modernization' && allowed.has(property) && allowedPaintPattern.test(property);
        if (!paintApproved) {
            cssFailures.push(difference);
            if (isProtected) {
                geometryFailures.push(difference);
            } else if (!allowedPaintPattern.test(property)) {
                unexpected.push(difference);
            }
        }
    }
    return { cssFailures, geometryFailures, unexpected };
}

export async function compareCaptures(reference, actual, options = {}) {
    const phase = options.phase || 'baseline';
    const coverageComplete = options.coverageComplete !== false;
    const layoutObservation = options.layoutObservation || { sufficient: false, reason: 'No layout observation evidence was supplied.' };
    const approvedPaintProperties = options.approval?.allowedProperties || [];
    const protectedProperties = options.caseDefinition?.protectedProperties || [];
    const geometryDiffs = deepDifferences(reference.geometry || {}, actual.geometry || {});
    const domDiffs = deepDifferences(reference.dom || {}, actual.dom || {});
    const interactionDiffs = deepDifferences(reference.interactions?.actual || {}, actual.interactions?.actual || {});
    const referenceOutcomeDiffs = deepDifferences(reference.interactions?.expected || {}, reference.interactions?.actual || {});
    const candidateOutcomeDiffs = deepDifferences(actual.interactions?.expected || {}, actual.interactions?.actual || {});
    const missingAssetDiffs = (actual.interactions?.missingAssets || []).map((asset) => ({ path: 'interactions.missingAssets', actual: asset }));
    const pageErrorDiffs = (actual.interactions?.pageErrors || []).map((error) => ({ path: 'interactions.pageErrors', actual: error }));
    const css = styleDifferences(reference, actual, { phase, approvedPaintProperties, protectedProperties });
    css.cssFailures.push(...legacyCssDifferences(reference, actual));
    css.cssFailures.push(...domDiffs.map((difference) => ({ ...difference, path: `dom.${difference.path}` })));

    let screenshotResult = null;
    if (options.referencePng && options.actualPng) {
        screenshotResult = comparePngBuffers(options.referencePng, options.actualPng);
    } else if (options.referenceScreenshotPath && options.actualScreenshotPath) {
        screenshotResult = comparePngBuffers(
            await readFile(options.referenceScreenshotPath),
            await readFile(options.actualScreenshotPath)
        );
    }
    const visualDiffs = screenshotResult?.equal
        ? []
        : [{ path: 'screenshot', differingPixels: screenshotResult?.differingPixels ?? null, differenceBounds: screenshotResult?.differenceBounds ?? null }];
    const identityDiffs = [];
    for (const field of ['buildId', 'packageName', 'themeRole']) {
        if (reference[field] !== actual[field]) {
            identityDiffs.push({ path: field, expected: reference[field], actual: actual[field] });
        }
    }
    identityDiffs.push(...stylesheetIdentityChanges(reference, actual));
    let geometryStatus = geometryDiffs.length || css.geometryFailures.length ? 'fail' : 'pass';
    const layoutSufficient = layoutObservationIsSufficient(layoutObservation);
    const layoutWorkDiffs = layoutSufficient
        ? deepDifferences(layoutObservation.observedWork.original, layoutObservation.observedWork.candidate)
        : [];
    if (layoutWorkDiffs.length) geometryStatus = 'fail';
    if (!layoutSufficient && geometryStatus === 'pass') {
        geometryStatus = 'blocked';
    }
    const cssStatus = css.cssFailures.length ? 'fail' : 'pass';
    const behaviorDiffs = [
        ...domDiffs.map((difference) => ({ ...difference, path: `dom.${difference.path}` })),
        ...interactionDiffs,
        ...referenceOutcomeDiffs.map((difference) => ({ ...difference, path: `reference.interactions.${difference.path}` })),
        ...candidateOutcomeDiffs.map((difference) => ({ ...difference, path: `candidate.interactions.${difference.path}` })),
        ...missingAssetDiffs,
        ...pageErrorDiffs
    ];
    const behaviorStatus = behaviorDiffs.length ? 'fail' : 'pass';
    let visualStatus = visualDiffs.length ? 'fail' : 'pass';
    if (phase === 'modernization' && visualDiffs.length && !options.approval) {
        visualStatus = 'blocked';
    }
    if (!coverageComplete) {
        for (const status of [geometryStatus, visualStatus]) {
            if (status === 'pass') {
                if (status === geometryStatus) geometryStatus = 'blocked';
                else visualStatus = 'blocked';
            }
        }
    }

    return {
        geometry: category(geometryStatus, [
            ...geometryDiffs,
            ...css.geometryFailures,
            ...layoutWorkDiffs.map((difference) => ({ ...difference, path: `layoutObservation.observedWork.${difference.path}` }))
        ]),
        css: category(cssStatus, css.cssFailures),
        behavior: category(behaviorStatus, behaviorDiffs),
        visual: category(visualStatus, visualDiffs),
        layoutObservation: {
            status: !layoutSufficient ? 'blocked' : layoutWorkDiffs.length ? 'fail' : 'pass',
            method: layoutObservation.method || null,
            scope: layoutObservation.scope || null,
            limitations: layoutObservation.limitations || [],
            reason: layoutObservation.reason || null,
            differences: layoutWorkDiffs
        },
        identityChanges: identityDiffs,
        unexpectedDifferences: css.unexpected,
        coverageGaps: coverageComplete ? [] : (options.coverageGaps || ['Required test coverage is missing.']),
        screenshot: screenshotResult
    };
}

export function assertStableOriginal(original, repeat) {
    const fields = ['geometry', 'computedStyles', 'dom', 'stylesheets', 'interactions'];
    const differences = [];
    for (const field of fields) {
        if (!equal(original[field], repeat[field])) {
            differences.push({ path: field, expected: original[field], actual: repeat[field] });
        }
    }
    const originalImageHash = original.diagnostics?.screenshotSha256;
    const repeatImageHash = repeat.diagnostics?.screenshotSha256;
    if (!originalImageHash || originalImageHash !== repeatImageHash) {
        differences.push({ path: 'diagnostics.screenshotSha256', expected: originalImageHash, actual: repeatImageHash });
    }
    const originalLayout = original.diagnostics?.layoutObservation;
    const repeatLayout = repeat.diagnostics?.layoutObservation;
    if (!equal(originalLayout?.observedWork, repeatLayout?.observedWork)) {
        differences.push({ path: 'diagnostics.layoutObservation.observedWork', expected: originalLayout?.observedWork, actual: repeatLayout?.observedWork });
    }
    return { stable: differences.length === 0, differences };
}

export function preserveFailures(previous, current) {
    const oldItems = previous?.historicalFailures || [];
    const failed = Object.entries(current).flatMap(([caseId, result]) => {
        const categories = ['geometry', 'css', 'behavior', 'visual'];
        return categories.filter((name) => result[name]?.status === 'fail').map((name) => ({ caseId, category: name, result: result[name] }));
    });
    return { ...current, historicalFailures: [...oldItems, ...failed] };
}

export async function compareRun({ runId, buildMode, suiteStage = 'us2' }) {
    assertSafeRunId(runId);
    if (!['development', 'production'].includes(buildMode)) {
        throw new TypeError('buildMode must be development or production.');
    }
    const runRoot = path.join(root, 'artifacts', 'compatibility', runId);
    const results = [];
    const errors = [];
    const gates = [];
    const productionPath = path.join(runRoot, 'production-inputs.json');
    let productionInputs;
    try {
        productionInputs = await readJson(productionPath);
        validateRecord('ProductionInputSet', productionInputs);
    } catch (error) {
        errors.push(`Production input evidence is missing or invalid. G0 is blocked. ${error.message}`);
        productionInputs = null;
    }
    let environments = new Map();
    const environmentPath = path.join(runRoot, 'environments.json');
    try {
        const environmentDocument = await readJson(environmentPath);
        if (environmentDocument.schemaVersion !== 1 || environmentDocument.runId !== runId || !Array.isArray(environmentDocument.environments)) {
            throw new Error('Environment document must match this run and use schema version 1.');
        }
        environmentDocument.environments.forEach((environment) => validateRecord('Environment', environment));
        environments = new Map(environmentDocument.environments.map((environment) => [environment.environmentId, environment]));
    } catch (error) {
        environments = null;
        errors.push(`Environment evidence is missing or invalid. ${error.message}`);
    }
    const suitePath = path.join(runRoot, 'suite-results.json');
    try {
        const suiteEvidence = await readJson(suitePath);
        validateSuiteResults(suiteStage, suiteEvidence.suites || []);
    } catch (error) {
        errors.push(error.message);
    }
    const base = path.join(runRoot, buildMode);
    const roleNames = ['original', 'original-repeat', 'derived', 'rollback'];
    const roleData = new Map();
    for (const role of roleNames) {
        const roleRoot = path.join(base, role);
        try {
            const manifest = await readJson(path.join(roleRoot, 'manifest.json'));
            validateRecord('ThemeBuild', manifest);
            const manifestRole = buildRoleForCapture(role);
            const expectedTheme = ['derived', 'modernized'].includes(manifestRole) ? 'theme-classic-modern' : 'ext-theme-classic';
            if (!manifest || manifest.exitCode !== 0 || manifest.buildMode !== buildMode || manifest.themeRole !== manifestRole || manifest.selectedTheme !== expectedTheme) {
                throw new Error(`${role} manifest is failed or has the wrong build mode.`);
            }
            roleData.set(role, { root: roleRoot, manifest });
        } catch (error) {
            errors.push(`${role}: ${error.message}`);
        }
    }
    const caseDocument = await readJson(path.join(runRoot, 'cases.json')).catch((error) => {
        errors.push(`Cases: ${error.message}`);
        return null;
    });
    let cases = [];
    if (caseDocument) {
        if (caseDocument.schemaVersion !== 1 || caseDocument.runId !== runId || !Array.isArray(caseDocument.cases)) {
            errors.push('Cases: the versioned case document does not match this run.');
        } else {
            try {
                caseDocument.cases.forEach((item) => validateRecord('ComparisonCase', item));
                cases = caseDocument.cases;
            } catch (error) {
                errors.push(`Cases: ${error.message}`);
            }
        }
    }
    const projects = captureVariants.map((variant) => variant.id);
    if (roleData.size !== roleNames.length) {
        errors.push('Capture comparison did not run because one or more required build manifests are missing.');
    } else {
        const baseFixtureHash = roleData.get('original').manifest.fixtureHash;
        for (const role of roleNames.slice(1)) {
            if (roleData.get(role).manifest.fixtureHash !== baseFixtureHash) {
                errors.push(`${role} manifest has a different fixture hash from the original build.`);
            }
            if (!equal(roleData.get('original').manifest.sourceHashes, roleData.get(role).manifest.sourceHashes)) {
                errors.push(`${role} manifest has different application or fixture source hashes from the original build.`);
            }
        }
        for (const item of cases) {
            for (const project of projects) {
                for (const state of item.states) {
                const key = [project, item.caseId, state].join('/');
                const captures = {};
                for (const role of roleNames) {
                    const capturePath = path.join(base, role, project, item.caseId, state, 'capture.json');
                    captures[role] = await readJson(capturePath).catch((error) => {
                        errors.push(`${role}/${key}: ${error.message}`);
                        return null;
                    });
                }
                if (!captures.original || !captures['original-repeat'] || !captures.derived || !captures.rollback) {
                    continue;
                }
                let capturesValid = true;
                for (const role of roleNames) {
                    try {
                        validateRecord('Capture', captures[role]);
                    } catch (error) {
                        errors.push(`${role}/${key}: invalid capture record. ${error.message}`);
                        capturesValid = false;
                        continue;
                    }
                    if (captures[role].buildId !== roleData.get(role).manifest.buildId) {
                        errors.push(`${role}/${key}: capture build identity does not match its manifest.`);
                        capturesValid = false;
                    }
                    const variant = captureVariants.find((item) => item.id === project);
                    const environment = environments?.get(captures[role].environmentId);
                    if (!environment) {
                        errors.push(`${role}/${key}: capture has no valid Environment record.`);
                        capturesValid = false;
                    } else {
                        const expectedBrowser = variant.project.startsWith('firefox-') ? 'firefox' : 'chromium';
                        const expectedDpr = variant.project.endsWith('dpr2') ? 2 : 1;
                        const viewportMatches = environment.viewport.width === variant.viewport.width
                            && environment.viewport.height === variant.viewport.height;
                        const screenshotMatches = captures[role].diagnostics.screenshotDimensions?.width === variant.viewport.width * expectedDpr
                            && captures[role].diagnostics.screenshotDimensions?.height === variant.viewport.height * expectedDpr;
                        if (environment.buildMode !== buildMode || environment.actualDpr !== captures[role].diagnostics.actualDpr
                            || environment.browserEngine !== expectedBrowser || environment.actualDpr !== expectedDpr
                            || !viewportMatches || !screenshotMatches) {
                            errors.push(`${role}/${key}: capture environment does not match its configured browser, DPR, viewport, screenshot size, or build mode.`);
                            capturesValid = false;
                        }
                    }
                }
                if (!capturesValid) continue;
                    validateCapturePair(captures.original, captures['original-repeat']);
                    const repeat = assertStableOriginal(captures.original, captures['original-repeat']);
                if (!repeat.stable) {
                    errors.push(`${key}: original-repeat is unstable.`);
                }
                for (const role of ['derived', 'rollback']) {
                    validateCapturePair(captures.original, captures[role]);
                    const originalLayout = captures.original.diagnostics?.layoutObservation;
                    const candidateLayout = captures[role].diagnostics?.layoutObservation;
                    const layoutMethodMatches = originalLayout?.method === candidateLayout?.method && originalLayout?.scope === candidateLayout?.scope;
                    const layoutObservation = {
                        sufficient: layoutObservationIsSufficient(originalLayout) && layoutObservationIsSufficient(candidateLayout) && layoutMethodMatches,
                        method: candidateLayout?.method || null,
                        scope: candidateLayout?.scope || null,
                        observedWork: { original: originalLayout?.observedWork || null, candidate: candidateLayout?.observedWork || null },
                        limitations: [...new Set([...(originalLayout?.limitations || []), ...(candidateLayout?.limitations || [])])],
                        reason: layoutMethodMatches ? candidateLayout?.reason || null : 'Reference and candidate layout observations do not use the same method and scope.'
                    };
                    const compared = await compareCaptures(captures.original, captures[role], {
                        phase: 'baseline', caseDefinition: item,
                        referenceScreenshotPath: path.join(base, 'original', project, item.caseId, state, 'screenshot.png'),
                        actualScreenshotPath: path.join(base, role, project, item.caseId, state, 'screenshot.png'),
                        layoutObservation,
                        coverageComplete: true
                    });
                    if (compared.screenshot?.differencePng) {
                        const differencePath = path.join(runRoot, 'differences', buildMode, project, item.caseId, state, `${role}.png`);
                        await mkdir(path.dirname(differencePath), { recursive: true });
                        await writeFile(differencePath, compared.screenshot.differencePng);
                        compared.screenshot.differencePath = path.relative(runRoot, differencePath).replaceAll(path.sep, '/');
                        delete compared.screenshot.differencePng;
                    }
                    results.push({ caseId: item.caseId, project, state, role, ...compared });
                }
                }
            }
        }
    }
    const g0 = productionInputs?.status === 'verified'
        ? { gateId: 'G0', status: 'passed', reason: 'Production inputs are verified.' }
        : { gateId: 'G0', status: 'blocked', reason: 'Production inputs are missing or not verified.' };
    const allPass = results.length > 0 && results.every((result) => ['geometry', 'css', 'behavior', 'visual'].every((key) => result[key].status === 'pass'));
    const g1 = errors.length ? { gateId: 'G1', status: 'not-run', reason: 'Required run evidence is incomplete.' }
        : { gateId: 'G1', status: 'passed', reason: 'Original repeat evidence is present and stable.' };
    const g2 = g0.status !== 'passed' || g1.status !== 'passed'
        ? { gateId: 'G2', status: 'blocked', reason: 'G0 and G1 must pass before G2.' }
        : allPass ? { gateId: 'G2', status: 'passed', reason: 'Derived and rollback comparisons pass.' }
            : { gateId: 'G2', status: 'failed', reason: 'One or more baseline comparisons failed or remain blocked.' };
    gates.push(g0, g1, g2);
    const output = { schemaVersion: 1, runId, buildMode, gates, errors, results, blocked: gates.some((gate) => gate.status === 'blocked') };
    await mkdir(runRoot, { recursive: true });
    await writeFile(path.join(runRoot, `${buildMode}-results.json`), `${JSON.stringify(output, null, 4)}\n`, 'utf8');
    const combinedPath = path.join(runRoot, 'results.json');
    const combined = await readJson(combinedPath).catch(() => ({ schemaVersion: 1, runId, buildModes: {} }));
    combined.buildModes[buildMode] = preserveFailures(combined.buildModes[buildMode], output);
    await writeFile(combinedPath, `${JSON.stringify(combined, null, 4)}\n`, 'utf8');
    return output;
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
    const runId = process.env.COMPAT_RUN;
    const buildMode = process.env.COMPAT_BUILD_MODE;
    if (!runId || !['development', 'production'].includes(buildMode)) {
        console.error('Set COMPAT_RUN and COMPAT_BUILD_MODE before comparison.');
        process.exitCode = 2;
    } else {
        compareRun({ runId, buildMode, suiteStage: process.env.COMPAT_SUITE_STAGE || 'us2' })
            .then((result) => {
                console.log(`${buildMode} G0=${result.gates[0].status} G1=${result.gates[1].status} G2=${result.gates[2].status}`);
                if (result.errors.length || result.gates.some((gate) => gate.status !== 'passed')) process.exitCode = 1;
            })
            .catch((error) => {
                console.error(error.stack || error.message);
                process.exitCode = 2;
            });
    }
}
