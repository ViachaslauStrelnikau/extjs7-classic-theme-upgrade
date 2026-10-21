import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { assertSafeRunId, schemaVersion, sha256File, validateRecord, writeImmutableJson } from './evidence.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');

const protectedProperties = [
    'width', 'height', 'min-width', 'min-height', 'max-width', 'max-height',
    'padding-top', 'padding-right', 'padding-bottom', 'padding-left',
    'margin-top', 'margin-right', 'margin-bottom', 'margin-left',
    'border-top-width', 'border-right-width', 'border-bottom-width', 'border-left-width',
    'font-family', 'font-size', 'font-weight', 'line-height', 'letter-spacing', 'box-sizing',
    'display', 'position', 'top', 'right', 'bottom', 'left', 'overflow', 'overflow-x', 'overflow-y',
    'transform'
];

const caseDefinitions = [
    {
        caseId: 'buttons-and-toolbars',
        componentFamily: 'buttons and toolbars',
        fixtureReference: 'TestApp/app/view/compatibility/Controls.js#compatibility-toolbar',
        sourcePath: 'TestApp/app/view/compatibility/Controls.js',
        states: ['normal', 'hover', 'focused', 'pressed', 'disabled'],
        targetElements: ['#compatibility-toolbar', '#compatibility-normal-button', '#compatibility-toggle-button', '#compatibility-disabled-button', '#compatibility-long-button'],
        actions: ['click-normal-button', 'toggle-button', 'open-split-button-menu', 'keyboard-focus'],
        expectedOutcomes: ['normal-action-result', 'toggle-state-change', 'split-menu-visible', 'focus-visible'],
        legacySelectors: ['.compatibility-lab .x-btn .x-btn-inner', '.compatibility-lab .compatibility-controls .x-toolbar .x-btn .x-btn-inner', '.compatibility-lab .compatibility-controls .x-btn.x-btn-over .x-btn-inner', '.compatibility-lab .compatibility-controls .x-btn.x-btn-focus .x-btn-inner', '.compatibility-lab .compatibility-controls .x-btn.x-btn-pressed .x-btn-inner', '.compatibility-lab .compatibility-controls .x-btn.x-btn-disabled .x-btn-inner'],
        pseudoElements: []
    },
    {
        caseId: 'panels-and-headers',
        componentFamily: 'panels and headers',
        fixtureReference: 'TestApp/app/view/compatibility/Controls.js#compatibility-collapsible-panel',
        sourcePath: 'TestApp/app/view/compatibility/Controls.js',
        states: ['expanded', 'collapsed'],
        targetElements: ['#compatibility-collapsible-panel', '.x-panel-header', '.x-title-text'],
        actions: ['collapse-panel', 'expand-panel'],
        expectedOutcomes: ['body-hidden', 'body-visible'],
        legacySelectors: ['.compatibility-lab .x-panel-header .x-title-text'],
        pseudoElements: ['.compatibility-lab .x-panel-header::before', '.compatibility-lab .x-panel-header::after']
    },
    {
        caseId: 'grids',
        componentFamily: 'grids',
        fixtureReference: 'TestApp/app/view/compatibility/DataViews.js#compatibility-grid',
        sourcePath: 'TestApp/app/view/compatibility/DataViews.js',
        states: ['normal', 'selected', 'focused', 'editing', 'sorted', 'scrolled'],
        targetElements: ['#compatibility-grid', '.x-grid-header-ct', '.x-grid-item', '.x-grid-cell', '.x-grid-cell-editor'],
        actions: ['select-row', 'edit-name-cell', 'reject-empty-name-cell', 'sort-name-column', 'scroll-grid-x', 'scroll-grid-y'],
        expectedOutcomes: ['row-selected', 'cell-value-saved', 'empty-edit-rejected', 'sort-order-changed', 'horizontal-scroll-changed', 'vertical-scroll-changed'],
        legacySelectors: ['.compatibility-lab .x-grid-item-selected .x-grid-cell'],
        pseudoElements: []
    },
    {
        caseId: 'trees',
        componentFamily: 'trees',
        fixtureReference: 'TestApp/app/view/compatibility/DataViews.js#compatibility-tree',
        sourcePath: 'TestApp/app/view/compatibility/DataViews.js',
        states: ['expanded', 'collapsed', 'selected', 'focused'],
        targetElements: ['#compatibility-tree', '.x-tree-node-text', '.x-tree-expander'],
        actions: ['collapse-group-a', 'expand-group-a', 'select-tree-node', 'navigate-tree-keyboard'],
        expectedOutcomes: ['children-hidden', 'children-visible', 'node-selected', 'keyboard-focus-moved'],
        legacySelectors: [],
        pseudoElements: []
    },
    {
        caseId: 'forms-and-validation',
        componentFamily: 'forms and validation',
        fixtureReference: 'TestApp/app/view/compatibility/FormsAndFloats.js#compatibility-form',
        sourcePath: 'TestApp/app/view/compatibility/FormsAndFloats.js',
        states: ['normal', 'focused', 'invalid', 'read-only', 'disabled', 'checked', 'selected'],
        targetElements: ['#compatibility-required-field', '#compatibility-combo', '#compatibility-checkbox', '#compatibility-radio-group', '#compatibility-readonly-field', '#compatibility-disabled-field'],
        actions: ['validate-empty-field', 'enter-valid-value', 'select-combo-value', 'toggle-checkbox', 'select-radio-value'],
        expectedOutcomes: ['invalid-state-visible', 'valid-state-visible', 'combo-value-changed', 'checkbox-value-changed', 'radio-value-changed'],
        legacySelectors: ['.compatibility-lab .x-form-invalid-field', '.compatibility-lab .x-form-readonly .x-form-field'],
        pseudoElements: []
    },
    {
        caseId: 'tabs',
        componentFamily: 'tabs',
        fixtureReference: 'TestApp/app/view/compatibility/Controls.js#compatibility-inner-tabs',
        sourcePath: 'TestApp/app/view/compatibility/Controls.js',
        states: ['normal', 'selected', 'focused'],
        targetElements: ['#compatibility-inner-tabs', '#compatibility-first-tab', '#compatibility-second-tab', '.x-tab-active'],
        actions: ['select-second-tab', 'navigate-tab-keyboard'],
        expectedOutcomes: ['second-tab-active', 'keyboard-focus-moved'],
        legacySelectors: ['.compatibility-lab .x-tab.x-tab-active .x-tab-inner'],
        pseudoElements: []
    },
    {
        caseId: 'menus-and-submenus',
        componentFamily: 'menus',
        fixtureReference: 'TestApp/app/view/compatibility/FormsAndFloats.js#compatibility-menu-button',
        sourcePath: 'TestApp/app/view/compatibility/FormsAndFloats.js',
        states: ['normal', 'hover', 'focused', 'selected'],
        targetElements: ['#compatibility-menu-button', '.x-menu', '.x-menu-item', '.x-menu-item-active'],
        actions: ['open-menu', 'navigate-submenu', 'activate-menu-item'],
        expectedOutcomes: ['menu-visible', 'submenu-visible', 'menu-action-result'],
        legacySelectors: ['.x-menu-item-active .x-menu-item-text'],
        pseudoElements: []
    },
    {
        caseId: 'windows-and-dialogs',
        componentFamily: 'windows and dialogs',
        fixtureReference: 'TestApp/app/view/compatibility/FormsAndFloats.js#compatibility-window',
        sourcePath: 'TestApp/app/view/compatibility/FormsAndFloats.js',
        states: ['normal', 'focused', 'dragged', 'resized', 'modal'],
        targetElements: ['#compatibility-window', '.x-window-header', '.x-msgbox'],
        actions: ['open-window-at-edge', 'drag-window', 'resize-window', 'open-dialog-over-window', 'assert-float-stacking', 'dismiss-dialog'],
        expectedOutcomes: ['window-visible', 'window-position-changed', 'window-size-changed', 'dialog-visible', 'dialog-stacked', 'dialog-hidden'],
        legacySelectors: ['.x-window-header .x-title-text'],
        pseudoElements: []
    },
    {
        caseId: 'tooltips-and-floating-elements',
        componentFamily: 'tooltips and floating elements',
        fixtureReference: 'TestApp/app/view/compatibility/FormsAndFloats.js#compatibility-tooltip-button',
        sourcePath: 'TestApp/app/view/compatibility/FormsAndFloats.js',
        states: ['hidden', 'visible', 'edge-positioned'],
        targetElements: ['#compatibility-tooltip-button', '.x-tip', '.x-boundlist'],
        actions: ['show-tooltip', 'open-combo-list-at-edge'],
        expectedOutcomes: ['tooltip-visible', 'float-within-viewport'],
        legacySelectors: [],
        pseudoElements: []
    },
    {
        caseId: 'scrollable-containers',
        componentFamily: 'scrollable containers',
        fixtureReference: 'TestApp/app/view/compatibility/FormsAndFloats.js#compatibility-scroll-container',
        sourcePath: 'TestApp/app/view/compatibility/FormsAndFloats.js',
        states: ['top', 'scrolled-x', 'scrolled-y'],
        targetElements: ['#compatibility-scroll-container', '.x-scroller'],
        actions: ['scroll-container-x', 'scroll-container-y'],
        expectedOutcomes: ['scroll-left-changed', 'scroll-top-changed'],
        legacySelectors: [],
        pseudoElements: []
    }
].map((record) => ({
    ...record,
    targetElements: record.targetElements.map((target) => ({
        targetId: target.startsWith('#') ? target.slice(1) : target.replace(/[^A-Za-z0-9]+/g, '-').replace(/^-+|-+$/g, ''),
        componentQuery: target.startsWith('#') ? target : null,
        domSelector: target.startsWith('.') ? target : null
    })),
    protectedProperties
}));

export async function createCasesDocument({ runId, sourceRoot = root, timestamp = new Date().toISOString() }) {
    assertSafeRunId(runId);
    const cases = await Promise.all(caseDefinitions.map(async (record) => {
        const { sourcePath, ...comparisonCase } = record;
        const document = {
            schemaVersion,
            ...comparisonCase,
            dataHash: await sha256File(path.resolve(sourceRoot, sourcePath))
        };
        validateRecord('ComparisonCase', document);
        return document;
    }));
    return { schemaVersion, runId, timestamp, cases };
}

export async function writeCases({ runId, artifactRoot = path.join(root, 'artifacts', 'compatibility'), sourceRoot = root, timestamp } = {}) {
    const document = await createCasesDocument({ runId, sourceRoot, timestamp });
    const outputPath = path.join(artifactRoot, runId, 'cases.json');
    await writeImmutableJson(outputPath, document);
    return { outputPath, document };
}

export function requiredComponentFamilies() {
    return caseDefinitions.map((record) => record.componentFamily);
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
    try {
        const runId = process.env.COMPAT_RUN;
        if (!runId) throw new Error('Set COMPAT_RUN before writing case records.');
        const result = await writeCases({ runId });
        console.log(`Wrote ${result.document.cases.length} cases to ${path.relative(root, result.outputPath)}.`);
    } catch (error) {
        console.error(error.message);
        process.exitCode = 2;
    }
}
