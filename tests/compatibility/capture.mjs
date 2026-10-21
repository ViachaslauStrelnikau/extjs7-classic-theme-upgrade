import { spawn } from 'node:child_process';
import { mkdir, readFile, readdir, rename, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { isDeepStrictEqual } from 'node:util';
import {
    assertCapturePathAvailable,
    assertSafeRunId,
    buildRoleForCapture,
    captureEvidencePath,
    parseCaptureInputs,
    readJson,
    sha256File,
    summarizePlaywrightSuites,
    validateBuildManifest,
    validateRecord,
    validateSuiteResults,
    writeImmutableJson
} from './evidence.mjs';
import { createCasesDocument } from './cases.mjs';
import { captureVariants } from './matrix.mjs';

const repositoryRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const playwrightCli = path.join(repositoryRoot, 'node_modules', '@playwright', 'test', 'cli.js');
const configPath = path.join(repositoryRoot, 'tests', 'compatibility', 'playwright.config.js');

function expectedTheme(themeRole) {
    return ['derived', 'modernized'].includes(themeRole) ? 'theme-classic-modern' : 'ext-theme-classic';
}

function expectedSourceRole(themeRole) {
    if (themeRole === 'original' || themeRole === 'original-repeat') return 'rollback';
    return buildRoleForCapture(themeRole);
}

function safeManifestPath(value) {
    const resolved = path.resolve(repositoryRoot, value);
    const relative = path.relative(repositoryRoot, resolved);
    if (!relative || relative === '..' || relative.startsWith(`..${path.sep}`) || path.isAbsolute(relative)) {
        throw new TypeError('COMPAT_BUILD_MANIFEST must identify a file inside the repository.');
    }
    return resolved;
}

async function writeOrVerifyImmutable(filePath, value) {
    try {
        await writeImmutableJson(filePath, value);
    } catch (error) {
        if (error.code !== 'EEXIST') throw error;
        const existing = await readJson(filePath);
        if (!isDeepStrictEqual(existing, value)) {
            throw new Error(`Existing evidence is immutable and does not match: ${path.relative(repositoryRoot, filePath)}.`);
        }
    }
}

async function ensureCases(runRoot, runId) {
    const casesPath = path.join(runRoot, 'cases.json');
    const current = await createCasesDocument({ runId });
    try {
        const existing = await readJson(casesPath);
        if (existing.schemaVersion !== current.schemaVersion || existing.runId !== runId
            || !isDeepStrictEqual(existing.cases, current.cases)) {
            throw new Error('The existing cases.json differs from the current fixtures. Start a new run after changing fixtures.');
        }
        return existing;
    } catch (error) {
        if (error.code !== 'ENOENT') throw error;
    }
    await writeImmutableJson(casesPath, current);
    return current;
}

async function ensureProductionInputs(runRoot) {
    const targetPath = path.join(runRoot, 'production-inputs.json');
    try {
        const record = await readJson(targetPath);
        validateRecord('ProductionInputSet', record);
        return record;
    } catch (error) {
        if (error.code !== 'ENOENT') throw error;
    }

    const sourcePath = path.join(repositoryRoot, 'artifacts', 'compatibility', 'preflight-final-20261020', 'production-inputs.json');
    const record = await readJson(sourcePath);
    validateRecord('ProductionInputSet', record);
    await writeImmutableJson(targetPath, record);
    return record;
}

async function resolveSourceManifest(inputs) {
    if (process.env.COMPAT_BUILD_MANIFEST) {
        return safeManifestPath(process.env.COMPAT_BUILD_MANIFEST);
    }
    if (inputs.themeRole === 'modernized') {
        throw new Error('Set COMPAT_BUILD_MANIFEST to a successful modernized build manifest.');
    }

    const selectionRun = process.env.COMPAT_SELECTION_RUN || 'revalidation-final';
    assertSafeRunId(selectionRun);
    const sourceRole = expectedSourceRole(inputs.themeRole);
    return path.join(repositoryRoot, 'artifacts', 'compatibility', 'selection', selectionRun, inputs.buildMode, sourceRole, 'manifest.json');
}

async function normalizeBuildManifest(sourcePath, inputs) {
    const source = await readJson(sourcePath);
    const sourceRole = source.themeRole || source.role;
    const selectedTheme = source.selectedTheme;
    const role = buildRoleForCapture(inputs.themeRole);
    if ((inputs.themeRole === 'original' || inputs.themeRole === 'original-repeat')
        && sourceRole === 'rollback' && selectedTheme === 'ext-theme-classic') {
        return {
            ...source,
            themeRole: 'original',
            sourceRole: 'rollback',
            sourceManifestPath: path.relative(repositoryRoot, sourcePath).replaceAll(path.sep, '/')
        };
    }
    if (sourceRole !== role) {
        throw new Error(`Build manifest role ${String(sourceRole)} does not match ${inputs.themeRole}.`);
    }
    return {
        ...source,
        sourceRole,
        sourceManifestPath: path.relative(repositoryRoot, sourcePath).replaceAll(path.sep, '/')
    };
}

async function verifyBuildFiles(manifest, inputs) {
    const expected = expectedTheme(inputs.themeRole);
    if (manifest.selectedTheme !== expected || manifest.buildMode !== inputs.buildMode) {
        throw new Error(`Build manifest must identify ${expected} in ${inputs.buildMode} mode.`);
    }

    const buildRoot = path.join(repositoryRoot, 'TestApp', 'build', inputs.buildMode, 'TestApp');
    const builtConfig = JSON.parse(await readFile(path.join(buildRoot, 'app.json'), 'utf8'));
    if (builtConfig.theme !== expected) {
        throw new Error(`Current build output uses ${String(builtConfig.theme)}; expected ${expected}.`);
    }

    for (const [relative, expectedHash] of Object.entries(manifest.sourceHashes)) {
        if (path.isAbsolute(relative) || relative.split(/[\\/]/).includes('..')) {
            throw new Error(`Unsafe source path in build manifest: ${relative}.`);
        }
        const sourcePath = path.resolve(repositoryRoot, relative);
        const actualHash = await sha256File(sourcePath);
        if (actualHash !== expectedHash) {
            throw new Error(`Build input changed since the manifest was recorded: ${relative}.`);
        }
    }

    for (const [relative, expectedHash] of Object.entries(manifest.outputHashes)) {
        if (path.isAbsolute(relative) || relative.split(/[\\/]/).includes('..')) {
            throw new Error(`Unsafe output path in build manifest: ${relative}.`);
        }
        const outputPath = path.resolve(buildRoot, relative);
        if (path.relative(buildRoot, outputPath).startsWith(`..${path.sep}`)) {
            throw new Error(`Build output escapes its root: ${relative}.`);
        }
        const actualHash = await sha256File(outputPath);
        if (actualHash !== expectedHash) {
            throw new Error(`Build output changed since the manifest was recorded: ${relative}.`);
        }
    }
}

async function prepareRun(inputs, casesDocument) {
    const runRoot = path.join(repositoryRoot, 'artifacts', 'compatibility', inputs.runId);
    await mkdir(runRoot, { recursive: true });
    await ensureProductionInputs(runRoot);
    const sourceManifestPath = await resolveSourceManifest(inputs);
    const manifest = await normalizeBuildManifest(sourceManifestPath, inputs);
    validateBuildManifest(manifest, inputs);
    validateRecord('ThemeBuild', manifest);
    await verifyBuildFiles(manifest, inputs);

    const manifestPath = path.join(runRoot, inputs.buildMode, inputs.themeRole, 'manifest.json');
    await writeOrVerifyImmutable(manifestPath, manifest);

    for (const comparisonCase of casesDocument.cases) {
        for (const state of comparisonCase.states) {
            for (const variant of captureVariants) {
                const captureRoot = captureEvidencePath(repositoryRoot, {
                    runId: inputs.runId,
                    buildMode: inputs.buildMode,
                    role: inputs.themeRole,
                    project: variant.id,
                    caseId: comparisonCase.caseId,
                    state
                });
                for (const fileName of [
                    'capture.json', 'geometry.json', 'styles.json', 'dom.json',
                    'stylesheets.json', 'interactions.json', 'diagnostics.json', 'screenshot.png'
                ]) {
                    await assertCapturePathAvailable(path.join(captureRoot, fileName));
                }
            }
        }
    }

    return { runRoot, manifest, manifestPath };
}

function runPlaywright(env, listOnly = false) {
    return new Promise((resolve, reject) => {
        const playwrightArgs = [playwrightCli, 'test'];
        if (listOnly) playwrightArgs.push('--list');
        playwrightArgs.push('--config', configPath);
        const child = spawn(process.execPath, playwrightArgs, {
            cwd: repositoryRoot,
            env,
            stdio: ['inherit', 'pipe', 'pipe']
        });
        child.stdout.on('data', (chunk) => process.stdout.write(chunk));
        child.stderr.on('data', (chunk) => process.stderr.write(chunk));
        child.on('error', reject);
        child.on('close', (code) => resolve(code ?? 1));
    });
}

async function readProjectEvidence(runRoot, inputs, allowIncomplete) {
    const paths = [];
    const environments = [];
    for (const variant of captureVariants) {
        const projectRoot = path.join(runRoot, inputs.buildMode, inputs.themeRole, variant.id);
        const evidencePath = path.join(projectRoot, 'suite-evidence.json');
        const environmentPath = path.join(projectRoot, 'environment.json');
        let evidence;
        let environmentDocument;
        try {
            evidence = await readJson(evidencePath);
            environmentDocument = await readJson(environmentPath);
        } catch (error) {
            if (allowIncomplete && error.code === 'ENOENT') continue;
            throw error;
        }
        if (evidence.status !== 'completed' || evidence.project !== variant.id
            || evidence.playwrightProject !== variant.project || evidence.themeRole !== inputs.themeRole) {
            throw new Error(`${variant.id} did not write completed capture evidence.`);
        }
        validateRecord('Environment', environmentDocument.environment);
        if (environmentDocument.environment.viewport.width !== variant.viewport.width
            || environmentDocument.environment.viewport.height !== variant.viewport.height
            || environmentDocument.environment.browserEngine !== (variant.project.startsWith('firefox-') ? 'firefox' : 'chromium')
            || environmentDocument.environment.requestedDpr !== (variant.project.endsWith('dpr2') ? 2 : 1)) {
            throw new Error(`${variant.id} environment does not match its configured browser, DPR, and viewport.`);
        }
        environments.push(environmentDocument.environment);
        paths.push(...evidence.evidencePaths.map((relative) => path.relative(runRoot, path.join(repositoryRoot, 'artifacts', 'compatibility', inputs.runId, relative)).split(path.sep).join('/')));
        paths.push(path.relative(runRoot, evidencePath).split(path.sep).join('/'));
    }
    return { paths, environments };
}

async function writeAppendOnlyCollection(filePath, value, collectionName, keyName) {
    let previous;
    try {
        previous = await readJson(filePath);
    } catch (error) {
        if (error.code !== 'ENOENT') throw error;
        await writeImmutableJson(filePath, value);
        return;
    }
    if (previous.schemaVersion !== value.schemaVersion || previous.runId !== value.runId) {
        throw new Error(`${path.basename(filePath)} belongs to a different run.`);
    }
    const records = new Map(previous[collectionName].map((record) => [record[keyName], record]));
    for (const record of value[collectionName]) {
        const existing = records.get(record[keyName]);
        if (existing && !isDeepStrictEqual(existing, record)) {
            throw new Error(`${path.basename(filePath)} cannot change existing ${record[keyName]} evidence.`);
        }
        records.set(record[keyName], record);
    }
    const merged = { ...previous, ...value, [collectionName]: Array.from(records.values()) };
    const temporary = `${filePath}.${process.pid}.tmp`;
    await writeFile(temporary, `${JSON.stringify(merged, null, 4)}\n`, { flag: 'wx' });
    await rename(temporary, filePath);
}

async function listFiles(directory) {
    const files = [];
    let entries;
    try {
        entries = await readdir(directory, { withFileTypes: true });
    } catch (error) {
        if (error.code === 'ENOENT') return files;
        throw error;
    }
    for (const entry of entries) {
        const entryPath = path.join(directory, entry.name);
        if (entry.isDirectory()) files.push(...await listFiles(entryPath));
        else if (entry.isFile()) files.push(entryPath);
    }
    return files;
}

export async function updateRunEvidence(runRoot, inputs, reportPath, exitCode) {
    const { paths, environments } = await readProjectEvidence(runRoot, inputs, true);
    const projectEvidenceComplete = environments.length === captureVariants.length;
    const currentEnvironment = {
        schemaVersion: 1,
        runId: inputs.runId,
        environments
    };
    if (environments.length) {
        await writeAppendOnlyCollection(path.join(runRoot, 'environments.json'), currentEnvironment, 'environments', 'environmentId');
    }

    let report = null;
    try {
        report = await readJson(reportPath);
    } catch (error) {
        if (error.code !== 'ENOENT') throw error;
    }
    const suiteSummaries = summarizePlaywrightSuites(inputs.suiteStage, report);
    const captureSummary = suiteSummaries.find((summary) => summary.suite === 'capture.spec.js');
    if (captureSummary && !projectEvidenceComplete && captureSummary.status === 'completed') {
        captureSummary.status = 'incomplete';
        captureSummary.outcome.globalErrors.push('Capture evidence is missing for one or more browser projects.');
    }
    const reportRelative = path.relative(runRoot, reportPath).split(path.sep).join('/');
    if (report) paths.push(reportRelative);
    const roleRoot = path.join(runRoot, inputs.buildMode, inputs.themeRole);
    const artifactPaths = (await listFiles(path.join(roleRoot, 'playwright-artifacts')))
        .map((artifactPath) => path.relative(runRoot, artifactPath).split(path.sep).join('/'));
    for (const artifactPath of artifactPaths) {
        paths.push(artifactPath);
    }
    const sharedEvidencePaths = Array.from(new Set([
        ...paths,
        ...(report ? [reportRelative] : []),
        ...artifactPaths
    ])).sort();

    const suiteOutputRoot = path.join(roleRoot, 'suite-results');
    await mkdir(suiteOutputRoot, { recursive: true });
    const currentSuiteResults = new Map();
    for (const summary of suiteSummaries) {
        const resultPath = path.join(suiteOutputRoot, `${summary.suite}.json`);
        const resultRelative = path.relative(runRoot, resultPath).split(path.sep).join('/');
        const relatedAttachments = summary.outcome.tests.flatMap((item) => item.attachments)
            .map((attachment) => attachment.path)
            .filter((attachmentPath) => typeof attachmentPath === 'string')
            .map((attachmentPath) => {
                const resolved = path.isAbsolute(attachmentPath) ? attachmentPath : path.resolve(roleRoot, attachmentPath);
                const relative = path.relative(runRoot, resolved);
                return relative.startsWith('..') || path.isAbsolute(relative) ? null : relative.split(path.sep).join('/');
            })
            .filter(Boolean);
        const suiteEvidencePaths = summary.suite === 'capture.spec.js' ? sharedEvidencePaths : [
            ...(report ? [reportRelative] : [])
        ];
        const roleEvidencePaths = Array.from(new Set([
            ...suiteEvidencePaths,
            ...relatedAttachments,
            resultRelative
        ])).sort();
        const suiteEvidence = {
            schemaVersion: 1,
            runId: inputs.runId,
            buildMode: inputs.buildMode,
            themeRole: inputs.themeRole,
            suite: summary.suite,
            status: summary.status,
            outcome: summary.outcome,
            evidencePaths: roleEvidencePaths
        };
        await writeOrVerifyImmutable(resultPath, suiteEvidence);
        currentSuiteResults.set(summary.suite, {
            status: summary.status,
            outcome: summary.outcome,
            evidencePaths: roleEvidencePaths
        });
    }

    const previousSuitePath = path.join(runRoot, 'suite-results.json');
    let previous = { schemaVersion: 1, runId: inputs.runId, suites: [] };
    try {
        previous = await readJson(previousSuitePath);
    } catch (error) {
        if (error.code !== 'ENOENT') throw error;
    }
    const suiteMap = new Map(previous.suites.map((suite) => [suite.suite, suite]));
    for (const [suite, current] of currentSuiteResults) {
        const prior = suiteMap.get(suite);
        const priorRole = prior?.roles?.[inputs.themeRole];
        const roleResult = priorRole?.status === 'failed' ? priorRole : current;
        const roles = { ...(prior?.roles || {}), [inputs.themeRole]: roleResult };
        const roleResults = Object.values(roles);
        const outcome = roleResults.reduce((total, role) => ({
            total: total.total + (role.outcome?.total || 0),
            passed: total.passed + (role.outcome?.passed || 0),
            failed: total.failed + (role.outcome?.failed || 0),
            skipped: total.skipped + (role.outcome?.skipped || 0),
            flaky: total.flaky + (role.outcome?.flaky || 0)
        }), { total: 0, passed: 0, failed: 0, skipped: 0, flaky: 0 });
        const status = roleResults.some((role) => role.status === 'failed')
            ? 'failed'
            : roleResults.every((role) => role.status === 'completed') ? 'completed' : 'incomplete';
        suiteMap.set(suite, {
            suite,
            status,
            outcome,
            evidencePaths: Array.from(new Set([
                ...(prior?.evidencePaths || []),
                ...roleResults.flatMap((role) => role.evidencePaths || [])
            ])).sort(),
            roles
        });
    }
    const suiteDocument = { schemaVersion: 1, runId: inputs.runId, suites: Array.from(suiteMap.values()) };
    if (exitCode === 0) validateSuiteResults(inputs.suiteStage, suiteDocument.suites);
    const temporary = `${previousSuitePath}.${process.pid}.tmp`;
    try {
        await readFile(previousSuitePath);
        await writeFile(temporary, `${JSON.stringify(suiteDocument, null, 4)}\n`, { flag: 'wx' });
        await rename(temporary, previousSuitePath);
    } catch (error) {
        if (error.code !== 'ENOENT') throw error;
        await writeImmutableJson(previousSuitePath, suiteDocument);
    }
}

async function main() {
    if (process.argv.slice(2).includes('--list')) {
        const exitCode = await runPlaywright(process.env, true);
        if (exitCode !== 0) process.exitCode = exitCode;
        return;
    }

    const inputs = parseCaptureInputs(process.env);
    const casesDocument = await ensureCases(path.join(repositoryRoot, 'artifacts', 'compatibility', inputs.runId), inputs.runId);
    const { runRoot } = await prepareRun(inputs, casesDocument);
    const reportPath = path.join(runRoot, inputs.buildMode, inputs.themeRole, 'playwright-report.json');
    const outputDirectory = path.join(runRoot, inputs.buildMode, inputs.themeRole, 'playwright-artifacts');
    await assertCapturePathAvailable(reportPath);
    await assertCapturePathAvailable(outputDirectory);
    await mkdir(path.dirname(reportPath), { recursive: true });

    const exitCode = await runPlaywright({
        ...process.env,
        COMPAT_PLAYWRIGHT_REPORT: reportPath,
        COMPAT_PLAYWRIGHT_OUTPUT_DIR: outputDirectory
    });
    await updateRunEvidence(runRoot, inputs, reportPath, exitCode);
    if (exitCode !== 0) process.exitCode = exitCode;
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
    main().catch((error) => {
        console.error(error.stack || error.message);
        process.exitCode = 2;
    });
}
