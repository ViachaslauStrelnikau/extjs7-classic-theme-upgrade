import assert from 'node:assert/strict';
import { mkdtemp, readFile, rm } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import {
    assertCapturePathAvailable,
    buildRoleForCapture,
    parseCaptureInputs,
    validateBuildManifest,
    validateCapturePair
} from './evidence.mjs';

const hash = 'c'.repeat(64);
const validEnv = {
    COMPAT_RUN: 'baseline-002', COMPAT_THEME: 'original-repeat', COMPAT_PHASE: 'baseline',
    COMPAT_BUILD_MODE: 'development', COMPAT_BASE_URL: 'http://localhost:1841/'
};

test('exposes evidence comparison and report commands', async () => {
    const packageJson = JSON.parse(await readFile(new URL('../../package.json', import.meta.url), 'utf8'));
    assert.equal(packageJson.scripts['compat:compare'], 'node tests/compatibility/compare.mjs');
    assert.equal(packageJson.scripts['compat:report'], 'node tests/compatibility/report.mjs');
});

test('requires each COMPAT input and validates values', () => {
    for (const key of Object.keys(validEnv)) {
        const env = { ...validEnv };
        delete env[key];
        assert.throws(() => parseCaptureInputs(env), new RegExp(key));
    }
    assert.equal(parseCaptureInputs(validEnv).suiteStage, 'us2');
    assert.equal(parseCaptureInputs({ ...validEnv, COMPAT_SUITE_STAGE: 'us3' }).suiteStage, 'us3');
    assert.throws(() => parseCaptureInputs({ ...validEnv, COMPAT_PHASE: 'accept' }), /COMPAT_PHASE/);
    assert.throws(() => parseCaptureInputs({ ...validEnv, COMPAT_BUILD_MODE: 'test' }), /COMPAT_BUILD_MODE/);
    assert.throws(() => parseCaptureInputs({ ...validEnv, COMPAT_BASE_URL: 'file:///app' }), /HTTP or HTTPS/);
});

test('maps original-repeat to the original theme build', () => {
    assert.equal(buildRoleForCapture('original-repeat'), 'original');
    const manifest = {
        exitCode: 0, buildMode: 'development', themeRole: 'original', selectedTheme: 'ext-theme-classic',
        packageName: 'theme-classic', parentChain: ['theme-classic', 'theme-neutral', 'theme-base'],
        sourceHashes: { 'TestApp/app.json': hash }, outputHashes: { 'TestApp-all.css': hash }
    };
    assert.equal(validateBuildManifest(manifest, parseCaptureInputs(validEnv)), manifest);
    assert.throws(() => validateBuildManifest(null, parseCaptureInputs(validEnv)), /missing/);
    assert.throws(() => validateBuildManifest({ ...manifest, exitCode: 1 }, parseCaptureInputs(validEnv)), /successful build/);
    assert.throws(() => validateBuildManifest({ ...manifest, buildMode: 'production' }, parseCaptureInputs(validEnv)), /does not match/);
});

test('rejects duplicate captures and captures from different environments or build modes', async () => {
    const directory = await mkdtemp(path.join(os.tmpdir(), 'theme-capture-'));
    try {
        const captureFile = path.join(directory, 'capture.json');
        assert.equal(await assertCapturePathAvailable(captureFile), true);
        const { writeFile } = await import('node:fs/promises');
        await writeFile(captureFile, '{}');
        await assert.rejects(assertCapturePathAvailable(captureFile), /already exists/);
        const original = { environmentId: 'chromium-dpr1-dev', caseId: 'grid-basic', state: 'normal', buildMode: 'development' };
        assert.equal(validateCapturePair(original, { ...original }), true);
        assert.throws(() => validateCapturePair(original, { ...original, environmentId: 'firefox-dpr1-dev' }), /environmentId/);
        assert.throws(() => validateCapturePair(original, { ...original, buildMode: 'production' }), /buildMode/);
        assert.throws(() => validateCapturePair(original, { ...original, caseId: 'tree-basic' }), /caseId/);
    } finally {
        await rm(directory, { recursive: true, force: true });
    }
});
