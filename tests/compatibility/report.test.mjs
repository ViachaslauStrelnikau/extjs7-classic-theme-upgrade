import assert from 'node:assert/strict';
import { mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import test from 'node:test';
import { createReport } from './report.mjs';

const hash = 'a'.repeat(64);

function manifest(role, buildMode) {
    const selectedTheme = role === 'derived' ? 'theme-classic-modern' : 'ext-theme-classic';
    const packageName = role === 'derived' ? 'theme-classic-modern' : 'theme-classic';
    const parentChain = role === 'derived'
        ? ['theme-classic-modern', 'theme-classic', 'theme-neutral', 'theme-base']
        : ['theme-classic', 'theme-neutral', 'theme-base'];
    return {
        schemaVersion: 1,
        buildId: `selection-${role}-${buildMode}`,
        themeRole: role,
        selectedTheme,
        packageName,
        packageVersion: '1.0.0',
        parentChain,
        sourceHashes: { 'TestApp/app.js': hash },
        fixtureHash: hash,
        inputSetId: 'production-inputs-missing',
        buildMode,
        command: `sencha app build ${buildMode}`,
        exitCode: 0,
        logPath: 'build.log',
        outputHashes: { 'TestApp-all.css': hash },
        authoredPaintRules: false,
        replacementAssets: []
    };
}

test('reports blocked gates and unverified criteria when evidence is absent', async () => {
    const rootDir = await mkdtemp(path.join(os.tmpdir(), 'compatibility-report-'));
    try {
        const result = await createReport({ runId: 'report-blocked', rootDir });
        assert.equal(result.report.status, 'blocked');
        assert.deepEqual(result.report.gates.map((gate) => gate.status), ['blocked', 'not-run', 'blocked', 'blocked', 'blocked']);
        assert.equal(result.report.acceptanceCriteria.length, 14);
        assert.equal(result.report.successCriteria.length, 8);
        assert.equal(result.report.acceptanceCriteria.find((item) => item.id === 'AC-003').status, 'blocked');
        assert.equal(result.report.acceptanceCriteria.find((item) => item.id === 'AC-004').status, 'not-run');
        assert.match(await readFile(result.markdownPath, 'utf8'), /Production CSS/);
        assert.match(await readFile(result.htmlPath, 'utf8'), /AC-014/);
    } finally {
        await rm(rootDir, { recursive: true, force: true });
    }
});

test('reports completed compatibility suites with linked evidence', async () => {
    const rootDir = await mkdtemp(path.join(os.tmpdir(), 'compatibility-report-suites-'));
    try {
        const runId = 'report-suites-complete';
        const runRoot = path.join(rootDir, 'artifacts', 'compatibility', runId);
        await mkdir(runRoot, { recursive: true });
        const suiteNames = ['capture.spec.js', 'css-contract.spec.js', 'interactions.spec.js'];
        const suites = suiteNames.map((suite) => ({
            suite,
            status: 'completed',
            outcome: { total: 4, passed: 4, failed: 0, skipped: 0, flaky: 0 },
            evidencePaths: [`development/original/suite-results/${suite}.json`]
        }));
        await writeFile(path.join(runRoot, 'suite-results.json'), JSON.stringify({ schemaVersion: 1, runId, suites }));

        const result = await createReport({ runId, rootDir });
        assert.equal(result.report.suiteCoverage.status, 'complete');
        assert.deepEqual(result.report.suiteCoverage.suites.map((item) => item.status), ['completed', 'completed', 'completed']);
        assert.ok(!result.report.limitations.some((item) => item.includes('CSS compatibility and interaction suites remain incomplete')));
        const markdown = await readFile(result.markdownPath, 'utf8');
        assert.match(markdown, /## Playwright suites/);
        assert.match(markdown, /development\/original\/suite-results\/css-contract\.spec\.js\.json/);
        assert.match(await readFile(result.htmlPath, 'utf8'), /CSS contract suite/);
    } finally {
        await rm(rootDir, { recursive: true, force: true });
    }
});

test('links selection and rollback evidence to the selected run', async () => {
    const rootDir = await mkdtemp(path.join(os.tmpdir(), 'compatibility-selection-report-'));
    try {
        const selectionRoot = path.join(rootDir, 'artifacts', 'compatibility', 'selection', 'selection-verified');
        await mkdir(selectionRoot, { recursive: true });
        const sourceHashes = { 'TestApp/app.js': hash };
        const buildEntries = [];
        for (const [role, themeName] of [['derived', 'theme-classic-modern'], ['rollback', 'ext-theme-classic']]) {
            for (const buildMode of ['development', 'production']) {
                const buildManifest = manifest(role, buildMode);
                const manifestPath = `artifacts/compatibility/selection/selection-verified/${buildMode}/${role}/manifest.json`;
                const outputPath = path.join(rootDir, manifestPath);
                await mkdir(path.dirname(outputPath), { recursive: true });
                await writeFile(outputPath, JSON.stringify(buildManifest));
                buildEntries.push({ role, buildMode, selectedTheme: themeName, exitCode: 0, manifestPath });
            }
        }
        await writeFile(
            path.join(selectionRoot, 'results.json'),
            JSON.stringify({
                runId: 'selection-verified', status: 'build-and-rollback-verified',
                finalTheme: 'ext-theme-classic',
                originalAppJsonSha256: hash, finalAppJsonSha256: hash,
                sourceHashes, sourceHashDifferences: [],
                replacementBuilds: buildEntries.filter((item) => item.role === 'derived'),
                rollbackBuilds: buildEntries.filter((item) => item.role === 'rollback')
            })
        );
        const result = await createReport({ runId: 'report-selection', selectionRunId: 'selection-verified', rootDir });
        const criterion = result.report.acceptanceCriteria.find((item) => item.id === 'AC-002');
        assert.equal(criterion.status, 'verified-demo');
        assert.ok(criterion.evidence.every((file) => file.includes('/selection/selection-verified/')));
        assert.match(await readFile(result.htmlPath, 'utf8'), /\.\.\/selection\/selection-verified\/results\.json/);
        const badManifestPath = path.join(rootDir, 'artifacts', 'compatibility', 'selection', 'selection-verified', 'development', 'derived', 'manifest.json');
        await writeFile(badManifestPath, JSON.stringify({ invalid: true }));
        const invalid = await createReport({ runId: 'report-selection-invalid', selectionRunId: 'selection-verified', rootDir });
        assert.equal(invalid.report.acceptanceCriteria.find((item) => item.id === 'AC-002').status, 'blocked');
        assert.ok(invalid.report.limitations.some((item) => item.startsWith('Selection evidence is invalid.')));
    } finally {
        await rm(rootDir, { recursive: true, force: true });
    }
});

test('reports modernization groups, case outcomes, rollback, and difference images', async () => {
    const rootDir = await mkdtemp(path.join(os.tmpdir(), 'compatibility-modernization-report-'));
    try {
        const runId = 'modernization-report';
        const runRoot = path.join(rootDir, 'artifacts', 'compatibility', runId);
        await mkdir(runRoot, { recursive: true });
        await writeFile(path.join(runRoot, 'modernization-results.json'), JSON.stringify({
            schemaVersion: 1,
            runId,
            buildMode: 'development',
            status: 'blocked',
            gates: [{ gateId: 'G0', status: 'blocked' }, { gateId: 'G2', status: 'blocked' }, { gateId: 'G3', status: 'blocked' }],
            errors: [],
            changeGroups: [{ changeId: 'paint-controls', sequence: 1, status: 'implemented', comparisonStatus: 'blocked' }],
            results: [{
                changeId: 'paint-controls', caseId: 'field-text', project: 'chromium-dpr1', state: 'invalid', status: 'blocked',
                modernized: { status: 'blocked', geometry: { status: 'blocked' }, css: { status: 'blocked' }, behavior: { status: 'blocked' }, visual: { status: 'blocked' }, screenshot: { differencePath: 'differences/development/chromium-dpr1/field-text/invalid/paint-controls-modernized.png' } },
                rollback: { status: 'failed', geometry: { status: 'pass' }, css: { status: 'fail' }, behavior: { status: 'pass' }, visual: { status: 'fail' }, screenshot: { differencePath: 'differences/development/chromium-dpr1/field-text/invalid/paint-controls-rollback.png' } }
            }],
            historicalFailures: []
        }));

        const result = await createReport({ runId, rootDir });
        assert.equal(result.report.status, 'blocked');
        assert.equal(result.report.modernization.changeGroups[0].comparisonStatus, 'blocked');
        assert.match(result.report.limitations.join(' '), /Modernization comparison status is blocked/);
        assert.doesNotMatch(result.report.limitations.join(' '), /theme package has no visual changes/i);
        const markdown = await readFile(result.markdownPath, 'utf8');
        assert.match(markdown, /paint-controls/);
        assert.match(markdown, /field-text/);
        assert.match(markdown, /failed/);
        assert.match(markdown, /paint-controls-modernized\.png/);
        assert.match(markdown, /paint-controls-rollback\.png/);
        const html = await readFile(result.htmlPath, 'utf8');
        assert.match(html, /Modernization case results/);
        assert.match(html, /paint-controls-rollback\.png/);
    } finally {
        await rm(rootDir, { recursive: true, force: true });
    }
});
