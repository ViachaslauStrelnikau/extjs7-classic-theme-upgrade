import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import { assertOnlyThemeChange, assertSameSourceHashes, validateBuildResult } from './selection-contract.mjs';

test('allows only the standard app.json theme selection to change', () => {
    const original = '{\n    "theme": "ext-theme-classic",\n    "toolkit": "classic"\n}\n';
    const replacement = '{\n    "theme": "theme-classic-modern",\n    "toolkit": "classic"\n}\n';
    assert.equal(assertOnlyThemeChange(original, replacement, 'ext-theme-classic', 'theme-classic-modern'), true);
    assert.throws(() => assertOnlyThemeChange(original, replacement.replace('classic', 'modern'), 'ext-theme-classic', 'theme-classic-modern'), /expected theme values/);
    assert.throws(() => assertOnlyThemeChange(original, replacement.replace('"classic"', '"modern"'), 'ext-theme-classic', 'theme-classic-modern'), /outside the theme value/);
});

test('keeps component and legacy CSS hashes unchanged during selection and rollback', () => {
    const source = { 'TestApp/app/view/main/Main.js': 'a', 'TestApp/resources/css/legacy.css': 'b' };
    assert.equal(assertSameSourceHashes(source, { ...source }), true);
    assert.throws(() => assertSameSourceHashes(source, { ...source, 'TestApp/resources/css/legacy.css': 'changed' }), /legacy\.css/);
});

test('rejects failed, mismatched, and stale build manifests', () => {
    const valid = { exitCode: 0, selectedTheme: 'theme-classic-modern', buildMode: 'development', outputHashes: { 'app.css': 'a'.repeat(64) } };
    assert.equal(validateBuildResult(valid, 'theme-classic-modern', 'development'), true);
    assert.throws(() => validateBuildResult({ ...valid, exitCode: 1 }, 'theme-classic-modern', 'development'), /did not pass/);
    assert.throws(() => validateBuildResult({ ...valid, selectedTheme: 'ext-theme-classic' }, 'theme-classic-modern', 'development'), /does not match/);
    assert.throws(() => validateBuildResult({ ...valid, outputHashes: {} }, 'theme-classic-modern', 'development'), /no output hashes/);
});

test('the existing demo selects theme-classic-modern for visual review', async () => {
    const appJson = await readFile(new URL('../../TestApp/app.json', import.meta.url), 'utf8');
    assert.match(appJson, /"theme"\s*:\s*"theme-classic-modern"/);
});
