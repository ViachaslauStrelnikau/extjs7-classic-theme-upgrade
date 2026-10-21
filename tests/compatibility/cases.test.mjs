import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { mkdtemp, readFile, rm } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import test from 'node:test';
import { createCasesDocument, requiredComponentFamilies, writeCases } from './cases.mjs';
import { sha256File } from './evidence.mjs';

const sourceRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const expectedFamilies = [
    'buttons and toolbars', 'panels and headers', 'grids', 'trees', 'forms and validation',
    'tabs', 'menus', 'windows and dialogs', 'tooltips and floating elements', 'scrollable containers'
];

test('maps each required component family to stable cases and states', async () => {
    assert.deepEqual(requiredComponentFamilies(), expectedFamilies);
    const document = await createCasesDocument({ runId: 'coverage-check', sourceRoot, timestamp: '2026-10-20T00:00:00Z' });
    assert.equal(document.schemaVersion, 1);
    assert.equal(document.cases.length, expectedFamilies.length);
    for (const item of document.cases) {
        assert.ok(item.states.length > 0, `${item.caseId} has states`);
        assert.ok(item.targetElements.length > 0, `${item.caseId} has target elements`);
        assert.ok(item.targetElements.every((target) => target.componentQuery || target.domSelector), `${item.caseId} has stable targets`);
        assert.match(item.dataHash, /^[a-f0-9]{64}$/);
        assert.ok(item.protectedProperties.includes('width'));
        assert.ok(item.protectedProperties.includes('font-family'));
    }
    const allStates = new Set(document.cases.flatMap((item) => item.states));
    for (const state of ['normal', 'hover', 'focused', 'selected', 'disabled', 'invalid', 'read-only', 'scrolled']) {
        assert.ok(allStates.has(state), `coverage includes ${state}`);
    }

    const gridCase = document.cases.find((item) => item.caseId === 'grids');
    const gridSourceHashes = await Promise.all([
        'TestApp/app/view/compatibility/DataViews.js',
        'TestApp/app/view/compatibility/FixtureData.js'
    ].map((source) => sha256File(path.join(sourceRoot, source))));
    assert.equal(gridCase.dataHash, createHash('sha256').update(gridSourceHashes.join('\n')).digest('hex'));
    assert.ok(document.cases.find((item) => item.caseId === 'tabs').targetElements
        .some((target) => target.componentQuery === '#compatibility-lab-tab'));
    assert.ok(document.cases.find((item) => item.caseId === 'scrollable-containers').targetElements
        .some((target) => target.domSelector === '.compatibility-scroll-body'));
});

test('writes immutable run cases with source hashes', async () => {
    const artifactRoot = await mkdtemp(path.join(os.tmpdir(), 'compatibility-cases-'));
    try {
        const { outputPath, document } = await writeCases({ runId: 'run-001', artifactRoot, sourceRoot, timestamp: '2026-10-20T00:00:00Z' });
        const saved = JSON.parse(await readFile(outputPath, 'utf8'));
        assert.deepEqual(saved, document);
        await assert.rejects(writeCases({ runId: 'run-001', artifactRoot, sourceRoot, timestamp: '2026-10-20T00:00:00Z' }), { code: 'EEXIST' });
    } finally {
        await rm(artifactRoot, { recursive: true, force: true });
    }
});
