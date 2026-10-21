import assert from 'node:assert/strict';
import test from 'node:test';
import { compareCaptures, assertStableOriginal, preserveFailures } from './compare.mjs';
import { encodeRgbaPng, comparePngBuffers } from './png.mjs';

const screenshot = encodeRgbaPng(2, 1, Buffer.from([
    255, 255, 255, 255,
    0, 0, 0, 255
]));

function capture(overrides = {}) {
    return {
        buildId: 'original-1', packageName: 'theme-classic', themeRole: 'original', buildMode: 'development',
        geometry: {
            button: {
                rect: { x: 10.25, y: 20, width: 100, height: 24 },
                client: { width: 100, height: 24 }, offset: { width: 100, height: 24 }, scroll: { width: 100, height: 24 }
            }
        },
        computedStyles: { button: { width: '100px', height: '24px', color: 'rgb(0, 0, 0)', background: 'rgb(255, 255, 255)' } },
        dom: { hierarchy: ['div', 'button'], classes: ['x-btn', 'x-btn-default-toolbar-small'] },
        stylesheets: { legacyDeclarations: [{ selector: '.x-btn', property: 'color', value: 'rgb(0, 0, 0)' }], inlineOrder: [], applicationOrder: ['theme', 'app', 'legacy'] },
        interactions: { expected: { clicked: true }, actual: { clicked: true }, missingAssets: [], pageErrors: [] },
        diagnostics: { screenshotSha256: '1'.repeat(64), layoutObservation: { sufficient: true, method: 'test-fixture', scope: 'fixture', observedWork: { layoutPasses: 1 }, limitations: [] } },
        ...overrides
    };
}

test('compares PNG pixels and reports a difference image', () => {
    const same = comparePngBuffers(screenshot, screenshot);
    assert.equal(same.equal, true);
    assert.equal(same.differingPixels, 0);
    const changed = encodeRgbaPng(2, 1, Buffer.from([255, 255, 255, 255, 255, 0, 0, 255]));
    const result = comparePngBuffers(screenshot, changed);
    assert.equal(result.equal, false);
    assert.equal(result.differingPixels, 1);
    assert.deepEqual(result.differenceBounds, { x: 1, y: 0, width: 1, height: 1 });
    assert.ok(Buffer.isBuffer(result.differencePng));
});

test('reports geometry, protected styles, CSS, DOM, and behavior changes separately', async () => {
    const original = capture();
    const candidate = capture({
        buildId: 'derived-1', packageName: 'theme-classic-modern', themeRole: 'derived',
        geometry: { ...original.geometry, button: { ...original.geometry.button, rect: { ...original.geometry.button.rect, width: 101 } } },
        computedStyles: { button: { ...original.computedStyles.button, width: '101px', 'border-radius': '2px' } },
        dom: { hierarchy: ['div', 'button'], classes: ['x-btn', 'x-btn-pressed'] },
        interactions: { expected: { clicked: true }, actual: { clicked: false }, missingAssets: ['icon.png'], pageErrors: ['script error'] }
    });
    const result = await compareCaptures(original, candidate, {
        phase: 'baseline', caseDefinition: { protectedProperties: ['width', 'height'] },
        referencePng: screenshot, actualPng: encodeRgbaPng(2, 1, Buffer.from([255, 255, 255, 255, 255, 0, 0, 255])),
        layoutObservation: candidate.diagnostics.layoutObservation
    });
    assert.equal(result.geometry.status, 'fail');
    assert.equal(result.css.status, 'fail');
    assert.equal(result.behavior.status, 'fail');
    assert.equal(result.visual.status, 'fail');
});

test('blocks missing coverage and missing layout observation evidence', async () => {
    const original = capture();
    const candidate = capture({ themeRole: 'derived' });
    const result = await compareCaptures(original, candidate, {
        referencePng: screenshot, actualPng: screenshot, coverageComplete: false,
        layoutObservation: { sufficient: false, reason: 'No browser layout counter is available.' }
    });
    assert.equal(result.geometry.status, 'blocked');
    assert.equal(result.visual.status, 'blocked');
    assert.equal(result.layoutObservation.status, 'blocked');
    assert.equal(result.coverageGaps.length, 1);
});

test('fails additional layout work even when final geometry matches', async () => {
    const original = capture();
    const candidate = capture({ themeRole: 'derived' });
    const result = await compareCaptures(original, candidate, {
        referencePng: screenshot,
        actualPng: screenshot,
        layoutObservation: {
            sufficient: true,
            method: 'test-fixture-counter',
            scope: 'button',
            observedWork: { original: { layoutPasses: 2 }, candidate: { layoutPasses: 3 } },
            limitations: [],
            reason: 'The fixture uses a test counter.'
        }
    });
    assert.equal(result.geometry.status, 'fail');
    assert.equal(result.layoutObservation.status, 'fail');
    assert.equal(result.geometry.differences[0].path, 'layoutObservation.observedWork.layoutPasses');
});

test('reports stylesheet identity changes and rejects stylesheet order changes', async () => {
    const reference = capture({
        stylesheets: {
            external: [{ url: 'http://localhost/theme-classic.css', sha256: '1'.repeat(64), order: 1 }],
            inlineStylesheets: [], inlineOrder: [], applicationOrder: ['theme', 'legacy'],
            legacyDeclarations: [{ selector: '.x-btn', property: 'color', value: 'rgb(0, 0, 0)' }]
        }
    });
    const candidate = capture({
        themeRole: 'derived', packageName: 'theme-classic-modern',
        stylesheets: {
            external: [{ url: 'http://localhost/theme-classic-modern.css', sha256: '2'.repeat(64), order: 1 }],
            inlineStylesheets: [], inlineOrder: [], applicationOrder: ['theme', 'legacy'],
            legacyDeclarations: [{ selector: '.x-btn', property: 'color', value: 'rgb(0, 0, 0)' }]
        }
    });
    const layoutObservation = {
        sufficient: true, method: 'test-fixture-counter', scope: 'button',
        observedWork: { original: { layoutPasses: 1 }, candidate: { layoutPasses: 1 } }, limitations: []
    };
    const identityOnly = await compareCaptures(reference, candidate, {
        referencePng: screenshot, actualPng: screenshot, layoutObservation
    });
    assert.equal(identityOnly.css.status, 'pass');
    assert.equal(identityOnly.identityChanges.filter((item) => item.path.startsWith('stylesheets.external')).length, 2);

    const reordered = await compareCaptures(reference, {
        ...candidate,
        stylesheets: { ...candidate.stylesheets, external: [{ ...candidate.stylesheets.external[0], order: 2 }] }
    }, { referencePng: screenshot, actualPng: screenshot, layoutObservation });
    assert.equal(reordered.css.status, 'fail');
    assert.ok(reordered.css.differences.some((item) => item.path === 'stylesheets.external.order'));
});

test('does not allow an unapproved paint change and allows only approved paint properties', async () => {
    const original = capture();
    const candidate = capture({
        themeRole: 'modernized',
        computedStyles: { button: { ...original.computedStyles.button, background: 'rgb(240, 240, 240)' } }
    });
    const rejected = await compareCaptures(original, candidate, { phase: 'modernization', referencePng: screenshot, actualPng: screenshot });
    assert.equal(rejected.css.status, 'fail');
    const accepted = await compareCaptures(original, candidate, {
        phase: 'modernization', approval: { allowedProperties: ['background'] },
        referencePng: screenshot, actualPng: screenshot, layoutObservation: { sufficient: true }
    });
    assert.equal(accepted.css.status, 'pass');
    assert.equal(accepted.geometry.status, 'blocked');
    assert.equal(accepted.layoutObservation.status, 'blocked');
});

test('rejects matching interaction failures in both theme captures', async () => {
    const failed = capture({ interactions: { expected: { clicked: true }, actual: { clicked: false }, missingAssets: [], pageErrors: [] } });
    const result = await compareCaptures(failed, failed, {
        referencePng: screenshot,
        actualPng: screenshot,
        layoutObservation: failed.diagnostics.layoutObservation
    });
    assert.equal(result.behavior.status, 'fail');
});

test('rejects unstable originals and retains earlier failures across reruns', () => {
    const original = capture();
    assert.equal(assertStableOriginal(original, capture()).stable, true);
    assert.equal(assertStableOriginal(original, capture({ diagnostics: { screenshotSha256: '2'.repeat(64) } })).stable, false);
    const first = preserveFailures(null, { 'buttons-default': { geometry: { status: 'fail', differences: ['width'] } } });
    const second = preserveFailures(first, { 'buttons-default': { geometry: { status: 'pass', differences: [] } } });
    assert.equal(second.historicalFailures.length, 1);
    assert.equal(second.historicalFailures[0].category, 'geometry');
});
