import { createHash } from 'node:crypto';

export function readThemeValue(appJsonText) {
    const matches = [...appJsonText.matchAll(/(^|\n)\s*"theme"\s*:\s*"([^"]+)"/g)];
    if (matches.length !== 1) {
        throw new Error('Application configuration must contain one theme value.');
    }
    return matches[0][2];
}

export function assertOnlyThemeChange(originalText, replacementText, originalTheme, replacementTheme) {
    if (readThemeValue(originalText) !== originalTheme || readThemeValue(replacementText) !== replacementTheme) {
        throw new Error('Application configuration does not contain the expected theme values.');
    }
    const normalize = (text) => text.replace(/(^|\n)(\s*"theme"\s*:\s*")[^"]+("\s*,?)/, '$1$2<theme>$3');
    if (normalize(originalText) !== normalize(replacementText)) {
        throw new Error('Theme selection changed application configuration outside the theme value.');
    }
    return true;
}

export function assertSameSourceHashes(originalHashes, selectedHashes, allowedPaths = []) {
    const allowed = new Set(allowedPaths);
    const files = new Set([...Object.keys(originalHashes), ...Object.keys(selectedHashes)]);
    const differences = [];
    for (const file of files) {
        if (allowed.has(file)) {
            continue;
        }
        if (originalHashes[file] !== selectedHashes[file]) {
            differences.push(file);
        }
    }
    if (differences.length) {
        throw new Error(`Application source changed during theme selection: ${differences.join(', ')}.`);
    }
    return true;
}

export function createSourceHash(source) {
    return createHash('sha256').update(source).digest('hex');
}

export function validateBuildResult(manifest, expectedTheme, expectedMode) {
    if (!manifest || manifest.exitCode !== 0) {
        throw new Error('The selected theme build did not pass.');
    }
    if (manifest.selectedTheme !== expectedTheme || manifest.buildMode !== expectedMode) {
        throw new Error('The build manifest does not match the requested theme and build mode.');
    }
    if (!manifest.outputHashes || Object.keys(manifest.outputHashes).length === 0) {
        throw new Error('The build manifest has no output hashes.');
    }
    return true;
}
