import assert from 'node:assert/strict';
import { mkdtemp, readFile, rm } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import {
    approvalIsCurrent,
    captureEvidencePath,
    evaluateG0,
    evaluateG1,
    evaluateG2,
    evaluateG3,
    evaluateG4,
    gateDependenciesAreCurrent,
    isValidChangeTransition,
    parseCaptureInputs,
    schemaVersion,
    validateEvidenceRelationships,
    validateRecord,
    validateSuiteResults,
    writeImmutableJson
} from './evidence.mjs';

const hashA = 'a'.repeat(64);
const hashB = 'b'.repeat(64);

function record(kind, overrides = {}) {
    const common = { schemaVersion };
    const values = {
        ProductionInputSet: {
            inputSetId: 'prod-input-1', sdkVersion: '7.7.0.31', activeTheme: 'theme-classic',
            parentChain: ['theme-classic', 'theme-neutral', 'theme-base'], cssFiles: [], stylesheetOrder: [],
            componentInventory: [], stateInventory: [], browserRequirements: [], sourceHashes: { 'app.css': hashA },
            reviewer: null, status: 'missing'
        },
        Environment: {
            environmentId: 'chromium-dpr1-development', sdkVersion: '7.7.0.31', cmdVersion: '7.7.0.36',
            nodeVersion: 'test-fixture', playwrightVersion: 'test-fixture', browserEngine: 'chromium',
            browserVersion: 'test-fixture', browserMode: 'headless', osVersion: 'test-fixture',
            fonts: ['Arial'], viewport: { width: 1280, height: 900 }, zoom: 100,
            requestedDpr: 1, actualDpr: 1, locale: 'en-US', timezone: 'UTC', buildMode: 'development'
        },
        ThemeBuild: {
            buildId: 'original-build-1', themeRole: 'original', packageName: 'theme-classic', packageVersion: '7.7.0.31',
            parentChain: ['theme-classic', 'theme-neutral', 'theme-base'], sourceHashes: { 'app.js': hashA },
            fixtureHash: hashA, inputSetId: 'prod-input-1', buildMode: 'development', command: 'sencha app build development',
            exitCode: 0, logPath: 'build.log', outputHashes: { 'TestApp-all.css': hashA }, authoredPaintRules: false,
            replacementAssets: []
        },
        ComparisonCase: {
            caseId: 'buttons-default', componentFamily: 'buttons', fixtureReference: 'TestApp/app/view/compatibility/Controls.js',
            dataHash: hashA, states: ['normal'], targetElements: [{ targetId: 'button', componentQuery: '#button', domSelector: null }], actions: [], expectedOutcomes: [],
            legacySelectors: [], protectedProperties: ['width', 'height'], pseudoElements: []
        },
        Capture: {
            captureId: 'capture-original-1', runId: 'baseline-1', buildId: 'original-build-1',
            environmentId: 'chromium-dpr1-development', caseId: 'buttons-default', state: 'normal',
            timestamp: '2026-10-20T12:00:00Z',
            geometry: { targets: { button: { rect: { x: 0, y: 0, width: 100, height: 24 }, client: { width: 100, height: 24 }, offset: { width: 100, height: 24 }, scroll: { width: 100, height: 24 } } } },
            computedStyles: { targets: { button: { properties: { width: '100px' }, pseudoElements: { before: {}, after: {} } } } },
            dom: { targets: { button: { hierarchy: ['div', 'button'], classes: ['x-btn'], stateClasses: [] } }, normalizationRules: ['Remove generated DOM identity only.'] },
            stylesheets: { external: [{ url: 'http://localhost/theme.css', sha256: hashA, order: 0 }], inlineStylesheets: [], inlineOrder: [], legacyDeclarations: [] },
            interactions: { expected: { click: true }, actual: { click: true }, missingAssets: [], pageErrors: [] },
            screenshotPath: 'screenshot.png', diagnostics: {
                actualDpr: 1, screenshotDimensions: { width: 1280, height: 900 },
                layoutObservation: { sufficient: false, method: null, scope: null, observedWork: null, limitations: ['No verified method.'], reason: 'No supported layout method is verified.' }
            }
        },
        ChangeGroup: {
            changeId: 'surfaces-1', sequence: 1, visualGoal: 'Reduce button surface gloss.', affectedCases: ['buttons-default'],
            variableChanges: [], ruleChanges: [], assetChanges: [], riskAssessment: 'Paint only.', testMethod: 'Compare both themes.',
            rollbackMethod: 'Restore prior variable values.', approval: null, evidenceIds: [], status: 'proposed', sourceHashes: { 'theme.scss': hashA }
        },
        ComparisonResult: {
            resultId: 'result-1', originalCaptureId: 'capture-original-1', candidateCaptureId: 'capture-derived-1',
            changeId: null, geometry: { status: 'pass', differences: [] }, css: { status: 'pass', differences: [] },
            behavior: { status: 'pass', differences: [] }, visual: { status: 'pass', differences: [] },
            unexpectedDifferences: [], coverageGaps: [], approvalIds: [], evidencePaths: []
        },
        GateRecord: {
            gateId: 'G0', status: 'blocked', inputSetId: 'prod-input-1', buildIds: [], resultIds: [],
            reviewer: null, timestamp: '2026-10-20T12:00:00Z', reason: 'Production inputs are missing.',
            dependencyHashes: { 'app.css': hashA }
        }
    };
    return { ...common, ...values[kind], ...overrides };
}

test('all evidence records require versioned fields', () => {
    for (const kind of ['ProductionInputSet', 'Environment', 'ThemeBuild', 'ComparisonCase', 'Capture', 'ChangeGroup', 'ComparisonResult', 'GateRecord']) {
        const valid = record(kind);
        assert.equal(validateRecord(kind, valid), valid);
        const missing = { ...valid };
        delete missing.schemaVersion;
        assert.throws(() => validateRecord(kind, missing), /schemaVersion/);
    }
});

test('rejects the wrong SDK, unstable identifiers, invalid timestamps, and invalid hashes', () => {
    assert.throws(() => validateRecord('Environment', record('Environment', { sdkVersion: '7.7.0.30' })), /7\.7\.0\.31/);
    assert.throws(() => validateRecord('ComparisonCase', record('ComparisonCase', { caseId: 'ext-gen123' })), /generated DOM identifier/);
    assert.throws(() => validateRecord('Capture', record('Capture', { timestamp: 'yesterday' })), /ISO 8601/);
    assert.throws(() => validateRecord('ComparisonCase', record('ComparisonCase', { dataHash: 'abc' })), /SHA-256/);
});

test('validates stable capture targets and complete capture evidence', () => {
    assert.equal(validateRecord('Capture', record('Capture')).captureId, 'capture-original-1');
    assert.throws(() => validateRecord('ComparisonCase', record('ComparisonCase', {
        targetElements: [{ targetId: 'button', componentQuery: null, domSelector: null }]
    })), /component query or DOM selector/);
    assert.throws(() => validateRecord('ComparisonCase', record('ComparisonCase', {
        targetElements: [
            { targetId: 'button', componentQuery: '#button', domSelector: null },
            { targetId: 'button', componentQuery: null, domSelector: '.x-btn' }
        ]
    })), /unique target identifiers/);
    assert.throws(() => validateRecord('Capture', record('Capture', {
        screenshotPath: '../outside.png'
    })), /inside its run directory/);
    assert.throws(() => validateRecord('Capture', record('Capture', {
        diagnostics: {
            ...record('Capture').diagnostics,
            layoutObservation: {
                sufficient: true, method: 'unknown', scope: 'button', observedWork: {}, limitations: [], reason: 'None.'
            }
        }
    })), /include observed work/);
});

test('validates evidence links between captures, cases, builds, and environments', () => {
    const bundle = {
        environments: [record('Environment')],
        builds: [record('ThemeBuild')],
        cases: [record('ComparisonCase')],
        captures: [record('Capture')],
        changeGroups: [],
        results: []
    };
    assert.equal(validateEvidenceRelationships(bundle), true);
    assert.throws(() => validateEvidenceRelationships({
        ...bundle,
        captures: [record('Capture', { diagnostics: { ...record('Capture').diagnostics, actualDpr: 2 } })]
    }), /DPR does not match/);
    assert.throws(() => validateEvidenceRelationships({
        ...bundle,
        captures: [record('Capture', { state: 'hover' })]
    }), /state that its ComparisonCase does not define/);
    const validCapture = record('Capture');
    const unmatchedTarget = {
        ...validCapture,
        geometry: { targets: { other: validCapture.geometry.targets.button } },
        computedStyles: { targets: { other: validCapture.computedStyles.targets.button } },
        dom: { targets: { other: validCapture.dom.targets.button }, normalizationRules: validCapture.dom.normalizationRules }
    };
    assert.throws(() => validateEvidenceRelationships({ ...bundle, captures: [unmatchedTarget] }), /target that its ComparisonCase does not define/);
});

test('requires complete production reviewer evidence before verified status', () => {
    assert.equal(evaluateG0(null).status, 'blocked');
    const received = record('ProductionInputSet', { status: 'received' });
    assert.equal(evaluateG0(received).status, 'blocked');
    const verified = record('ProductionInputSet', {
        status: 'verified',
        parentChain: ['theme-classic'],
        cssFiles: [{ path: 'app.css', sha256: hashA }],
        stylesheetOrder: ['app.css'],
        componentInventory: [{ type: 'grid' }],
        stateInventory: [{ state: 'selected' }],
        browserRequirements: [{ engine: 'chromium', version: '156.0.8078.4', dpr: [1, 2] }],
        reviewer: { name: 'Reviewer', evidence: 'production-inputs.json', date: '2026-10-20T12:00:00Z' }
    });
    assert.equal(evaluateG0(verified).status, 'passed');
    assert.throws(() => validateRecord('ProductionInputSet', { ...verified, reviewer: null }), /reviewer/);
    assert.throws(() => validateRecord('ProductionInputSet', { ...verified, browserRequirements: [] }), /browserRequirements/);
});

test('requires a paint-free and asset-free derived build', () => {
    assert.throws(() => validateRecord('ThemeBuild', record('ThemeBuild', { themeRole: 'derived', authoredPaintRules: true })), /no authored paint rules/);
    assert.throws(() => validateRecord('ThemeBuild', record('ThemeBuild', { themeRole: 'derived', replacementAssets: ['new-icon.svg'] })), /no authored paint rules/);
    assert.throws(() => validateRecord('ThemeBuild', record('ThemeBuild', { exitCode: 1 })), /exitCode/);
});

test('rejects stale approvals after a source hash changes', () => {
    const approval = { sourceHashes: { 'theme.scss': hashA } };
    assert.equal(approvalIsCurrent(approval, { 'theme.scss': hashA }), true);
    assert.equal(approvalIsCurrent(approval, { 'theme.scss': hashB }), false);
    const stale = record('ChangeGroup', {
        status: 'approved',
        approval: { reviewer: 'Reviewer', scope: 'Buttons', date: '2026-10-20T12:00:00Z', sourceHashes: { 'theme.scss': hashB } }
    });
    assert.throws(() => validateRecord('ChangeGroup', stale), /stale/);
    const gate = record('GateRecord');
    assert.equal(gateDependenciesAreCurrent(gate, { 'app.css': hashA }), true);
    assert.equal(gateDependenciesAreCurrent(gate, { 'app.css': hashB }), false);
});

test('enforces the change-group status order', () => {
    assert.equal(isValidChangeTransition('proposed', 'approved'), true);
    assert.equal(isValidChangeTransition('approved', 'implemented'), true);
    assert.equal(isValidChangeTransition('proposed', 'implemented'), false);
    assert.equal(isValidChangeTransition('accepted', 'rejected'), true);
});

test('blocks later gates when their prerequisites are missing or fail', () => {
    const g0 = { status: 'passed' };
    const g1 = { status: 'passed' };
    assert.equal(evaluateG1({}).status, 'not-run');
    assert.equal(evaluateG2({ g0: { status: 'blocked' }, g1, derivedResults: [{}], rollbackResults: [{}] }).status, 'blocked');
    assert.equal(evaluateG3({ g2: { status: 'blocked' } }).status, 'blocked');
    assert.equal(evaluateG4({ g0, g1, g2: { status: 'passed' }, g3: [{ status: 'blocked' }] }).status, 'blocked');
    const passResult = Object.fromEntries(['geometry', 'css', 'behavior', 'visual'].map((key) => [key, { status: 'pass', differences: [] }]));
    assert.equal(evaluateG2({ g0, g1, derivedResults: [passResult], rollbackResults: [passResult] }).status, 'passed');
    assert.equal(evaluateG3({ g2: { status: 'passed' }, changeGroup: { status: 'approved' }, results: [passResult], rollbackResults: [passResult] }).status, 'passed');
    assert.equal(evaluateG4({ g0, g1, g2: { status: 'passed' }, g3: [{ status: 'passed' }], acceptanceEvidence: ['report.md'], rollbackEvidence: ['rollback.json'] }).status, 'passed');
});

test('validates required suites by story stage', () => {
    assert.equal(validateSuiteResults('us2', [{ suite: 'capture.spec.js', status: 'completed', evidencePaths: ['manifest.json'] }]), true);
    const complete = ['capture.spec.js', 'css-contract.spec.js', 'interactions.spec.js'].map((suite) => ({ suite, status: 'completed', evidencePaths: ['manifest.json'] }));
    assert.equal(validateSuiteResults('us3', complete), true);
    assert.throws(() => validateSuiteResults('us3', complete.slice(0, 2)), /interactions\.spec\.js/);
});

test('validates safe capture inputs and blocks query-based theme switching', () => {
    const env = {
        COMPAT_RUN: 'baseline-001', COMPAT_THEME: 'original-repeat', COMPAT_PHASE: 'baseline',
        COMPAT_BUILD_MODE: 'development', COMPAT_BASE_URL: 'http://localhost:1841/'
    };
    assert.equal(parseCaptureInputs(env).themeRole, 'original-repeat');
    assert.throws(() => parseCaptureInputs({ ...env, COMPAT_RUN: '../escape' }), /safe run identifier/);
    assert.throws(() => parseCaptureInputs({ ...env, COMPAT_BASE_URL: 'http://localhost:1841/?theme=modern' }), /query-based/);
    assert.throws(() => parseCaptureInputs({ ...env, COMPAT_THEME: 'theme-classic-modern' }), /COMPAT_THEME/);
});

test('creates safe immutable evidence paths and rejects duplicate writes', async () => {
    const temp = await mkdtemp(path.join(os.tmpdir(), 'theme-compat-'));
    try {
        const target = captureEvidencePath(temp, {
            runId: 'baseline-001', buildMode: 'development', role: 'original', project: 'chromium-dpr1',
            caseId: 'buttons-default', state: 'normal'
        });
        assert.ok(target.startsWith(path.join(temp, 'artifacts', 'compatibility')));
        await writeImmutableJson(path.join(target, 'capture.json'), { ok: true });
        assert.deepEqual(JSON.parse(await readFile(path.join(target, 'capture.json'), 'utf8')), { ok: true });
        await assert.rejects(writeImmutableJson(path.join(target, 'capture.json'), { ok: false }));
        assert.throws(() => captureEvidencePath(temp, {
            runId: 'baseline-001', buildMode: 'development', role: 'original', project: '..',
            caseId: 'buttons-default', state: 'normal'
        }), /safe path segment/);
    } finally {
        await rm(temp, { recursive: true, force: true });
    }
});
