import assert from 'node:assert/strict';
import test from 'node:test';
import * as comparison from './compare.mjs';
import { createHash } from 'node:crypto';
import { encodeRgbaPng, comparePngBuffers } from './png.mjs';

const { compareCaptures, assertStableOriginal, preserveFailures } = comparison;

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

const baselineHashes = { 'theme.scss': 'a'.repeat(64) };
const modernizedScreenshot = encodeRgbaPng(2, 1, Buffer.from([
    255, 255, 255, 255,
    35, 72, 110, 255
]));

function modernizationFixture(overrides = {}) {
    const original = capture();
    const currentBaselineHashes = overrides.baselineHashes || baselineHashes;
    const modernized = capture({
        packageName: 'theme-classic-modern',
        themeRole: 'modernized',
        computedStyles: {
            button: { ...original.computedStyles.button, 'background-image': 'none' }
        },
        ...overrides.modernized
    });
    const rollback = capture({ packageName: 'theme-classic', themeRole: 'rollback', ...overrides.rollback });
    const group = {
        schemaVersion: 1,
        changeId: 'surfaces-1',
        sequence: 1,
        visualGoal: 'Reduce button surface gloss.',
        affectedCases: ['buttons-and-toolbars'],
        variableChanges: ['button background gradient'],
        ruleChanges: [],
        assetChanges: [],
        riskAssessment: 'Paint only.',
        testMethod: 'Compare the original, modernized, and rollback screenshots and records.',
        rollbackMethod: 'Restore the original Sass variable values.',
        approval: {
            reviewer: 'Project owner',
            scope: 'Demo button surfaces.',
            date: '2026-10-21T06:08:06Z',
            sourceHashes: baselineHashes,
            allowedProperties: ['background-image'],
            ...overrides.approval
        },
        evidenceIds: ['goal-approval-1'],
        status: 'approved',
        sourceHashes: baselineHashes,
        ...overrides.group
    };
    const approvedModernizedReference = overrides.approvedModernizedReference === null ? null : {
        status: 'approved',
        reviewer: 'Project owner',
        date: '2026-10-21T06:08:06Z',
        sourceHashes: baselineHashes,
        screenshotSha256: createHash('sha256').update(modernizedScreenshot).digest('hex'),
        ...overrides.approvedModernizedReference
    };
    const layoutObservation = {
        sufficient: true,
        method: 'fixture-counter',
        scope: 'button',
        observedWork: { original: { layoutPasses: 1 }, candidate: { layoutPasses: 1 } },
        limitations: []
    };
    return {
        original,
        modernized,
        rollback,
        changeGroup: group,
        baselineHashes: currentBaselineHashes,
        previousGroups: overrides.previousGroups || [],
        approvedModernizedReference,
        referencePng: screenshot,
        modernizedPng: modernizedScreenshot,
        rollbackPng: screenshot,
        approvedReferencePng: modernizedScreenshot,
        layoutObservation,
        rollbackLayoutObservation: layoutObservation,
        caseDefinition: { protectedProperties: ['width', 'height'] },
        coverageComplete: true
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

test('excludes harness readiness metadata and cache-buster URLs from baseline repeatability', async () => {
    const interactions = {
        expected: { configuredState: 'normal', clicked: true },
        actual: {
            configuredState: 'normal', clicked: true, ready: true,
            statePreparation: { expectedState: 'normal', actualState: 'normal', ready: true }
        },
        missingAssets: [],
        pageErrors: []
    };
    const reference = capture({
        interactions,
        stylesheets: {
            external: [{ order: 0, url: 'http://localhost:1841/app.css?_dc=100&theme=classic' }],
            inlineStylesheets: [],
            applicationOrder: ['theme', 'app', 'legacy'],
            legacyDeclarations: []
        }
    });
    const repeat = capture({
        interactions,
        stylesheets: {
            external: [{ order: 0, url: 'http://localhost:1841/app.css?_dc=200&theme=classic' }],
            inlineStylesheets: [],
            applicationOrder: ['theme', 'app', 'legacy'],
            legacyDeclarations: []
        }
    });

    assert.deepEqual(assertStableOriginal(reference, repeat), { stable: true, differences: [] });
    const comparison = await compareCaptures(reference, repeat, {
        referencePng: screenshot,
        actualPng: screenshot,
        layoutObservation: {
            sufficient: true,
            method: 'test',
            scope: 'page',
            observedWork: { original: { layoutPasses: 1 }, candidate: { layoutPasses: 1 } },
            limitations: []
        }
    });
    assert.equal(comparison.behavior.status, 'pass');
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

test('allows approved logical border-color paint properties', async () => {
    const original = capture({ computedStyles: { tip: {
        'border-block-end-color': 'rgb(142, 170, 206)',
        'border-block-start-color': 'rgb(142, 170, 206)',
        'border-inline-end-color': 'rgb(142, 170, 206)',
        'border-inline-start-color': 'rgb(142, 170, 206)',
        'border-bottom-color': 'rgb(142, 170, 206)',
        'border-left-color': 'rgb(142, 170, 206)',
        'border-right-color': 'rgb(142, 170, 206)',
        'border-top-color': 'rgb(142, 170, 206)'
    } } });
    const candidate = capture({
        themeRole: 'modernized',
        computedStyles: { tip: {
            'border-block-end-color': 'rgb(199, 210, 223)',
            'border-block-start-color': 'rgb(199, 210, 223)',
            'border-inline-end-color': 'rgb(199, 210, 223)',
            'border-inline-start-color': 'rgb(199, 210, 223)',
            'border-bottom-color': 'rgb(199, 210, 223)',
            'border-left-color': 'rgb(199, 210, 223)',
            'border-right-color': 'rgb(199, 210, 223)',
            'border-top-color': 'rgb(199, 210, 223)'
        } }
    });
    const allowedProperties = [
        'border-block-end-color',
        'border-block-start-color',
        'border-inline-end-color',
        'border-inline-start-color',
        'border-bottom-color',
        'border-left-color',
        'border-right-color',
        'border-top-color'
    ];
    const result = await compareCaptures(original, candidate, {
        phase: 'modernization',
        approval: { allowedProperties },
        referencePng: screenshot,
        actualPng: screenshot,
        layoutObservation: { sufficient: true }
    });
    assert.equal(result.css.status, 'pass');
    assert.deepEqual(result.unexpectedDifferences, []);
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

test('requires an approved visual goal before comparing a modernized group', async () => {
    const input = modernizationFixture({ group: { status: 'proposed' } });
    const result = await comparison.compareModernizedGroup(input);
    assert.equal(result.status, 'blocked');
    assert.match(result.validation.reasons.join(' '), /approved goal/);
});

test('rejects stale baseline hashes and an out-of-order group', async () => {
    const stale = modernizationFixture({ baselineHashes: { 'theme.scss': 'b'.repeat(64) } });
    const staleResult = await comparison.compareModernizedGroup(stale);
    assert.equal(staleResult.status, 'blocked');
    assert.match(staleResult.validation.reasons.join(' '), /stale baseline/);

    const outOfOrder = modernizationFixture({
        group: { sequence: 2 },
        previousGroups: [{ changeId: 'surfaces-0', sequence: 1, status: 'implemented' }]
    });
    const orderResult = await comparison.compareModernizedGroup(outOfOrder);
    assert.equal(orderResult.status, 'blocked');
    assert.match(orderResult.validation.reasons.join(' '), /previous group/);
});

test('rejects unapproved paint properties and missing reviewer-approved references', async () => {
    const unapproved = modernizationFixture({
        approval: { allowedProperties: ['background-image', 'width'] }
    });
    const propertyResult = await comparison.compareModernizedGroup(unapproved);
    assert.equal(propertyResult.status, 'failed');
    assert.match(propertyResult.validation.reasons.join(' '), /unapproved paint property/);

    const noReference = modernizationFixture({ approvedModernizedReference: null, approvedReferencePng: null });
    const referenceResult = await comparison.compareModernizedGroup(noReference);
    assert.equal(referenceResult.status, 'blocked');
    assert.match(referenceResult.validation.reasons.join(' '), /approved modernized reference/);
});

test('requires a passing rollback and keeps protected or behavior failures visible', async () => {
    const badRollback = modernizationFixture({
        rollback: {
            geometry: { button: { rect: { x: 10.25, y: 20, width: 101, height: 24 } } }
        }
    });
    const rollbackResult = await comparison.compareModernizedGroup(badRollback);
    assert.equal(rollbackResult.rollback.geometry.status, 'fail');
    assert.notEqual(rollbackResult.status, 'passed');

    const badProtected = modernizationFixture({
        modernized: {
            geometry: { button: { rect: { x: 10.25, y: 20, width: 101, height: 24 } } },
            computedStyles: { button: { width: '101px', height: '24px', color: 'rgb(0, 0, 0)', background: 'rgb(255, 255, 255)', 'background-image': 'none' } },
            interactions: { expected: { clicked: true }, actual: { clicked: false }, missingAssets: [], pageErrors: [] }
        }
    });
    const protectedResult = await comparison.compareModernizedGroup(badProtected);
    assert.equal(protectedResult.modernized.geometry.status, 'fail');
    assert.equal(protectedResult.modernized.behavior.status, 'fail');
});

test('validates an approved group without accepting it automatically', async () => {
    const input = modernizationFixture();
    const result = await comparison.compareModernizedGroup(input);
    assert.equal(result.status, 'validated');
    assert.equal(result.modernized.css.status, 'pass');
    assert.equal(result.modernized.visual.status, 'pass');
    assert.equal(result.rollback.visual.status, 'pass');
    assert.equal(input.changeGroup.status, 'approved');
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

test('runs modernization comparison only for the modernization phase', async () => {
    const calls = [];
    const baselineComparator = async (input) => {
        calls.push(['baseline', input]);
        return { gates: [], errors: [] };
    };
    const modernizationComparator = async (input) => {
        calls.push(['modernization', input]);
        return { status: 'blocked', gates: [], errors: ['G0 is blocked.'] };
    };
    const baselineOnly = await comparison.runCompareWorkflow({
        runId: 'baseline-compare', buildMode: 'development', phase: 'baseline',
        baselineComparator, modernizationComparator
    });
    assert.equal(baselineOnly.modernization, null);
    assert.deepEqual(calls.map(([name]) => name), ['baseline']);

    const modernizationRun = await comparison.runCompareWorkflow({
        runId: 'modernization-compare', buildMode: 'development', phase: 'modernization', suiteStage: 'us3',
        baselineComparator, modernizationComparator
    });
    assert.equal(modernizationRun.modernization.status, 'blocked');
    assert.deepEqual(calls.map(([name]) => name), ['baseline', 'baseline', 'modernization']);
    assert.deepEqual(calls[2][1], { runId: 'modernization-compare', buildMode: 'development', suiteStage: 'us3' });
    await assert.rejects(
        comparison.runCompareWorkflow({ runId: 'bad-phase', buildMode: 'development', phase: 'accept' }),
        /phase must be baseline or modernization/
    );
});
