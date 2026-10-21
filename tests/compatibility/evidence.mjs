import { createHash } from 'node:crypto';
import { open, readFile, mkdir, access } from 'node:fs/promises';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

export const schemaVersion = 1;

export const themeRoles = ['original', 'original-repeat', 'derived', 'modernized', 'rollback'];
export const buildThemeRoles = ['original', 'derived', 'modernized', 'rollback'];
export const categoryStatuses = ['pass', 'fail', 'blocked', 'not-run'];
export const gateStatuses = ['not-run', 'blocked', 'failed', 'passed'];
export const productionInputStatuses = ['missing', 'received', 'verified', 'rejected'];
export const changeStatuses = ['proposed', 'approved', 'implemented', 'validated', 'accepted', 'rejected'];

const recordFields = {
    ProductionInputSet: [
        'inputSetId', 'sdkVersion', 'activeTheme', 'parentChain', 'cssFiles', 'stylesheetOrder',
        'componentInventory', 'stateInventory', 'browserRequirements', 'sourceHashes', 'reviewer', 'status'
    ],
    Environment: [
        'environmentId', 'sdkVersion', 'cmdVersion', 'nodeVersion', 'playwrightVersion',
        'browserEngine', 'browserVersion', 'browserMode', 'osVersion', 'fonts', 'viewport',
        'zoom', 'requestedDpr', 'actualDpr', 'locale', 'timezone', 'buildMode'
    ],
    ThemeBuild: [
        'buildId', 'themeRole', 'packageName', 'packageVersion', 'parentChain', 'sourceHashes',
        'fixtureHash', 'inputSetId', 'buildMode', 'command', 'exitCode', 'logPath', 'outputHashes',
        'authoredPaintRules', 'replacementAssets'
    ],
    ComparisonCase: [
        'caseId', 'componentFamily', 'fixtureReference', 'dataHash', 'states', 'targetElements',
        'actions', 'expectedOutcomes', 'legacySelectors', 'protectedProperties', 'pseudoElements'
    ],
    Capture: [
        'captureId', 'runId', 'buildId', 'environmentId', 'caseId', 'state', 'timestamp',
        'geometry', 'computedStyles', 'dom', 'stylesheets', 'interactions', 'screenshotPath', 'diagnostics'
    ],
    ChangeGroup: [
        'changeId', 'sequence', 'visualGoal', 'affectedCases', 'variableChanges', 'ruleChanges',
        'assetChanges', 'riskAssessment', 'testMethod', 'rollbackMethod', 'approval', 'evidenceIds',
        'status', 'sourceHashes'
    ],
    ComparisonResult: [
        'resultId', 'originalCaptureId', 'candidateCaptureId', 'changeId', 'geometry', 'css',
        'behavior', 'visual', 'unexpectedDifferences', 'coverageGaps', 'approvalIds', 'evidencePaths'
    ],
    GateRecord: [
        'gateId', 'status', 'inputSetId', 'buildIds', 'resultIds', 'reviewer', 'timestamp', 'reason', 'dependencyHashes'
    ]
};

const stableIdPattern = /^[A-Za-z0-9][A-Za-z0-9._:-]{0,127}$/;
const hashPattern = /^[a-f0-9]{64}$/;

function fail(message) {
    throw new TypeError(message);
}

function requireObject(value, label) {
    if (value === null || typeof value !== 'object' || Array.isArray(value)) {
        fail(`${label} must be an object.`);
    }
}

function requireString(value, label) {
    if (typeof value !== 'string' || value.trim() === '') {
        fail(`${label} must be a non-empty string.`);
    }
}

function requireArray(value, label) {
    if (!Array.isArray(value)) {
        fail(`${label} must be an array.`);
    }
}

function requireHash(value, label) {
    if (typeof value !== 'string' || !hashPattern.test(value)) {
        fail(`${label} must be a lower-case SHA-256 hash.`);
    }
}

function requireHashes(value, label) {
    requireObject(value, label);
    for (const [file, hash] of Object.entries(value)) {
        requireString(file, `${label} file path`);
        requireHash(hash, `${label}.${file}`);
    }
}

function requireId(value, label) {
    requireString(value, label);
    if (!stableIdPattern.test(value)) {
        fail(`${label} must use a stable identifier.`);
    }
    if (label.endsWith('.caseId') && /^(?:ext-gen|ext-element|x-component)-?\d+/i.test(value)) {
        fail(`${label} must not use a generated DOM identifier.`);
    }
}

function requireTimestamp(value, label) {
    requireString(value, label);
    if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{1,3})?Z$/.test(value) || Number.isNaN(Date.parse(value))) {
        fail(`${label} must use an ISO 8601 UTC timestamp.`);
    }
}

function requireStatus(value, allowed, label) {
    if (!allowed.includes(value)) {
        fail(`${label} has an invalid status: ${String(value)}.`);
    }
}

function requireAllFields(kind, record) {
    requireObject(record, kind);
    if (record.schemaVersion !== schemaVersion) {
        fail(`${kind}.schemaVersion must equal ${schemaVersion}.`);
    }
    for (const field of recordFields[kind]) {
        if (!Object.hasOwn(record, field)) {
            fail(`${kind}.${field} is required.`);
        }
    }
}

function validateProductionInputSet(record) {
    requireId(record.inputSetId, 'ProductionInputSet.inputSetId');
    requireString(record.sdkVersion, 'ProductionInputSet.sdkVersion');
    requireString(record.activeTheme, 'ProductionInputSet.activeTheme');
    for (const field of ['parentChain', 'cssFiles', 'stylesheetOrder', 'componentInventory', 'stateInventory', 'browserRequirements']) {
        requireArray(record[field], `ProductionInputSet.${field}`);
    }
    record.cssFiles.forEach((entry, index) => {
        requireObject(entry, `ProductionInputSet.cssFiles[${index}]`);
        requireString(entry.path, `ProductionInputSet.cssFiles[${index}].path`);
        requireHash(entry.sha256, `ProductionInputSet.cssFiles[${index}].sha256`);
    });
    requireHashes(record.sourceHashes, 'ProductionInputSet.sourceHashes');
    requireStatus(record.status, productionInputStatuses, 'ProductionInputSet.status');
    if (record.status === 'verified') {
        for (const field of ['parentChain', 'cssFiles', 'stylesheetOrder', 'componentInventory', 'stateInventory', 'browserRequirements']) {
            if (record[field].length === 0) {
                fail(`Verified ProductionInputSet.${field} must not be empty.`);
            }
        }
        if (Object.keys(record.sourceHashes).length === 0) {
            fail('Verified ProductionInputSet.sourceHashes must not be empty.');
        }
        requireObject(record.reviewer, 'ProductionInputSet.reviewer');
        requireString(record.reviewer.name, 'ProductionInputSet.reviewer.name');
        requireString(record.reviewer.evidence, 'ProductionInputSet.reviewer.evidence');
        requireTimestamp(record.reviewer.date, 'ProductionInputSet.reviewer.date');
    }
}

function validateEnvironment(record) {
    requireId(record.environmentId, 'Environment.environmentId');
    if (record.sdkVersion !== '7.7.0.31') {
        fail('Environment.sdkVersion must equal 7.7.0.31.');
    }
    for (const field of ['cmdVersion', 'nodeVersion', 'playwrightVersion', 'browserEngine', 'browserVersion', 'osVersion', 'locale', 'timezone']) {
        requireString(record[field], `Environment.${field}`);
    }
    if (!['headless', 'headed'].includes(record.browserMode)) {
        fail('Environment.browserMode must be headless or headed.');
    }
    if (!['development', 'production'].includes(record.buildMode)) {
        fail('Environment.buildMode must be development or production.');
    }
    requireArray(record.fonts, 'Environment.fonts');
    record.fonts.forEach((font, index) => requireString(font, `Environment.fonts[${index}]`));
    requireObject(record.viewport, 'Environment.viewport');
    for (const size of ['width', 'height']) {
        if (!Number.isInteger(record.viewport[size]) || record.viewport[size] < 1) {
            fail(`Environment.viewport.${size} must be a positive integer.`);
        }
    }
    if (typeof record.zoom !== 'number' || record.zoom !== 100) {
        fail('Environment.zoom must equal 100.');
    }
    for (const field of ['requestedDpr', 'actualDpr']) {
        if (typeof record[field] !== 'number' || record[field] <= 0) {
            fail(`Environment.${field} must be a positive number.`);
        }
    }
    if (record.requestedDpr !== record.actualDpr) {
        fail('Environment.actualDpr must match Environment.requestedDpr.');
    }
}

function validateThemeBuild(record) {
    requireId(record.buildId, 'ThemeBuild.buildId');
    requireStatus(record.themeRole, buildThemeRoles, 'ThemeBuild.themeRole');
    for (const field of ['packageName', 'packageVersion', 'inputSetId', 'command', 'logPath']) {
        requireString(record[field], `ThemeBuild.${field}`);
    }
    requireArray(record.parentChain, 'ThemeBuild.parentChain');
    requireHashes(record.sourceHashes, 'ThemeBuild.sourceHashes');
    requireHashes(record.outputHashes, 'ThemeBuild.outputHashes');
    requireHash(record.fixtureHash, 'ThemeBuild.fixtureHash');
    if (!['development', 'production'].includes(record.buildMode)) {
        fail('ThemeBuild.buildMode must be development or production.');
    }
    if (!Number.isInteger(record.exitCode) || record.exitCode !== 0) {
        fail('ThemeBuild.exitCode must equal 0 before capture.');
    }
    requireArray(record.replacementAssets, 'ThemeBuild.replacementAssets');
    if (record.themeRole === 'derived' && (record.authoredPaintRules !== false || record.replacementAssets.length !== 0)) {
        fail('A derived ThemeBuild must have no authored paint rules or replacement assets.');
    }
    if (typeof record.authoredPaintRules !== 'boolean') {
        fail('ThemeBuild.authoredPaintRules must be a boolean.');
    }
}

function validateComparisonCase(record) {
    requireId(record.caseId, 'ComparisonCase.caseId');
    requireString(record.componentFamily, 'ComparisonCase.componentFamily');
    requireString(record.fixtureReference, 'ComparisonCase.fixtureReference');
    requireHash(record.dataHash, 'ComparisonCase.dataHash');
    for (const field of ['states', 'targetElements', 'actions', 'expectedOutcomes', 'legacySelectors', 'protectedProperties', 'pseudoElements']) {
        requireArray(record[field], `ComparisonCase.${field}`);
    }
    if (!record.states.length || !record.targetElements.length) {
        fail('ComparisonCase must define at least one state and target element.');
    }
    record.states.forEach((state, index) => requireId(state, `ComparisonCase.states[${index}]`));
    record.targetElements.forEach((target, index) => {
        requireObject(target, `ComparisonCase.targetElements[${index}]`);
        requireId(target.targetId, `ComparisonCase.targetElements[${index}].targetId`);
        const hasComponentQuery = typeof target.componentQuery === 'string' && target.componentQuery.trim() !== '';
        const hasDomSelector = typeof target.domSelector === 'string' && target.domSelector.trim() !== '';
        if (!hasComponentQuery && !hasDomSelector) {
            fail(`ComparisonCase.targetElements[${index}] must define a component query or DOM selector.`);
        }
        if (target.componentQuery !== null && !hasComponentQuery) {
            fail(`ComparisonCase.targetElements[${index}].componentQuery must be a string or null.`);
        }
        if (target.domSelector !== null && !hasDomSelector) {
            fail(`ComparisonCase.targetElements[${index}].domSelector must be a string or null.`);
        }
    });
    const targetIds = record.targetElements.map((target) => target.targetId);
    if (new Set(targetIds).size !== targetIds.length) {
        fail('ComparisonCase.targetElements must use unique target identifiers.');
    }
    for (const field of ['actions', 'expectedOutcomes', 'legacySelectors', 'protectedProperties', 'pseudoElements']) {
        record[field].forEach((item, index) => requireString(item, `ComparisonCase.${field}[${index}]`));
    }
}

function requireFiniteNumber(value, label, { minimum = Number.NEGATIVE_INFINITY } = {}) {
    if (typeof value !== 'number' || !Number.isFinite(value) || value < minimum) {
        fail(`${label} must be a finite number of at least ${minimum}.`);
    }
}

function validateGeometry(geometry) {
    requireObject(geometry, 'Capture.geometry');
    requireObject(geometry.targets, 'Capture.geometry.targets');
    if (Object.keys(geometry.targets).length === 0) {
        fail('Capture.geometry.targets must not be empty.');
    }
    for (const [targetId, metrics] of Object.entries(geometry.targets)) {
        requireId(targetId, 'Capture.geometry targetId');
        requireObject(metrics, `Capture.geometry.targets.${targetId}`);
        requireObject(metrics.rect, `Capture.geometry.targets.${targetId}.rect`);
        for (const field of ['x', 'y', 'width', 'height']) {
            requireFiniteNumber(metrics.rect[field], `Capture.geometry.targets.${targetId}.rect.${field}`, { minimum: field === 'width' || field === 'height' ? 0 : Number.NEGATIVE_INFINITY });
        }
        for (const group of ['client', 'offset', 'scroll']) {
            requireObject(metrics[group], `Capture.geometry.targets.${targetId}.${group}`);
            for (const field of ['width', 'height']) {
                requireFiniteNumber(metrics[group][field], `Capture.geometry.targets.${targetId}.${group}.${field}`, { minimum: 0 });
            }
        }
    }
}

function validateComputedStyles(computedStyles) {
    requireObject(computedStyles, 'Capture.computedStyles');
    requireObject(computedStyles.targets, 'Capture.computedStyles.targets');
    if (Object.keys(computedStyles.targets).length === 0) {
        fail('Capture.computedStyles.targets must not be empty.');
    }
    for (const [targetId, styles] of Object.entries(computedStyles.targets)) {
        requireId(targetId, 'Capture.computedStyles targetId');
        requireObject(styles, `Capture.computedStyles.targets.${targetId}`);
        requireObject(styles.properties, `Capture.computedStyles.targets.${targetId}.properties`);
        if (Object.keys(styles.properties).length === 0) {
            fail(`Capture.computedStyles.targets.${targetId}.properties must not be empty.`);
        }
        for (const [property, value] of Object.entries(styles.properties)) {
            requireString(property, `Capture.computedStyles.targets.${targetId}.properties name`);
            if (typeof value !== 'string') fail(`Capture.computedStyles.targets.${targetId}.properties.${property} must be a string.`);
        }
        requireObject(styles.pseudoElements, `Capture.computedStyles.targets.${targetId}.pseudoElements`);
        for (const pseudo of ['before', 'after']) {
            if (Object.hasOwn(styles.pseudoElements, pseudo)) {
                requireObject(styles.pseudoElements[pseudo], `Capture.computedStyles.targets.${targetId}.pseudoElements.${pseudo}`);
                for (const [property, value] of Object.entries(styles.pseudoElements[pseudo])) {
                    requireString(property, `Capture.computedStyles.targets.${targetId}.pseudoElements.${pseudo} property`);
                    if (typeof value !== 'string') fail(`Capture.computedStyles.targets.${targetId}.pseudoElements.${pseudo}.${property} must be a string.`);
                }
            }
        }
    }
}

function validateDom(dom) {
    requireObject(dom, 'Capture.dom');
    requireObject(dom.targets, 'Capture.dom.targets');
    requireArray(dom.normalizationRules, 'Capture.dom.normalizationRules');
    if (Object.keys(dom.targets).length === 0) {
        fail('Capture.dom.targets must not be empty.');
    }
    for (const [targetId, target] of Object.entries(dom.targets)) {
        requireId(targetId, 'Capture.dom targetId');
        requireObject(target, `Capture.dom.targets.${targetId}`);
        requireArray(target.hierarchy, `Capture.dom.targets.${targetId}.hierarchy`);
        requireArray(target.classes, `Capture.dom.targets.${targetId}.classes`);
        requireArray(target.stateClasses, `Capture.dom.targets.${targetId}.stateClasses`);
        target.hierarchy.forEach((item, index) => requireString(item, `Capture.dom.targets.${targetId}.hierarchy[${index}]`));
        for (const field of ['classes', 'stateClasses']) {
            target[field].forEach((item, index) => requireString(item, `Capture.dom.targets.${targetId}.${field}[${index}]`));
        }
    }
    dom.normalizationRules.forEach((rule, index) => requireString(rule, `Capture.dom.normalizationRules[${index}]`));
}

function validateStylesheets(stylesheets) {
    requireObject(stylesheets, 'Capture.stylesheets');
    for (const field of ['external', 'inlineStylesheets', 'inlineOrder', 'legacyDeclarations']) {
        requireArray(stylesheets[field], `Capture.stylesheets.${field}`);
    }
    if (stylesheets.external.length === 0 && stylesheets.inlineStylesheets.length === 0) {
        fail('Capture.stylesheets must record at least one stylesheet.');
    }
    stylesheets.external.forEach((sheet, index) => {
        requireObject(sheet, `Capture.stylesheets.external[${index}]`);
        requireString(sheet.url, `Capture.stylesheets.external[${index}].url`);
        requireHash(sheet.sha256, `Capture.stylesheets.external[${index}].sha256`);
        if (!Number.isInteger(sheet.order) || sheet.order < 0) fail(`Capture.stylesheets.external[${index}].order must be a non-negative integer.`);
    });
    stylesheets.inlineStylesheets.forEach((sheet, index) => {
        requireObject(sheet, `Capture.stylesheets.inlineStylesheets[${index}]`);
        requireHash(sheet.sha256, `Capture.stylesheets.inlineStylesheets[${index}].sha256`);
        if (!Number.isInteger(sheet.order) || sheet.order < 0) fail(`Capture.stylesheets.inlineStylesheets[${index}].order must be a non-negative integer.`);
    });
    const externalOrder = stylesheets.external.map((sheet) => sheet.order);
    if (new Set(externalOrder).size !== externalOrder.length) {
        fail('Capture.stylesheets.external must use unique stylesheet order values.');
    }
    stylesheets.inlineOrder.forEach((item, index) => requireString(item, `Capture.stylesheets.inlineOrder[${index}]`));
    stylesheets.legacyDeclarations.forEach((item, index) => {
        requireObject(item, `Capture.stylesheets.legacyDeclarations[${index}]`);
        for (const field of ['selector', 'property']) requireString(item[field], `Capture.stylesheets.legacyDeclarations[${index}].${field}`);
        if (typeof item.value !== 'string') fail(`Capture.stylesheets.legacyDeclarations[${index}].value must be a string.`);
    });
}

function validateInteractions(interactions) {
    requireObject(interactions, 'Capture.interactions');
    requireObject(interactions.expected, 'Capture.interactions.expected');
    requireObject(interactions.actual, 'Capture.interactions.actual');
    if (Object.keys(interactions.expected).length === 0 || Object.keys(interactions.actual).length === 0) {
        fail('Capture.interactions.expected and actual must record at least one outcome.');
    }
    requireArray(interactions.missingAssets, 'Capture.interactions.missingAssets');
    requireArray(interactions.pageErrors, 'Capture.interactions.pageErrors');
    interactions.missingAssets.forEach((item, index) => requireString(item, `Capture.interactions.missingAssets[${index}]`));
    interactions.pageErrors.forEach((item, index) => requireString(item, `Capture.interactions.pageErrors[${index}]`));
}

function validateDiagnostics(diagnostics) {
    requireObject(diagnostics, 'Capture.diagnostics');
    requireFiniteNumber(diagnostics.actualDpr, 'Capture.diagnostics.actualDpr', { minimum: Number.MIN_VALUE });
    requireObject(diagnostics.screenshotDimensions, 'Capture.diagnostics.screenshotDimensions');
    for (const field of ['width', 'height']) {
        if (!Number.isInteger(diagnostics.screenshotDimensions[field]) || diagnostics.screenshotDimensions[field] < 1) {
            fail(`Capture.diagnostics.screenshotDimensions.${field} must be a positive integer.`);
        }
    }
    const observation = diagnostics.layoutObservation;
    requireObject(observation, 'Capture.diagnostics.layoutObservation');
    if (typeof observation.sufficient !== 'boolean') fail('Capture.diagnostics.layoutObservation.sufficient must be a boolean.');
    requireArray(observation.limitations, 'Capture.diagnostics.layoutObservation.limitations');
    observation.limitations.forEach((item, index) => requireString(item, `Capture.diagnostics.layoutObservation.limitations[${index}]`));
    requireString(observation.reason, 'Capture.diagnostics.layoutObservation.reason');
    if (observation.sufficient) {
        requireString(observation.method, 'Capture.diagnostics.layoutObservation.method');
        requireString(observation.scope, 'Capture.diagnostics.layoutObservation.scope');
        requireObject(observation.observedWork, 'Capture.diagnostics.layoutObservation.observedWork');
        if (Object.keys(observation.observedWork).length === 0) {
            fail('Sufficient layout observation evidence must include observed work.');
        }
    } else {
        for (const field of ['method', 'scope']) {
            if (observation[field] !== null && typeof observation[field] !== 'string') {
                fail(`Capture.diagnostics.layoutObservation.${field} must be a string or null.`);
            }
        }
        if (observation.observedWork !== null) {
            requireObject(observation.observedWork, 'Capture.diagnostics.layoutObservation.observedWork');
        }
    }
}

function validateCapture(record) {
    for (const field of ['captureId', 'runId', 'buildId', 'environmentId', 'caseId', 'state']) {
        requireId(record[field], `Capture.${field}`);
    }
    requireTimestamp(record.timestamp, 'Capture.timestamp');
    validateGeometry(record.geometry);
    validateComputedStyles(record.computedStyles);
    validateDom(record.dom);
    validateStylesheets(record.stylesheets);
    validateInteractions(record.interactions);
    validateDiagnostics(record.diagnostics);
    const geometryTargets = Object.keys(record.geometry.targets).sort();
    for (const [label, targets] of [
        ['computedStyles', record.computedStyles.targets],
        ['dom', record.dom.targets]
    ]) {
        if (!equalStringArrays(geometryTargets, Object.keys(targets).sort())) {
            fail(`Capture.${label}.targets must match Capture.geometry.targets.`);
        }
    }
    requireString(record.screenshotPath, 'Capture.screenshotPath');
    if (path.isAbsolute(record.screenshotPath) || record.screenshotPath.split(/[\\/]/).includes('..')) {
        fail('Capture.screenshotPath must stay inside its run directory.');
    }
}

function equalStringArrays(left, right) {
    return left.length === right.length && left.every((value, index) => value === right[index]);
}

function validateChangeGroup(record) {
    requireId(record.changeId, 'ChangeGroup.changeId');
    if (!Number.isInteger(record.sequence) || record.sequence < 1) {
        fail('ChangeGroup.sequence must be a positive integer.');
    }
    for (const field of ['visualGoal', 'riskAssessment', 'testMethod', 'rollbackMethod']) {
        requireString(record[field], `ChangeGroup.${field}`);
    }
    for (const field of ['affectedCases', 'variableChanges', 'ruleChanges', 'assetChanges', 'evidenceIds']) {
        requireArray(record[field], `ChangeGroup.${field}`);
    }
    requireHashes(record.sourceHashes, 'ChangeGroup.sourceHashes');
    requireStatus(record.status, changeStatuses, 'ChangeGroup.status');
    if (['approved', 'implemented', 'validated', 'accepted'].includes(record.status)) {
        requireObject(record.approval, 'ChangeGroup.approval');
        requireString(record.approval.reviewer, 'ChangeGroup.approval.reviewer');
        requireString(record.approval.scope, 'ChangeGroup.approval.scope');
        requireTimestamp(record.approval.date, 'ChangeGroup.approval.date');
        requireHashes(record.approval.sourceHashes, 'ChangeGroup.approval.sourceHashes');
        if (!sameHashes(record.sourceHashes, record.approval.sourceHashes)) {
            fail('ChangeGroup approval is stale because source hashes changed.');
        }
    }
}

function validateCategory(value, label) {
    requireObject(value, label);
    requireStatus(value.status, categoryStatuses, `${label}.status`);
    if (!Array.isArray(value.differences)) {
        fail(`${label}.differences must be an array.`);
    }
}

function validateComparisonResult(record) {
    requireId(record.resultId, 'ComparisonResult.resultId');
    requireId(record.originalCaptureId, 'ComparisonResult.originalCaptureId');
    requireId(record.candidateCaptureId, 'ComparisonResult.candidateCaptureId');
    if (record.changeId !== null) {
        requireId(record.changeId, 'ComparisonResult.changeId');
    }
    for (const field of ['geometry', 'css', 'behavior', 'visual']) {
        validateCategory(record[field], `ComparisonResult.${field}`);
    }
    for (const field of ['unexpectedDifferences', 'coverageGaps', 'approvalIds', 'evidencePaths']) {
        requireArray(record[field], `ComparisonResult.${field}`);
    }
}

function validateGateRecord(record) {
    requireId(record.gateId, 'GateRecord.gateId');
    requireStatus(record.status, gateStatuses, 'GateRecord.status');
    requireArray(record.buildIds, 'GateRecord.buildIds');
    requireArray(record.resultIds, 'GateRecord.resultIds');
    requireString(record.reason, 'GateRecord.reason');
    requireTimestamp(record.timestamp, 'GateRecord.timestamp');
    if (record.inputSetId !== null) {
        requireId(record.inputSetId, 'GateRecord.inputSetId');
    }
    if (record.reviewer !== null) {
        requireString(record.reviewer, 'GateRecord.reviewer');
    }
    requireHashes(record.dependencyHashes, 'GateRecord.dependencyHashes');
}

const validators = {
    ProductionInputSet: validateProductionInputSet,
    Environment: validateEnvironment,
    ThemeBuild: validateThemeBuild,
    ComparisonCase: validateComparisonCase,
    Capture: validateCapture,
    ChangeGroup: validateChangeGroup,
    ComparisonResult: validateComparisonResult,
    GateRecord: validateGateRecord
};

export function validateRecord(kind, record) {
    const validator = validators[kind];
    if (!validator) {
        fail(`Unknown evidence record type: ${kind}.`);
    }
    requireAllFields(kind, record);
    validator(record);
    return record;
}

export function sameHashes(left, right) {
    const leftKeys = Object.keys(left || {}).sort();
    const rightKeys = Object.keys(right || {}).sort();
    return leftKeys.length === rightKeys.length && leftKeys.every((key, index) => key === rightKeys[index] && left[key] === right[key]);
}

export function approvalIsCurrent(approval, currentHashes) {
    return Boolean(approval && sameHashes(approval.sourceHashes, currentHashes));
}

export function gateDependenciesAreCurrent(gate, currentHashes) {
    return Boolean(gate && sameHashes(gate.dependencyHashes, currentHashes));
}

export function isValidChangeTransition(previousStatus, nextStatus) {
    if (nextStatus === 'rejected') {
        return changeStatuses.includes(previousStatus) && previousStatus !== 'rejected';
    }
    const sequence = ['proposed', 'approved', 'implemented', 'validated', 'accepted'];
    return sequence.indexOf(nextStatus) === sequence.indexOf(previousStatus) + 1;
}

export function assertSafeRunId(value) {
    if (typeof value !== 'string' || !/^[A-Za-z0-9][A-Za-z0-9._-]{0,63}$/.test(value) || value.includes('..')) {
        fail('COMPAT_RUN must be a safe run identifier without separators or traversal.');
    }
    return value;
}

export function parseCaptureInputs(env = process.env) {
    const required = ['COMPAT_RUN', 'COMPAT_THEME', 'COMPAT_PHASE', 'COMPAT_BUILD_MODE', 'COMPAT_BASE_URL'];
    const missing = required.filter((name) => typeof env[name] !== 'string' || env[name].trim() === '');
    if (missing.length) {
        fail(`Missing required capture inputs: ${missing.join(', ')}.`);
    }
    const runId = assertSafeRunId(env.COMPAT_RUN);
    if (!themeRoles.includes(env.COMPAT_THEME)) {
        fail(`COMPAT_THEME must be one of: ${themeRoles.join(', ')}.`);
    }
    if (!['baseline', 'modernization'].includes(env.COMPAT_PHASE)) {
        fail('COMPAT_PHASE must be baseline or modernization.');
    }
    if (!['development', 'production'].includes(env.COMPAT_BUILD_MODE)) {
        fail('COMPAT_BUILD_MODE must be development or production.');
    }
    let baseUrl;
    try {
        baseUrl = new URL(env.COMPAT_BASE_URL);
    } catch {
        fail('COMPAT_BASE_URL must be an absolute HTTP or HTTPS URL.');
    }
    if (!['http:', 'https:'].includes(baseUrl.protocol) || baseUrl.search || baseUrl.hash) {
        fail('COMPAT_BASE_URL must use HTTP or HTTPS without query-based theme switching or a fragment.');
    }
    const suiteStage = env.COMPAT_SUITE_STAGE || 'us2';
    if (!['us2', 'us3'].includes(suiteStage)) {
        fail('COMPAT_SUITE_STAGE must be us2 or us3.');
    }
    return {
        runId,
        themeRole: env.COMPAT_THEME,
        phase: env.COMPAT_PHASE,
        buildMode: env.COMPAT_BUILD_MODE,
        baseUrl: baseUrl.href,
        suiteStage
    };
}

export function captureEvidencePath(root, { runId, buildMode, role, project, caseId, state }) {
    assertSafeRunId(runId);
    if (!['development', 'production'].includes(buildMode) || !themeRoles.includes(role)) {
        fail('Invalid build mode or theme role in evidence path.');
    }
    for (const [label, value] of Object.entries({ project, caseId, state })) {
        if (typeof value !== 'string' || !/^[A-Za-z0-9][A-Za-z0-9._-]{0,127}$/.test(value) || value.includes('..')) {
            fail(`${label} must be a safe path segment.`);
        }
    }
    const base = path.resolve(root, 'artifacts', 'compatibility', runId, buildMode, role);
    const target = path.resolve(base, project, caseId, state);
    if (target !== base && !target.startsWith(`${base}${path.sep}`)) {
        fail('Evidence path escapes its run directory.');
    }
    return target;
}

export async function writeImmutableJson(filePath, value) {
    const json = `${JSON.stringify(value, null, 4)}\n`;
    await mkdir(path.dirname(filePath), { recursive: true });
    const handle = await open(filePath, 'wx');
    try {
        await handle.writeFile(json, 'utf8');
    } finally {
        await handle.close();
    }
    return filePath;
}

export async function readJson(filePath) {
    return JSON.parse(await readFile(filePath, 'utf8'));
}

export async function sha256File(filePath) {
    const contents = await readFile(filePath);
    return createHash('sha256').update(contents).digest('hex');
}

export function requiredSuiteNames(stage) {
    if (stage === 'us2') {
        return ['capture.spec.js'];
    }
    if (stage === 'us3') {
        return ['capture.spec.js', 'css-contract.spec.js', 'interactions.spec.js'];
    }
    fail(`Unknown suite stage: ${stage}.`);
}

export function validateSuiteResults(stage, suiteResults) {
    requireArray(suiteResults, 'suiteResults');
    const byName = new Map(suiteResults.map((result) => [result.suite, result]));
    const missing = requiredSuiteNames(stage).filter((suite) => {
        const result = byName.get(suite);
        return !result || result.status !== 'completed' || !Array.isArray(result.evidencePaths);
    });
    if (missing.length) {
        fail(`Required compatibility suites are missing or incomplete: ${missing.join(', ')}.`);
    }
    return true;
}

export function buildRoleForCapture(themeRole) {
    return themeRole === 'original-repeat' ? 'original' : themeRole;
}

export function validateBuildManifest(manifest, inputs) {
    if (!manifest || typeof manifest !== 'object') {
        fail('Build manifest is missing.');
    }
    if (manifest.exitCode !== 0) {
        fail('Build manifest does not record a successful build.');
    }
    if (manifest.buildMode !== inputs.buildMode || manifest.themeRole !== buildRoleForCapture(inputs.themeRole)) {
        fail('Build manifest does not match the requested role and build mode.');
    }
    if (!manifest.selectedTheme || !manifest.packageName) {
        fail('Build manifest must record the selected theme and package name.');
    }
    requireHashes(manifest.sourceHashes, 'BuildManifest.sourceHashes');
    requireHashes(manifest.outputHashes, 'BuildManifest.outputHashes');
    if (Object.keys(manifest.outputHashes).length === 0) {
        fail('Build manifest must record at least one output hash.');
    }
    if (!Array.isArray(manifest.parentChain)) {
        fail('Build manifest.parentChain must be an array.');
    }
    return manifest;
}

export function validateCapturePair(reference, candidate) {
    const fields = ['environmentId', 'caseId', 'state'];
    const differences = fields.filter((field) => reference[field] !== candidate[field]);
    const referenceMode = reference.buildMode || reference.environment?.buildMode;
    const candidateMode = candidate.buildMode || candidate.environment?.buildMode;
    if (referenceMode !== candidateMode) {
        differences.push('buildMode');
    }
    if (differences.length) {
        fail(`Captures cannot be paired across different ${differences.join(', ')}.`);
    }
    return true;
}

export async function assertCapturePathAvailable(filePath) {
    try {
        await access(filePath);
    } catch (error) {
        if (error.code === 'ENOENT') {
            return true;
        }
        throw error;
    }
    fail(`Capture already exists and is immutable: ${filePath}.`);
}

export function validateEvidenceRelationships(bundle) {
    requireObject(bundle, 'Evidence bundle');
    for (const field of ['productionInputs', 'environments', 'builds', 'cases', 'captures', 'changeGroups', 'results']) {
        if (bundle[field] !== undefined) requireArray(bundle[field], `Evidence bundle.${field}`);
    }
    for (const inputSet of bundle.productionInputs || []) validateRecord('ProductionInputSet', inputSet);
    const environments = new Map((bundle.environments || []).map((item) => [item.environmentId, item]));
    const builds = new Map((bundle.builds || []).map((item) => [item.buildId, item]));
    const cases = new Map((bundle.cases || []).map((item) => [item.caseId, item]));
    const captures = new Map((bundle.captures || []).map((item) => [item.captureId, item]));
    const groups = new Map((bundle.changeGroups || []).map((item) => [item.changeId, item]));

    for (const environment of environments.values()) validateRecord('Environment', environment);
    for (const build of builds.values()) validateRecord('ThemeBuild', build);
    for (const comparisonCase of cases.values()) validateRecord('ComparisonCase', comparisonCase);
    for (const changeGroup of groups.values()) validateRecord('ChangeGroup', changeGroup);

    for (const capture of bundle.captures || []) {
        validateRecord('Capture', capture);
        const build = builds.get(capture.buildId);
        const environment = environments.get(capture.environmentId);
        const comparisonCase = cases.get(capture.caseId);
        if (!build || !environment || !comparisonCase) {
            fail(`Capture ${capture.captureId} references missing build, environment, or case evidence.`);
        }
        validateRecord('ThemeBuild', build);
        validateRecord('Environment', environment);
        if (build.buildMode !== environment.buildMode) {
            fail(`Capture ${capture.captureId} pairs different build modes.`);
        }
        if (capture.diagnostics.actualDpr !== environment.actualDpr) {
            fail(`Capture ${capture.captureId} DPR does not match its Environment.`);
        }
        if (!comparisonCase.states.includes(capture.state)) {
            fail(`Capture ${capture.captureId} uses a state that its ComparisonCase does not define.`);
        }
        const caseTargetIds = new Set(comparisonCase.targetElements.map((target) => target.targetId));
        const captureTargetIds = Object.keys(capture.geometry.targets);
        if (captureTargetIds.some((targetId) => !caseTargetIds.has(targetId))) {
            fail(`Capture ${capture.captureId} uses a target that its ComparisonCase does not define.`);
        }
        if (capture.role && capture.role !== build.themeRole) {
            fail(`Capture ${capture.captureId} role does not match its build.`);
        }
    }

    for (const result of bundle.results || []) {
        validateRecord('ComparisonResult', result);
        const original = captures.get(result.originalCaptureId);
        const candidate = captures.get(result.candidateCaptureId);
        if (!original || !candidate) {
            fail(`ComparisonResult ${result.resultId} references missing captures.`);
        }
        if (original.caseId !== candidate.caseId || original.environmentId !== candidate.environmentId) {
            fail(`ComparisonResult ${result.resultId} pairs different cases or environments.`);
        }
        if (original.state !== candidate.state) {
            fail(`ComparisonResult ${result.resultId} pairs different states.`);
        }
        if (result.changeId !== null && !groups.has(result.changeId)) {
            fail(`ComparisonResult ${result.resultId} references a missing change group.`);
        }
    }
    return true;
}

export function evaluateG0(inputSet) {
    if (!inputSet) {
        return { gateId: 'G0', status: 'blocked', reason: 'Production inputs are missing.' };
    }
    validateRecord('ProductionInputSet', inputSet);
    return inputSet.status === 'verified'
        ? { gateId: 'G0', status: 'passed', reason: 'Production inputs are verified.' }
        : { gateId: 'G0', status: 'blocked', reason: `Production input status is ${inputSet.status}.` };
}

export function evaluateG1({ originalBuilds = [], originalCaptures = [], stableResults = [] }) {
    if (!originalBuilds.length || !originalCaptures.length || !stableResults.length) {
        return { gateId: 'G1', status: 'not-run', reason: 'Original build and stable repeat evidence are incomplete.' };
    }
    const validBuilds = originalBuilds.every((build) => build.themeRole === 'original' && build.exitCode === 0);
    const validResults = stableResults.every((result) => result.geometry.status === 'pass' && result.css.status === 'pass' && result.behavior.status === 'pass' && result.visual.status === 'pass');
    return validBuilds && validResults
        ? { gateId: 'G1', status: 'passed', reason: 'Original captures are stable in the supplied evidence.' }
        : { gateId: 'G1', status: 'failed', reason: 'Original captures are unstable or failed a comparison.' };
}

export function evaluateG2({ g0, g1, derivedResults = [], rollbackResults = [] }) {
    if (!g0 || g0.status !== 'passed') {
        return { gateId: 'G2', status: 'blocked', reason: 'G0 has not passed.' };
    }
    if (!g1 || g1.status !== 'passed') {
        return { gateId: 'G2', status: 'blocked', reason: 'G1 has not passed.' };
    }
    const allResults = [...derivedResults, ...rollbackResults];
    if (!derivedResults.length || !rollbackResults.length || allResults.some((result) => ['geometry', 'css', 'behavior', 'visual'].some((key) => result[key].status !== 'pass'))) {
        return { gateId: 'G2', status: 'failed', reason: 'Derived or rollback results are incomplete or failed.' };
    }
    return { gateId: 'G2', status: 'passed', reason: 'Derived and rollback results pass after G0 and G1.' };
}

export function evaluateG3({ g2, changeGroup, results = [], rollbackResults = [] }) {
    if (!g2 || g2.status !== 'passed') {
        return { gateId: 'G3', status: 'blocked', reason: 'G2 has not passed.' };
    }
    if (!changeGroup || !['approved', 'implemented', 'validated', 'accepted'].includes(changeGroup.status)) {
        return { gateId: 'G3', status: 'blocked', reason: 'An approved change group is missing.' };
    }
    const complete = results.length > 0 && rollbackResults.length > 0;
    const passed = [...results, ...rollbackResults].every((result) => result.geometry.status === 'pass' && result.css.status === 'pass' && result.behavior.status === 'pass' && result.visual.status === 'pass');
    if (!complete || !passed) {
        return { gateId: 'G3', status: 'failed', reason: 'Change or rollback results are incomplete or failed.' };
    }
    return { gateId: 'G3', status: 'passed', reason: 'The approved change and rollback pass.' };
}

export function evaluateG4({ g0, g1, g2, g3 = [], acceptanceEvidence = [], rollbackEvidence = [] }) {
    if ([g0, g1, g2, ...g3].some((gate) => !gate || gate.status !== 'passed')) {
        return { gateId: 'G4', status: 'blocked', reason: 'One or more required gates have not passed.' };
    }
    if (!acceptanceEvidence.length || !rollbackEvidence.length) {
        return { gateId: 'G4', status: 'blocked', reason: 'Acceptance or rollback evidence is missing.' };
    }
    return { gateId: 'G4', status: 'passed', reason: 'Required gates, acceptance links, and rollback evidence are present.' };
}

export function runRootFromModule(moduleUrl) {
    return path.resolve(path.dirname(new URL(moduleUrl).pathname), '..', '..');
}

export function isMainModule(moduleUrl, argv = process.argv) {
    return Boolean(argv[1]) && pathToFileURL(path.resolve(argv[1])).href === moduleUrl;
}
