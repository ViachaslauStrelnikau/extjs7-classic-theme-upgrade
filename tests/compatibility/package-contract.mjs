import { readFile, readdir, stat } from 'node:fs/promises';
import path from 'node:path';
import { readJsonc } from './jsonc.mjs';

export function validateThemePackage(manifest, { productionParentVerified = false } = {}) {
    const errors = [];
    if (!manifest || typeof manifest !== 'object' || Array.isArray(manifest)) {
        return { valid: false, baselineEligible: false, errors: ['Package metadata must be an object.'] };
    }
    if (manifest.name !== 'theme-classic-modern') {
        errors.push('Package name must be theme-classic-modern.');
    }
    const cmd = manifest.sencha;
    if (!cmd || typeof cmd !== 'object') {
        errors.push('Package metadata must use the generated sencha configuration object.');
        return { valid: false, baselineEligible: false, errors, parentVerified: productionParentVerified };
    }
    if (cmd.type !== 'theme') {
        errors.push('Package type must be theme.');
    }
    if (cmd.toolkit !== 'classic') {
        errors.push('Package toolkit must be classic.');
    }
    if (cmd.extend !== 'theme-classic') {
        errors.push('The demo package parent candidate must be theme-classic.');
    }
    if (!cmd.sass || cmd.sass.namespace !== 'Ext') {
        errors.push('The Sass namespace must be Ext.');
    }
    const requiredPackages = Array.isArray(cmd.requires)
        ? cmd.requires
        : cmd.requires && typeof cmd.requires === 'object' ? Object.keys(cmd.requires) : [];
    if (manifest.dependencies || requiredPackages.some((name) => /testapp|compat|playwright/i.test(typeof name === 'string' ? name : name.name))) {
        errors.push('The theme package must not depend on the demo or test harness.');
    }
    return {
        valid: errors.length === 0,
        baselineEligible: errors.length === 0 && productionParentVerified,
        errors,
        parentVerified: productionParentVerified
    };
}

export async function findAuthoredJavaScript(packageRoot, packageName = 'theme-classic-modern') {
    const matches = [];
    async function visit(directory) {
        let entries;
        try {
            entries = await readdir(directory, { withFileTypes: true });
        } catch (error) {
            if (error.code === 'ENOENT') {
                return;
            }
            throw error;
        }
        for (const entry of entries) {
            const fullPath = path.join(directory, entry.name);
            if (entry.isDirectory()) {
                await visit(fullPath);
            } else if (entry.isFile() && /\.m?js$/i.test(entry.name)) {
                const relativePath = path.relative(packageRoot, fullPath).replaceAll(path.sep, '/');
                const contents = await readFile(fullPath, 'utf8');
                const marker = new RegExp(`^Ext\\.namespace\\('Ext\\.theme\\.is'\\)\\['${packageName}'\\]\\s*=\\s*true;\\s*Ext\\.theme\\.name\\s*=\\s*'${packageName}';\\s*$`);
                if (!(relativePath === 'overrides/init.js' && marker.test(contents))) {
                    matches.push(relativePath);
                }
            }
        }
    }
    const overrides = path.join(packageRoot, 'overrides');
    if ((await stat(overrides).catch(() => null))?.isDirectory()) {
        await visit(overrides);
    }
    return matches;
}

export async function validatePackageDirectory(packageRoot, options = {}) {
    const manifestPath = path.join(packageRoot, 'package.json');
    const manifest = await readJsonc(manifestPath);
    const result = validateThemePackage(manifest, options);
    const javascriptFiles = await findAuthoredJavaScript(packageRoot, manifest.name);
    if (javascriptFiles.length) {
        result.valid = false;
        result.baselineEligible = false;
        result.errors.push(`Theme package has JavaScript override files: ${javascriptFiles.join(', ')}.`);
    }
    for (const directory of ['sass/var', 'sass/src', 'resources']) {
        const fullPath = path.join(packageRoot, directory);
        const exists = (await stat(fullPath).catch(() => null))?.isDirectory() || false;
        if (!exists) {
            result.errors.push(`Theme package is missing ${directory}.`);
            result.valid = false;
            result.baselineEligible = false;
        }
    }
    return result;
}
