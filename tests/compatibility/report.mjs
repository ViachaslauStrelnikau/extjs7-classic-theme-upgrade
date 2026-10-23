import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { assertSafeRunId, readJson, requiredSuiteNames, sameHashes, validateBuildManifest, validateRecord, validateSuiteResults } from './evidence.mjs';
import { validatePackageDirectory } from './package-contract.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');

const criterionNames = [
    'Valid standard theme package',
    'Standard selection of either theme',
    'Equivalent initial replacement',
    'Approved visual improvements',
    'Recognizable existing colors',
    'Unchanged geometry and layout styles',
    'Compatible tested standard selectors',
    'Unchanged component configurations',
    'Passing component interactions',
    'Available visual and geometry evidence',
    'Existing build workflow works',
    'Rollback without application changes',
    'Package separate from demo code',
    'Report states limits and production gaps'
];

const successCriteria = [
    { id: 'SC-001', name: 'Select and restore the theme', criteria: ['AC-002', 'AC-011', 'AC-012'] },
    { id: 'SC-002', name: 'Match the original baseline', criteria: ['AC-003'] },
    { id: 'SC-003', name: 'Preserve geometry and CSS contracts', criteria: ['AC-006', 'AC-007'] },
    { id: 'SC-004', name: 'Approve visual improvements', criteria: ['AC-004', 'AC-005'] },
    { id: 'SC-005', name: 'Preserve component interactions', criteria: ['AC-009'] },
    { id: 'SC-006', name: 'Record visual and geometry evidence', criteria: ['AC-010'] },
    { id: 'SC-007', name: 'Install and reuse the package', criteria: ['AC-001', 'AC-002', 'AC-012', 'AC-013'] },
    { id: 'SC-008', name: 'Account for all acceptance criteria', criteria: criterionNames.map((_, index) => `AC-${String(index + 1).padStart(3, '0')}`) }
];

function escapeHtml(value) {
    return String(value).replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;').replaceAll("'", '&#39;');
}

function modeResult(buildModes, mode) {
    return buildModes?.[mode] || null;
}

function categoriesFrom(results, category) {
    const entries = Object.values(results || {}).flatMap((mode) => mode?.results || []);
    if (!entries.length) return 'blocked';
    if (entries.some((entry) => entry[category]?.status === 'fail')) return 'fail';
    if (entries.every((entry) => entry[category]?.status === 'pass')) return 'pass';
    return 'blocked';
}

function summarizeSuiteCoverage(suiteEvidence, expectedRunId) {
    const suiteResults = Array.isArray(suiteEvidence?.suites) ? suiteEvidence.suites : [];
    let validationError = null;
    if (!suiteEvidence || suiteEvidence.schemaVersion !== 1 || suiteEvidence.runId !== expectedRunId) {
        validationError = 'Suite evidence is missing, invalid, or belongs to another run.';
    } else {
        try {
            validateSuiteResults('us3', suiteResults);
        } catch (error) {
            validationError = error.message;
        }
    }

    const byName = new Map(suiteResults.map((result) => [result.suite, result]));
    const displayNames = {
        'capture.spec.js': 'Capture suite',
        'css-contract.spec.js': 'CSS contract suite',
        'interactions.spec.js': 'Interaction suite'
    };
    return {
        status: validationError ? 'incomplete' : 'complete',
        validationError,
        suites: requiredSuiteNames('us3').map((suite) => {
            const result = byName.get(suite);
            return {
                suite,
                displayName: displayNames[suite],
                status: result?.status || 'missing',
                outcome: result?.outcome || null,
                evidencePaths: Array.isArray(result?.evidencePaths)
                    ? result.evidencePaths.filter((file) => file.endsWith(`/suite-results/${suite}.json`)).slice(0, 4)
                    : []
            };
        })
    };
}

function summarizeEnvironments(environmentEvidence) {
    return (Array.isArray(environmentEvidence?.environments) ? environmentEvidence.environments : []).map((item) => ({
        environmentId: item.environmentId,
        browserEngine: item.browserEngine,
        browserVersion: item.browserVersion,
        viewport: item.viewport,
        actualDpr: item.actualDpr,
        buildMode: item.buildMode
    }));
}

function summarizeRawPairs(rawPairEvidence) {
    return Object.entries(rawPairEvidence?.pairs || {}).map(([role, pair]) => ({
        role,
        captures: pair.captures || 0,
        geometry: pair.geometry || {},
        css: pair.css || {},
        behavior: pair.behavior || {},
        visual: pair.visual || {},
        layout: pair.layout || {}
    }));
}

function summarizeFailures(...sources) {
    const entries = sources.flatMap(({ source, values }) => (Array.isArray(values) ? values : []).map((value) => {
        if (typeof value === 'string') return { source, summary: value, resolution: 'No resolution is recorded.' };
        return {
            source,
            summary: value.summary || value.message || value.error || value.reason || JSON.stringify(value),
            resolution: value.resolution || value.resolvedBy || value.outcome || 'No resolution is recorded.',
            evidencePath: value.evidencePath || null
        };
    }));
    return entries.filter((item, index) => entries.findIndex((candidate) => candidate.source === item.source && candidate.summary === item.summary) === index);
}

async function safeReadJson(filePath) {
    try {
        return await readJson(filePath);
    } catch {
        return null;
    }
}

async function readSelectionEvidence(rootDir, runId) {
    const resultPath = path.join(rootDir, 'artifacts', 'compatibility', 'selection', runId, 'results.json');
    const result = await readJson(resultPath);
    if (result.runId !== runId || result.status !== 'build-and-rollback-verified' ||
        result.finalTheme !== 'ext-theme-classic' || result.originalAppJsonSha256 !== result.finalAppJsonSha256 ||
        !Array.isArray(result.sourceHashDifferences) || result.sourceHashDifferences.length !== 0 ||
        !result.sourceHashes || Object.keys(result.sourceHashes).length === 0 ||
        Object.values(result.sourceHashes).some((hash) => typeof hash !== 'string' || !/^[a-f0-9]{64}$/.test(hash)) ||
        typeof result.originalAppJsonSha256 !== 'string' || !/^[a-f0-9]{64}$/.test(result.originalAppJsonSha256)) {
        throw new Error('Selection result does not prove restoration of the original theme and source hashes.');
    }
    const builds = [...(result.replacementBuilds || []), ...(result.rollbackBuilds || [])];
    if (builds.length !== 4) {
        throw new Error('Selection result must include two replacement and two rollback builds.');
    }
    const seen = new Set();
    for (const item of builds) {
        const role = item.role;
        const mode = item.buildMode;
        const expectedTheme = role === 'derived' ? 'theme-classic-modern' : 'ext-theme-classic';
        const key = `${role}/${mode}`;
        if (!['derived', 'rollback'].includes(role) || !['development', 'production'].includes(mode) || seen.has(key)) {
            throw new Error('Selection result has an invalid or duplicate build entry.');
        }
        seen.add(key);
        if (item.exitCode !== 0 || item.selectedTheme !== expectedTheme || !item.manifestPath) {
            throw new Error(`Selection result has an invalid ${key} entry.`);
        }
        const manifestPath = path.resolve(rootDir, item.manifestPath);
        const rootPath = path.resolve(rootDir);
        if (!manifestPath.startsWith(`${rootPath}${path.sep}`)) {
            throw new Error(`Selection manifest path escapes the repository: ${item.manifestPath}.`);
        }
        const manifest = await readJson(manifestPath);
        validateRecord('ThemeBuild', manifest);
        validateBuildManifest(manifest, { buildMode: mode, themeRole: role });
        if (manifest.selectedTheme !== expectedTheme || !sameHashes(manifest.sourceHashes, result.sourceHashes)) {
            throw new Error(`Selection manifest does not match ${key} result evidence.`);
        }
    }
    for (const role of ['derived', 'rollback']) {
        for (const mode of ['development', 'production']) {
            if (!seen.has(`${role}/${mode}`)) throw new Error(`Selection result is missing ${role}/${mode}.`);
        }
    }
    return result;
}

function gateStatus(results, gateId) {
    const statuses = Object.values(results || {}).map((mode) => mode?.gates?.find((gate) => gate.gateId === gateId)?.status).filter(Boolean);
    if (!statuses.length) return gateId === 'G1' ? 'not-run' : 'blocked';
    if (statuses.includes('failed')) return 'failed';
    if (statuses.every((status) => status === 'not-run')) return 'not-run';
    return statuses.every((status) => status === 'passed') ? 'passed' : 'blocked';
}

function criterionStatus(id, { packageCheck, selection, gates, results, hasModernized }) {
    const selectionReady = Boolean(selection?.status === 'build-and-rollback-verified' && selection.replacementBuilds?.length === 2 && selection.rollbackBuilds?.length === 2);
    const g2Passed = gates.G0 === 'passed' && gates.G1 === 'passed' && gates.G2 === 'passed';
    if (id === 'AC-001') return packageCheck?.valid ? 'verified-demo' : 'fail';
    if (id === 'AC-002') return selectionReady ? 'verified-demo' : 'blocked';
    if (id === 'AC-003') return g2Passed ? 'pass' : gates.G2 === 'failed' ? 'fail' : 'blocked';
    if (id === 'AC-004' || id === 'AC-005') return hasModernized ? categoriesFrom(results, 'visual') : 'not-run';
    if (id === 'AC-006') return g2Passed ? categoriesFrom(results, 'geometry') : 'blocked';
    if (id === 'AC-007') return g2Passed ? categoriesFrom(results, 'css') : 'blocked';
    if (id === 'AC-008') return selectionReady ? 'verified-demo' : 'blocked';
    if (id === 'AC-009') return g2Passed ? categoriesFrom(results, 'behavior') : 'blocked';
    if (id === 'AC-010') return g2Passed ? categoriesFrom(results, 'visual') : 'blocked';
    if (id === 'AC-011' || id === 'AC-012') return selectionReady ? 'verified-demo' : 'blocked';
    if (id === 'AC-013') return packageCheck?.valid ? 'verified-demo' : 'fail';
    if (id === 'AC-014') return 'verified-demo';
    return 'not-run';
}

function criterionEvidence(id, runId, selection, selectionRunId) {
    const runPath = `artifacts/compatibility/${runId}`;
    const selectionPath = `artifacts/compatibility/selection/${selectionRunId}`;
    const packagePath = 'TestApp/packages/local/theme-classic-modern/package.json';
    const productionPath = 'specs/001-modernize-classic-theme/evidence/production-inputs.md';
    if (['AC-001', 'AC-013'].includes(id)) return [packagePath, 'TestApp/packages/local/theme-classic-modern/README.md'];
    if (['AC-002', 'AC-008', 'AC-011', 'AC-012'].includes(id) && selection) return [`${selectionPath}/results.json`, `${selectionPath}/development/derived/manifest.json`, `${selectionPath}/production/derived/manifest.json`, `${selectionPath}/development/rollback/manifest.json`, `${selectionPath}/production/rollback/manifest.json`];
    if (id === 'AC-014') return [productionPath, `${runPath}/results.json`];
    const evidence = [`${runPath}/results.json`, productionPath];
    if (['AC-003', 'AC-004', 'AC-005', 'AC-006', 'AC-007', 'AC-009', 'AC-010'].includes(id)) {
        evidence.push(`${runPath}/development/raw-pair-comparison.json`);
    }
    return evidence;
}

function successStatus(criteria, acceptanceCriteria) {
    const statuses = criteria.map((id) => acceptanceCriteria.find((item) => item.id === id)?.status || 'not-run');
    if (statuses.includes('fail')) return 'fail';
    if (statuses.every((status) => status === 'pass')) return 'pass';
    if (statuses.every((status) => status === 'pass' || status === 'verified-demo')) return 'verified-demo';
    if (statuses.every((status) => status === 'not-run')) return 'not-run';
    return 'blocked';
}

function renderMarkdown(report, rootDir) {
    const lines = [
        `# Compatibility report: ${report.runId}`,
        '',
        `Status: ${report.status}.`,
        '',
        '## Acceptance criteria',
        '',
        '| ID | Criterion | Status | Evidence |',
        '| --- | --- | --- | --- |'
    ];
    for (const item of report.acceptanceCriteria) {
        const links = item.evidence.map((file) => `[${file}](${path.relative(path.dirname(report.reportPath), path.resolve(rootDir, file)).replaceAll(path.sep, '/')})`).join(', ');
        lines.push(`| ${item.id} | ${item.name} | ${item.status} | ${links} |`);
    }
    lines.push('', '## Gates', '', '| Gate | Status |', '| --- | --- |');
    for (const gate of report.gates) lines.push(`| ${gate.gateId} | ${gate.status} |`);
    lines.push('', '## Success criteria', '', '| ID | Criterion | Status | Acceptance criteria |', '| --- | --- | --- | --- |');
    for (const item of report.successCriteria) lines.push(`| ${item.id} | ${item.name} | ${item.status} | ${item.criteria.join(', ')} |`);
    lines.push('', '## Environment results', '', '| Build mode | Comparisons | Geometry | CSS | Behavior | Visual |', '| --- | ---: | --- | --- | --- | --- |');
    for (const [mode, item] of Object.entries(report.buildModes)) {
        lines.push(`| ${mode} | ${item.comparisonCount} | ${item.geometry} | ${item.css} | ${item.behavior} | ${item.visual} |`);
    }
    lines.push('', '## Capture environments', '', '| Environment | Browser | Version | Viewport | DPR | Build mode |', '| --- | --- | --- | --- | ---: | --- |');
    if (report.environments.length) {
        for (const item of report.environments) {
            lines.push(`| ${item.environmentId} | ${item.browserEngine} | ${item.browserVersion} | ${item.viewport?.width}x${item.viewport?.height} | ${item.actualDpr} | ${item.buildMode} |`);
        }
    } else {
        lines.push('| No environment records | not recorded | not recorded | not recorded | not recorded | not recorded |');
    }
    lines.push('', '## Raw pair summaries', '', '| Pair | Captures | Geometry (pass/fail/blocked) | CSS (pass/fail) | Behavior (pass/fail) | Visual (pass/fail) | Layout (pass/fail/blocked) |', '| --- | ---: | --- | --- | --- | --- | --- |');
    if (report.rawPairs.length) {
        for (const item of report.rawPairs) {
            lines.push(`| ${item.role} | ${item.captures} | ${item.geometry.pass || 0}/${item.geometry.fail || 0}/${item.geometry.blocked || 0} | ${item.css.pass || 0}/${item.css.fail || 0} | ${item.behavior.pass || 0}/${item.behavior.fail || 0} | ${item.visual.pass || 0}/${item.visual.fail || 0} | ${item.layout.pass || 0}/${item.layout.fail || 0}/${item.layout.blocked || 0} |`);
        }
        lines.push('', 'These summaries do not replace linked formal comparison records or pass blocked gates.');
    } else {
        lines.push('| No raw pair summaries | 0 | blocked | blocked | blocked | blocked | blocked |');
    }
    lines.push('', '## Approved paint differences', '', '| Group | Status | Allowed properties | Scope | Variable files |', '| --- | --- | --- | --- | --- |');
    if (report.approvedPaint.length) {
        for (const item of report.approvedPaint) {
            lines.push(`| ${item.changeId} | ${item.status} | ${item.allowedProperties.join(', ') || 'none'} | ${item.scope} | ${item.variableChanges.join('<br>') || 'none'} |`);
        }
    } else {
        lines.push('| No paint approval record | not-run | none | none | none |');
    }
    lines.push('', 'Approval records define scope. They do not pass visual review or compatibility gates.');
    lines.push('', '## Playwright suites', '', '| Suite | Status | Passed / total | Evidence |', '| --- | --- | ---: | --- |');
    for (const item of report.suiteCoverage.suites) {
        const outcome = item.outcome ? `${item.outcome.passed}/${item.outcome.total}` : '0/0';
        const roleEvidence = item.evidencePaths.map((file) => `[${file}](${path.relative(path.dirname(report.reportPath), path.resolve(rootDir, 'artifacts', 'compatibility', report.runId, file)).replaceAll(path.sep, '/')})`);
        const evidence = ['[suite-results.json](suite-results.json)', ...roleEvidence].join(', ');
        lines.push(`| ${item.displayName} | ${item.status} | ${outcome} | ${evidence} |`);
    }
    lines.push('', '## Failed attempts and resolutions', '', '| Source | Finding | Resolution |', '| --- | --- | --- |');
    if (report.failureHistory.length) {
        for (const item of report.failureHistory) {
            const evidence = item.evidencePath
                ? `[evidence](${path.relative(path.dirname(report.reportPath), path.resolve(rootDir, item.evidencePath)).replaceAll(path.sep, '/')})`
                : 'none';
            lines.push(`| ${item.source} | ${item.summary} | ${item.resolution} ${evidence} |`);
        }
    } else {
        lines.push('| No failed-attempt records supplied | No failure record was present in the run data. | Not applicable. |');
    }
    if (report.rawPairs.length) {
        lines.push('', 'The layout-method experiments and their resolutions are recorded in [T076 layout diagnostics](../../../specs/001-modernize-classic-theme/evidence/t076-layout-diagnostic.md). Synthetic time was rejected because it changed animation timing. Natural-time layout counts remain unstable.');
    }
    lines.push('', '## Limitations', '');
    for (const item of report.limitations) lines.push(`- ${item}`);
    lines.push('', '## Modernization groups', '', '| Group | Sequence | Approval | Comparison |', '| --- | ---: | --- | --- |');
    const groups = report.modernization?.changeGroups || [];
    if (groups.length) {
        for (const group of groups) {
            lines.push(`| ${group.changeId} | ${group.sequence} | ${group.status} | ${group.comparisonStatus || 'not-run'} |`);
        }
    } else {
        lines.push('| No groups recorded |  |  | blocked |');
    }
    lines.push('', '## Modernization case results', '', '| Group | Case | Project | State | Result | Modernized | Rollback | Difference images |', '| --- | --- | --- | --- | --- | --- | --- | --- |');
    const modernizationResults = report.modernization?.results || [];
    if (modernizationResults.length) {
        for (const result of modernizationResults) {
            const links = [
                result.modernized?.screenshot?.differencePath,
                result.rollback?.screenshot?.differencePath
            ].filter(Boolean).map((file) => {
                const href = path.relative(path.dirname(report.reportPath), path.resolve(rootDir, 'artifacts', 'compatibility', report.runId, file)).replaceAll(path.sep, '/');
                return `[${file}](${href})`;
            }).join('<br>') || 'none';
            lines.push(`| ${result.changeId} | ${result.caseId} | ${result.project} | ${result.state} | ${result.status} | ${result.modernized?.status || 'blocked'} | ${result.rollback?.status || 'blocked'} | ${links} |`);
        }
    } else {
        lines.push('| No case results recorded |  |  |  | blocked | blocked | blocked | none |');
    }
    lines.push('', '');
    return lines.join('\n');
}

function renderHtml(report, rootDir) {
    const rows = report.acceptanceCriteria.map((item) => `<tr><td>${escapeHtml(item.id)}</td><td>${escapeHtml(item.name)}</td><td>${escapeHtml(item.status)}</td><td>${item.evidence.map((file) => {
        const href = path.relative(path.dirname(report.reportPath), path.resolve(rootDir, file)).replaceAll(path.sep, '/');
        return `<a href="${escapeHtml(href)}">${escapeHtml(file)}</a>`;
    }).join('<br>')}</td></tr>`).join('');
    const successRows = report.successCriteria.map((item) => `<tr><td>${escapeHtml(item.id)}</td><td>${escapeHtml(item.name)}</td><td>${escapeHtml(item.status)}</td><td>${escapeHtml(item.criteria.join(', '))}</td></tr>`).join('');
    const gates = report.gates.map((gate) => `<li>${escapeHtml(gate.gateId)}: ${escapeHtml(gate.status)}</li>`).join('');
    const limitations = report.limitations.map((item) => `<li>${escapeHtml(item)}</li>`).join('');
    const suiteRows = report.suiteCoverage.suites.map((item) => {
        const outcome = item.outcome ? `${item.outcome.passed}/${item.outcome.total}` : '0/0';
        const roleEvidence = item.evidencePaths.map((file) => {
            const href = path.relative(path.dirname(report.reportPath), path.resolve(rootDir, 'artifacts', 'compatibility', report.runId, file)).replaceAll(path.sep, '/');
            return `<a href="${escapeHtml(href)}">${escapeHtml(file)}</a>`;
        }).join('<br>');
        const evidence = [`<a href="suite-results.json">suite-results.json</a>`, roleEvidence].filter(Boolean).join('<br>');
        return `<tr><td>${escapeHtml(item.displayName)}</td><td>${escapeHtml(item.status)}</td><td>${escapeHtml(outcome)}</td><td>${evidence}</td></tr>`;
    }).join('');
    const groups = report.modernization?.changeGroups || [];
    const groupRows = groups.map((group) => `<tr><td>${escapeHtml(group.changeId)}</td><td>${escapeHtml(group.sequence)}</td><td>${escapeHtml(group.status)}</td><td>${escapeHtml(group.comparisonStatus || 'not-run')}</td></tr>`).join('')
        || '<tr><td colspan="4">No groups recorded; status blocked.</td></tr>';
    const caseRows = (report.modernization?.results || []).map((result) => {
        const differenceLink = (role) => {
            const file = result[role]?.screenshot?.differencePath;
            if (!file) return '';
            const href = path.relative(path.dirname(report.reportPath), path.resolve(rootDir, 'artifacts', 'compatibility', report.runId, file)).replaceAll(path.sep, '/');
            return `<a href="${escapeHtml(href)}">${escapeHtml(role)} difference</a>`;
        };
        return `<tr><td>${escapeHtml(result.changeId)}</td><td>${escapeHtml(result.caseId)}</td><td>${escapeHtml(result.project)}</td><td>${escapeHtml(result.state)}</td><td>${escapeHtml(result.status)}</td><td>${escapeHtml(result.modernized?.status || 'blocked')}</td><td>${escapeHtml(result.rollback?.status || 'blocked')}</td><td>${[differenceLink('modernized'), differenceLink('rollback')].filter(Boolean).join('<br>') || 'none'}</td></tr>`;
    }).join('') || '<tr><td colspan="8">No case results recorded; status blocked.</td></tr>';
    const environmentRows = report.environments.map((item) => `<tr><td>${escapeHtml(item.environmentId)}</td><td>${escapeHtml(item.browserEngine)}</td><td>${escapeHtml(item.browserVersion)}</td><td>${escapeHtml(`${item.viewport?.width}x${item.viewport?.height}`)}</td><td>${escapeHtml(item.actualDpr)}</td><td>${escapeHtml(item.buildMode)}</td></tr>`).join('') || '<tr><td colspan="6">No environment records.</td></tr>';
    const pairRows = report.rawPairs.map((item) => `<tr><td>${escapeHtml(item.role)}</td><td>${escapeHtml(item.captures)}</td><td>${escapeHtml(`${item.geometry.pass || 0}/${item.geometry.fail || 0}/${item.geometry.blocked || 0}`)}</td><td>${escapeHtml(`${item.css.pass || 0}/${item.css.fail || 0}`)}</td><td>${escapeHtml(`${item.behavior.pass || 0}/${item.behavior.fail || 0}`)}</td><td>${escapeHtml(`${item.visual.pass || 0}/${item.visual.fail || 0}`)}</td><td>${escapeHtml(`${item.layout.pass || 0}/${item.layout.fail || 0}/${item.layout.blocked || 0}`)}</td></tr>`).join('') || '<tr><td colspan="7">No raw pair summaries.</td></tr>';
    const paintRows = report.approvedPaint.map((item) => `<tr><td>${escapeHtml(item.changeId)}</td><td>${escapeHtml(item.status)}</td><td>${escapeHtml(item.allowedProperties.join(', ') || 'none')}</td><td>${escapeHtml(item.scope)}</td><td>${escapeHtml(item.variableChanges.join(', ') || 'none')}</td></tr>`).join('') || '<tr><td colspan="5">No paint approval record.</td></tr>';
    const failureRows = report.failureHistory.map((item) => {
        const evidence = item.evidencePath ? ` <a href="${escapeHtml(path.relative(path.dirname(report.reportPath), path.resolve(rootDir, item.evidencePath)).replaceAll(path.sep, '/'))}">evidence</a>` : '';
        return `<tr><td>${escapeHtml(item.source)}</td><td>${escapeHtml(item.summary)}</td><td>${escapeHtml(item.resolution)}${evidence}</td></tr>`;
    }).join('') || '<tr><td colspan="3">No failed-attempt records supplied.</td></tr>';
    return `<!doctype html><html lang="en"><meta charset="utf-8"><title>${escapeHtml(report.runId)} compatibility report</title><h1>Compatibility report: ${escapeHtml(report.runId)}</h1><p>Status: ${escapeHtml(report.status)}</p><h2>Acceptance criteria</h2><table><thead><tr><th>ID</th><th>Criterion</th><th>Status</th><th>Evidence</th></tr></thead><tbody>${rows}</tbody></table><h2>Success criteria</h2><table><thead><tr><th>ID</th><th>Criterion</th><th>Status</th><th>Acceptance criteria</th></tr></thead><tbody>${successRows}</tbody></table><h2>Gates</h2><ul>${gates}</ul><h2>Environment results</h2><table><thead><tr><th>Build mode</th><th>Comparisons</th><th>Geometry</th><th>CSS</th><th>Behavior</th><th>Visual</th></tr></thead><tbody>${Object.entries(report.buildModes).map(([mode, item]) => `<tr><td>${escapeHtml(mode)}</td><td>${escapeHtml(item.comparisonCount)}</td><td>${escapeHtml(item.geometry)}</td><td>${escapeHtml(item.css)}</td><td>${escapeHtml(item.behavior)}</td><td>${escapeHtml(item.visual)}</td></tr>`).join('')}</tbody></table><h2>Capture environments</h2><table><thead><tr><th>Environment</th><th>Browser</th><th>Version</th><th>Viewport</th><th>DPR</th><th>Build mode</th></tr></thead><tbody>${environmentRows}</tbody></table><h2>Raw pair summaries</h2><table><thead><tr><th>Pair</th><th>Captures</th><th>Geometry</th><th>CSS</th><th>Behavior</th><th>Visual</th><th>Layout</th></tr></thead><tbody>${pairRows}</tbody></table><h2>Approved paint differences</h2><table><thead><tr><th>Group</th><th>Status</th><th>Properties</th><th>Scope</th><th>Variable files</th></tr></thead><tbody>${paintRows}</tbody></table><h2>Playwright suites</h2><table><thead><tr><th>Suite</th><th>Status</th><th>Passed / total</th><th>Evidence</th></tr></thead><tbody>${suiteRows}</tbody></table><h2>Failed attempts and resolutions</h2><table><thead><tr><th>Source</th><th>Finding</th><th>Resolution</th></tr></thead><tbody>${failureRows}</tbody></table><h2>Limitations</h2><ul>${limitations}</ul><h2>Modernization groups</h2><table><thead><tr><th>Group</th><th>Sequence</th><th>Approval</th><th>Comparison</th></tr></thead><tbody>${groupRows}</tbody></table><h2>Modernization case results</h2><table><thead><tr><th>Group</th><th>Case</th><th>Project</th><th>State</th><th>Result</th><th>Modernized</th><th>Rollback</th><th>Difference images</th></tr></thead><tbody>${caseRows}</tbody></table></html>`;
}

export async function createReport({ runId, selectionRunId = null, rootDir = root } = {}) {
    assertSafeRunId(runId);
    if (selectionRunId !== null) assertSafeRunId(selectionRunId);
    const runRoot = path.join(rootDir, 'artifacts', 'compatibility', runId);
    const combined = await safeReadJson(path.join(runRoot, 'results.json')) || { schemaVersion: 1, runId, buildModes: {} };
    const buildModes = combined.buildModes || {};
    const modernization = await safeReadJson(path.join(runRoot, 'modernization-results.json'));
    let selection = null;
    let selectionError = null;
    if (selectionRunId) {
        try {
            selection = await readSelectionEvidence(rootDir, selectionRunId);
        } catch (error) {
            selectionError = error.message;
        }
    }
    const packagePath = path.join(rootDir, 'TestApp', 'packages', 'local', 'theme-classic-modern');
    let packageCheck;
    try {
        packageCheck = await validatePackageDirectory(packagePath);
    } catch {
        packageCheck = { valid: false };
    }
    const productionInputs = await safeReadJson(path.join(runRoot, 'production-inputs.json'));
    const suiteEvidence = await safeReadJson(path.join(runRoot, 'suite-results.json'));
    const environmentEvidence = await safeReadJson(path.join(runRoot, 'environments.json'));
    const rawPairEvidence = await safeReadJson(path.join(runRoot, 'development', 'raw-pair-comparison.json'));
    const approvalEvidence = await safeReadJson(path.join(runRoot, 'approvals.json'));
    const failureHistoryEvidence = await safeReadJson(path.join(runRoot, 'failure-history.json'));
    const suiteCoverage = summarizeSuiteCoverage(suiteEvidence, runId);
    const environments = summarizeEnvironments(environmentEvidence);
    const rawPairs = summarizeRawPairs(rawPairEvidence);
    const g0 = productionInputs?.status === 'verified' ? 'passed' : 'blocked';
    const gates = {
        G0: g0,
        G1: gateStatus(buildModes, 'G1'),
        G2: gateStatus(buildModes, 'G2'),
        G3: gateStatus(buildModes, 'G3'),
        G4: gateStatus(buildModes, 'G4')
    };
    const hasModernized = Boolean(modernization?.changeGroups?.length)
        || Object.values(buildModes).some((mode) => (mode?.results || []).some((result) => result.role === 'modernized'));
    const results = Object.fromEntries(['development', 'production'].map((mode) => [mode, modeResult(buildModes, mode)]));
    const acceptanceCriteria = criterionNames.map((name, index) => {
        const id = `AC-${String(index + 1).padStart(3, '0')}`;
        return { id, name, status: criterionStatus(id, { packageCheck, selection, gates, results, hasModernized }), evidence: criterionEvidence(id, runId, selection, selectionRunId) };
    });
    const successCriteriaWithStatus = successCriteria.map((item) => ({ ...item, status: item.id === 'SC-008' ? 'verified-demo' : successStatus(item.criteria, acceptanceCriteria) }));
    const summaryBuildModes = {};
    for (const mode of ['development', 'production']) {
        const current = results[mode];
        const entries = current?.results || [];
        summaryBuildModes[mode] = {
            comparisonCount: entries.length,
            geometry: entries.length ? categoriesFrom({ [mode]: current }, 'geometry') : 'blocked',
            css: entries.length ? categoriesFrom({ [mode]: current }, 'css') : 'blocked',
            behavior: entries.length ? categoriesFrom({ [mode]: current }, 'behavior') : 'blocked',
            visual: entries.length ? categoriesFrom({ [mode]: current }, 'visual') : 'blocked'
        };
    }
    const limitations = [
        productionInputs?.status === 'verified' ? 'Production inputs are verified for this run.' : 'Production input validation is deferred to the next independent spec. G0 remains blocked for production readiness.',
        selectionError ? `Selection evidence is invalid. ${selectionError}` : selection ? 'Selection and rollback evidence passed its manifest checks.' : 'Selection and rollback evidence was not supplied. Do not accept AC-002.',
        ...(suiteCoverage.status === 'complete' ? [] : [`CSS compatibility and interaction suites are incomplete. ${suiteCoverage.validationError || 'See suite-results.json.'} Do not accept G1 or G2.`]),
        ...(rawPairs.length ? ['Raw pair summaries are diagnostic unless the formal comparison records link the same captures and manifests. Review their blocked counts and differences below.'] : []),
        'Firefox layout-shift records do not measure every layout pass. Keep affected acceptance blocked.',
        'Sencha Cmd build logs report missing navigation theme images. Review the build logs before visual acceptance.',
        modernization ? `Modernization comparison status is ${modernization.status || 'blocked'}; see the group and case results below.` : 'Modernization comparison evidence was not supplied for this run.',
        'Demo build results do not prove production compatibility.'
    ];
    const failureHistory = summarizeFailures(
        { source: 'project history', values: failureHistoryEvidence?.failures || [] },
        { source: 'comparison run', values: [...(combined.historicalFailures || []), ...Object.values(buildModes).flatMap((mode) => [...(mode?.errors || []), ...(mode?.historicalFailures || [])])] },
        { source: 'modernization run', values: [...(modernization?.errors || []), ...(modernization?.historicalFailures || [])] }
    );
    const approvedPaint = (approvalEvidence?.changeGroups || []).map((group) => ({
        changeId: group.changeId,
        status: group.status,
        allowedProperties: group.approval?.allowedProperties || [],
        scope: group.approval?.scope || 'Approval scope not recorded.',
        variableChanges: group.variableChanges || []
    }));
    const report = {
        schemaVersion: 1,
        runId,
        status: gates.G0 === 'passed' && gates.G1 === 'passed' && gates.G2 === 'passed' && gates.G3 === 'passed' && gates.G4 === 'passed' ? 'passed' : 'blocked',
        gates: Object.entries(gates).map(([gateId, status]) => ({ gateId, status })),
        buildModes: summaryBuildModes,
        suiteCoverage,
        environments,
        rawPairs,
        approvedPaint,
        failureHistory,
        modernization,
        acceptanceCriteria,
        successCriteria: successCriteriaWithStatus,
        limitations,
        reportPath: path.join(runRoot, 'compatibility-report.md')
    };
    await mkdir(runRoot, { recursive: true });
    const markdownPath = path.join(runRoot, 'compatibility-report.md');
    const htmlPath = path.join(runRoot, 'report.html');
    const summaryPath = path.join(runRoot, 'report-summary.json');
    await writeFile(markdownPath, renderMarkdown(report, rootDir), 'utf8');
    await writeFile(htmlPath, renderHtml(report, rootDir), 'utf8');
    await writeFile(summaryPath, `${JSON.stringify(report, null, 4)}\n`, 'utf8');
    const resultsPath = path.join(runRoot, 'results.json');
    const currentResults = await safeReadJson(resultsPath);
    if (currentResults) {
        await writeFile(resultsPath, `${JSON.stringify({ ...currentResults, reportPath: 'compatibility-report.md', reportStatus: report.status }, null, 4)}\n`, 'utf8');
    }
    return { report, markdownPath, htmlPath, summaryPath };
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
    try {
        const runId = process.env.COMPAT_RUN;
        if (!runId) throw new Error('Set COMPAT_RUN before creating the report.');
        const result = await createReport({ runId, selectionRunId: process.env.COMPAT_SELECTION_RUN || null });
        console.log(`Report status: ${result.report.status}.`);
        if (result.report.status !== 'passed') process.exitCode = 1;
    } catch (error) {
        console.error(error.message);
        process.exitCode = 2;
    }
}
