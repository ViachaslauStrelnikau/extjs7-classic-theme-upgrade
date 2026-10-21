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
