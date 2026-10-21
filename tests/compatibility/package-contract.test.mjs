import assert from 'node:assert/strict';
import { mkdtemp, mkdir, rm, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import test from 'node:test';
import { findAuthoredJavaScript, validatePackageDirectory, validateThemePackage } from './package-contract.mjs';

const validPackage = {
    name: 'theme-classic-modern',
    sencha: {
        type: 'theme',
        toolkit: 'classic',
        extend: 'theme-classic',
        version: '1.0.0',
        sass: { namespace: 'Ext' },
        requires: []
    }
};

test('accepts the Sencha Cmd generated theme metadata shape', () => {
    assert.deepEqual(validateThemePackage(validPackage, { productionParentVerified: true }), {
        valid: true, baselineEligible: true, errors: [], parentVerified: true
    });
});

test('keeps the candidate package blocked until production inheritance is verified', () => {
    const result = validateThemePackage(validPackage);
    assert.equal(result.valid, true);
    assert.equal(result.baselineEligible, false);
    assert.equal(result.parentVerified, false);
});

test('rejects invalid package metadata before package creation', () => {
    const invalid = validateThemePackage({ ...validPackage, sencha: { ...validPackage.sencha, toolkit: 'modern', type: 'application' } });
    assert.equal(invalid.valid, false);
    assert.match(invalid.errors.join(' '), /type must be theme/);
    assert.match(invalid.errors.join(' '), /toolkit must be classic/);
});

test('rejects test dependencies and an unverified parent candidate', () => {
    const invalid = validateThemePackage({
        ...validPackage,
        dependencies: { playwright: '1.0.0' },
        sencha: { ...validPackage.sencha, extend: 'theme-material', requires: ['TestApp'] }
    });
    assert.equal(invalid.valid, false);
    assert.match(invalid.errors.join(' '), /parent candidate/);
    assert.match(invalid.errors.join(' '), /must not depend/);
});

test('allows the generated theme identity marker and rejects component override files', async () => {
    const root = await mkdtemp(path.join(os.tmpdir(), 'theme-package-'));
    try {
        const overrides = path.join(root, 'overrides');
        await mkdir(overrides);
        await writeFile(path.join(overrides, 'init.js'), "Ext.namespace('Ext.theme.is')['theme-classic-modern'] = true;\nExt.theme.name = 'theme-classic-modern';\n");
        assert.deepEqual(await findAuthoredJavaScript(root), []);
        await writeFile(path.join(overrides, 'Panel.js'), "Ext.define('Ext.theme.classic.modern.Panel', { override: 'Ext.panel.Panel' });\n");
        assert.deepEqual(await findAuthoredJavaScript(root), ['overrides/Panel.js']);
    } finally {
        await rm(root, { recursive: true, force: true });
    }
});

test('validates the generated Sencha Cmd package and keeps baseline acceptance blocked', async () => {
    const packageRoot = fileURLToPath(new URL('../../TestApp/packages/local/theme-classic-modern/', import.meta.url));
    const result = await validatePackageDirectory(packageRoot);
    assert.equal(result.valid, true, result.errors.join('\n'));
    assert.equal(result.baselineEligible, false);
    assert.equal(result.parentVerified, false);
});
