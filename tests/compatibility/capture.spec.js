const { test, expect } = require('@playwright/test');
const fs = require('node:fs/promises');
const path = require('node:path');
const os = require('node:os');
const { createHash } = require('node:crypto');

const repositoryRoot = path.resolve(__dirname, '../..');
const sectionByCase = {
    'buttons-and-toolbars': 'compatibility-controls',
    'panels-and-headers': 'compatibility-controls',
    grids: 'compatibility-data-views',
    trees: 'compatibility-data-views',
    'forms-and-validation': 'compatibility-forms-floats',
    tabs: 'compatibility-controls',
    'menus-and-submenus': 'compatibility-forms-floats',
    'windows-and-dialogs': 'compatibility-forms-floats',
    'tooltips-and-floating-elements': 'compatibility-forms-floats',
    'scrollable-containers': 'compatibility-forms-floats'
};

const optionalTargets = {
    'grids': new Set(['x-grid-cell-editor']),
    'menus-and-submenus': new Set(['x-menu', 'x-menu-item', 'x-menu-item-active']),
    'windows-and-dialogs': new Set(['x-msgbox']),
    'tooltips-and-floating-elements': new Set(['x-tip', 'x-boundlist'])
};

function sha256(value) {
    return createHash('sha256').update(value).digest('hex');
}

function extractMetrics(metrics) {
    return Object.fromEntries(metrics.metrics
        .filter((item) => ['LayoutCount', 'RecalcStyleCount'].includes(item.name))
        .map((item) => [item.name, item.value]));
}

function metricsDelta(before, after) {
    return Object.fromEntries(Object.keys(before).map((key) => [key, after[key] - before[key]]));
}

async function navigateToCase(page, baseUrl, caseId) {
    const response = await page.goto(baseUrl, { waitUntil: 'domcontentloaded', timeout: 60000 });
    if (!response || !response.ok()) {
        throw new Error(`Application navigation failed: ${response ? response.status() : 'no response'}.`);
    }

    await page.waitForFunction(() => Boolean(window.Ext && Ext.isReady && Ext.ComponentQuery.query('app-main').length), null, { timeout: 60000 });
    await page.evaluate((componentXtype) => {
        const main = Ext.ComponentQuery.query('app-main')[0];
        const compatibilityTab = main.items.items.find((item) => item.itemId === 'compatibility-lab-tab');
        if (!compatibilityTab) throw new Error('Compatibility Lab tab is missing.');
        main.setActiveTab(compatibilityTab);
        const sections = compatibilityTab.down('tabpanel');
        const section = sections.items.items.find((item) => item.getXType() === componentXtype);
        if (!section) throw new Error(`Compatibility section ${componentXtype} is missing.`);
        sections.setActiveTab(section);
    }, sectionByCase[caseId]);

    await page.evaluate(async () => {
        await document.fonts.ready;
        await Promise.all(Array.from(document.images, (image) => image.decode().catch(() => undefined)));
    });
    await page.waitForFunction(() => Array.from(document.images).every((image) => image.complete), null, { timeout: 30000 });
}

async function componentDomId(page, itemId) {
    return page.evaluate((id) => {
        const component = Ext.ComponentQuery.query(`[itemId="${id}"]`)[0];
        return component && component.rendered ? component.el.dom.id : null;
    }, itemId);
}

async function setCaptureState(page, comparisonCase, state) {
    const action = await page.evaluate(({ caseId, stateName }) => {
        const component = (itemId) => Ext.ComponentQuery.query(`[itemId="${itemId}"]`)[0];
        const returnComponent = (itemId, event) => {
            const found = component(itemId);
            if (!found || !found.rendered) throw new Error(`Component ${itemId} is not rendered.`);
            return { itemId, event, domId: found.el.dom.id };
        };

        switch (caseId) {
            case 'buttons-and-toolbars': {
                const button = component('compatibility-normal-button');
                if (stateName === 'pressed') component('compatibility-toggle-button').toggle(true);
                if (stateName === 'disabled') component('compatibility-disabled-button').setDisabled(true);
                if (stateName === 'focused') return returnComponent('compatibility-normal-button', 'focus');
                if (stateName === 'hover') return returnComponent('compatibility-normal-button', 'hover');
                return { expectedState: stateName, actualState: stateName, ready: Boolean(button && button.rendered) };
            }
            case 'panels-and-headers': {
                const panel = component('compatibility-collapsible-panel');
                if (stateName === 'collapsed') panel.collapse();
                else panel.expand();
                return { expectedState: stateName, actualState: panel.getCollapsed() ? 'collapsed' : 'expanded' };
            }
            case 'grids': {
                const grid = component('compatibility-grid');
                const view = grid.getView();
                const plugin = grid.findPlugin('cellediting');
                if (stateName === 'selected') grid.getSelectionModel().select(0);
                if (stateName === 'focused') return returnComponent('compatibility-grid', 'focus');
                if (stateName === 'editing') plugin.startEditByPosition({ row: 0, column: 1 });
                if (stateName === 'sorted') grid.getStore().sort('name', 'ASC');
                if (stateName === 'scrolled') view.getScrollable().scrollTo(0, 120);
                return {
                    expectedState: stateName,
                    actualState: stateName,
                    ready: Boolean(grid && view && plugin)
                };
            }
            case 'trees': {
                const tree = component('compatibility-tree');
                const group = tree.getStore().getRoot().findChild('text', 'Group A', true);
                if (!group) throw new Error('Tree fixture group is missing.');
                if (stateName === 'expanded') group.expand();
                if (stateName === 'collapsed') group.collapse();
                if (stateName === 'selected') tree.getSelectionModel().select(group.firstChild);
                if (stateName === 'focused') return returnComponent('compatibility-tree', 'focus');
                return { expectedState: stateName, actualState: stateName, ready: Boolean(tree.rendered) };
            }
            case 'forms-and-validation': {
                const field = component('compatibility-required-field');
                if (stateName === 'focused') return returnComponent('compatibility-required-field', 'focus');
                if (stateName === 'invalid') field.validate();
                if (stateName === 'checked') component('compatibility-checkbox').setValue(true);
                if (stateName === 'selected') {
                    component('compatibility-combo').setValue('Beta');
                    component('compatibility-radio-group').setValue({ mode: 'compact' });
                }
                return { expectedState: stateName, actualState: stateName, ready: Boolean(field.rendered) };
            }
            case 'tabs': {
                const tabPanel = component('compatibility-inner-tabs');
                if (stateName === 'selected') tabPanel.setActiveTab(component('compatibility-second-tab'));
                if (stateName === 'focused') {
                    const tab = component('compatibility-second-tab');
                    tabPanel.setActiveTab(tab);
                    return { itemId: 'compatibility-second-tab', event: 'focus', domId: tab.tab.el.dom.id, focusTab: true };
                }
                return { expectedState: stateName, actualState: stateName, ready: Boolean(tabPanel.rendered) };
            }
            case 'menus-and-submenus': {
                const button = component('compatibility-menu-button');
                if (stateName === 'selected') {
                    button.showMenu();
                    const menu = button.getMenu();
                    const firstItem = menu.items.items[0];
                    if (!menu.isVisible() || !firstItem?.rendered) throw new Error('The first menu item did not render.');
                    return { event: 'hover', domId: firstItem.el.dom.id };
                }
                if (stateName === 'focused') return returnComponent('compatibility-menu-button', 'focus');
                if (stateName === 'hover') return returnComponent('compatibility-menu-button', 'hover');
                return { expectedState: stateName, actualState: stateName, ready: Boolean(button.rendered && button.getMenu()) };
            }
            case 'windows-and-dialogs': {
                const button = component('compatibility-window-button');
                button.el.dom.click();
                const windows = Ext.ComponentQuery.query('window');
                const win = windows.find((item) => item.itemId === 'compatibility-window');
                if (!win) throw new Error('Compatibility window did not open.');
                if (stateName === 'focused') win.focus();
                if (stateName === 'dragged') win.setPosition(80, 72);
                if (stateName === 'resized') win.setSize(420, 260);
                if (stateName === 'modal') {
                    Ext.Msg.show({
                        title: 'Compatibility dialog', message: 'Dialog interaction fixture.',
                        buttons: Ext.Msg.OKCANCEL, icon: Ext.Msg.QUESTION
                    });
                }
                return { expectedState: stateName, actualState: stateName, ready: win.isVisible() };
            }
            case 'tooltips-and-floating-elements': {
                if (stateName === 'visible') return returnComponent('compatibility-tooltip-button', 'hover');
                if (stateName === 'edge-positioned') {
                    const combo = component('compatibility-combo');
                    combo.expand();
                    return { expectedState: stateName, actualState: stateName, ready: combo.getPicker().isVisible() };
                }
                return { expectedState: stateName, actualState: stateName, ready: Boolean(component('compatibility-tooltip-button').rendered) };
            }
            case 'scrollable-containers': {
                const panel = component('compatibility-scroll-container');
                const scroller = panel.getScrollable();
                if (stateName === 'top') scroller.scrollTo(0, 0);
                if (stateName === 'scrolled-x') scroller.scrollTo(80, 0);
                if (stateName === 'scrolled-y') scroller.scrollTo(0, 100);
                return { expectedState: stateName, actualState: stateName, ready: Boolean(scroller) };
            }
            default:
                throw new Error(`No state setup exists for ${caseId}/${stateName}.`);
        }
    }, { caseId: comparisonCase.caseId, stateName: state });

    if (action.event === 'hover' || action.event === 'focus') {
        const domId = action.domId || await componentDomId(page, action.itemId);
        if (!domId) throw new Error(`State target ${action.itemId} has no rendered element.`);
        const locator = page.locator(`[id="${domId.replaceAll('"', '\\"')}"]`);
        if (action.event === 'hover') await locator.hover();
        else {
            await page.evaluate(({ itemId, focusTab }) => {
                const component = Ext.ComponentQuery.query(`[itemId="${itemId}"]`)[0];
                const focusTarget = focusTab ? component?.tab : component;
                if (!focusTarget || typeof focusTarget.focus !== 'function') {
                    throw new Error(`State target ${itemId} has no public focus method.`);
                }
                focusTarget.focus();
            }, { itemId: action.itemId, focusTab: Boolean(action.focusTab) });
        }
        return { expectedState: state, actualState: state, ready: true };
    }

    return action;
}

async function observeCaptureState(page, comparisonCase, state) {
    return page.evaluate(({ caseId, stateName }) => {
        const component = (itemId) => Ext.ComponentQuery.query(`[itemId="${itemId}"]`)[0];
        const hasClass = (itemId, className) => Boolean(component(itemId)?.el?.dom.classList.contains(className));
        switch (caseId) {
            case 'buttons-and-toolbars':
                if (stateName === 'hover') return hasClass('compatibility-normal-button', 'x-btn-over') ? stateName : 'normal';
                if (stateName === 'focused') return hasClass('compatibility-normal-button', 'x-btn-focus') ? stateName : 'normal';
                if (stateName === 'pressed') return component('compatibility-toggle-button').pressed ? stateName : 'normal';
                if (stateName === 'disabled') return component('compatibility-disabled-button').isDisabled() ? stateName : 'normal';
                return 'normal';
            case 'panels-and-headers':
                return component('compatibility-collapsible-panel').getCollapsed() ? 'collapsed' : 'expanded';
            case 'grids': {
                const grid = component('compatibility-grid');
                if (stateName === 'selected') return grid.getSelectionModel().hasSelection() ? stateName : 'normal';
                if (stateName === 'focused') return grid.el.dom.contains(document.activeElement) ? stateName : 'normal';
                if (stateName === 'editing') return grid.findPlugin('cellediting').editing ? stateName : 'normal';
                if (stateName === 'sorted') return grid.getStore().getSorters().getCount() > 0 ? stateName : 'normal';
                if (stateName === 'scrolled') return grid.getView().getScrollable().getPosition().y > 0 ? stateName : 'normal';
                return 'normal';
            }
            case 'trees': {
                const tree = component('compatibility-tree');
                const group = tree.getStore().getRoot().findChild('text', 'Group A', true);
                if (stateName === 'expanded' || stateName === 'collapsed') return group.isExpanded() ? 'expanded' : 'collapsed';
                if (stateName === 'selected') return tree.getSelectionModel().hasSelection() ? stateName : 'normal';
                if (stateName === 'focused') return tree.el.dom.contains(document.activeElement) ? stateName : 'normal';
                return 'normal';
            }
            case 'forms-and-validation': {
                if (stateName === 'focused') {
                    const field = component('compatibility-required-field');
                    return field.el.dom.contains(document.activeElement) ? stateName : 'normal';
                }
                if (stateName === 'invalid') return component('compatibility-required-field').isValid() ? 'normal' : stateName;
                if (stateName === 'read-only') return component('compatibility-readonly-field').readOnly ? stateName : 'normal';
                if (stateName === 'disabled') return component('compatibility-disabled-field').isDisabled() ? stateName : 'normal';
                if (stateName === 'checked') return component('compatibility-checkbox').getValue() === true ? stateName : 'normal';
                if (stateName === 'selected') return component('compatibility-combo').getValue() === 'Beta'
                    && component('compatibility-radio-group').getValue().mode === 'compact' ? stateName : 'normal';
                return 'normal';
            }
            case 'tabs': {
                const tabPanel = component('compatibility-inner-tabs');
                if (stateName === 'selected') return tabPanel.getActiveTab().itemId === 'compatibility-second-tab' ? stateName : 'normal';
                if (stateName === 'focused') return tabPanel.getActiveTab().tab.el.dom.contains(document.activeElement) ? stateName : 'normal';
                return 'normal';
            }
            case 'menus-and-submenus': {
                const menu = component('compatibility-menu-button').getMenu();
                if (stateName === 'selected') {
                    const activeItem = menu.items.items.some((item) => item.el?.dom.classList.contains('x-menu-item-active'));
                    return menu.isVisible() && activeItem ? stateName : 'normal';
                }
                if (stateName === 'focused') return hasClass('compatibility-menu-button', 'x-btn-focus') ? stateName : 'normal';
                if (stateName === 'hover') return hasClass('compatibility-menu-button', 'x-btn-over') ? stateName : 'normal';
                return 'normal';
            }
            case 'windows-and-dialogs': {
                const win = Ext.ComponentQuery.query('window').find((item) => item.itemId === 'compatibility-window');
                if (!win || !win.isVisible()) return 'normal';
                if (stateName === 'dragged') return win.getX() === 80 && win.getY() === 72 ? stateName : 'normal';
                if (stateName === 'resized') return win.getWidth() === 420 && win.getHeight() === 260 ? stateName : 'normal';
                if (stateName === 'modal') return Ext.Msg.isVisible() ? stateName : 'normal';
                return stateName;
            }
            case 'tooltips-and-floating-elements': {
                if (stateName === 'visible') return Array.from(document.querySelectorAll('.x-tip')).some((item) => item.getClientRects().length) ? stateName : 'hidden';
                if (stateName === 'edge-positioned') return component('compatibility-combo').getPicker().isVisible() ? stateName : 'hidden';
                return 'hidden';
            }
            case 'scrollable-containers': {
                const position = component('compatibility-scroll-container').getScrollable().getPosition();
                if (stateName === 'top') return position.x === 0 && position.y === 0 ? stateName : 'scrolled';
                if (stateName === 'scrolled-x') return position.x > 0 ? stateName : 'top';
                if (stateName === 'scrolled-y') return position.y > 0 ? stateName : 'top';
                return 'top';
            }
            default:
                return 'unknown';
        }
    }, { caseId: comparisonCase.caseId, stateName: state });
}

async function verifyBuildInPage(page, request, inputs, manifest) {
    const manifestUrl = new URL('app.json', inputs.baseUrl).href;
    const response = await request.get(manifestUrl);
    if (!response.ok()) throw new Error(`Loaded application manifest returned ${response.status()}.`);
    const appManifestText = await response.text();
    const { parseJsonc } = await import('./jsonc.mjs');
    const appManifest = parseJsonc(appManifestText);
    const expectedTheme = ['derived', 'modernized'].includes(inputs.themeRole) ? 'theme-classic-modern' : 'ext-theme-classic';
    if (appManifest.theme !== expectedTheme) {
        throw new Error(`Loaded app.json selected ${String(appManifest.theme)}; expected ${expectedTheme}.`);
    }
    if (manifest.selectedTheme !== expectedTheme || manifest.buildMode !== inputs.buildMode) {
        throw new Error('Build manifest theme or mode does not match the capture request.');
    }
    const runtimeManifest = await page.evaluate(() => {
        if (!window.Ext || !Ext.isReady || !Ext.manifest) return null;
        return typeof Ext.manifest === 'string'
            ? { reference: Ext.manifest, value: null }
            : { reference: null, value: Ext.manifest };
    });
    if (!runtimeManifest) {
        throw new Error('The application manifest did not load into a ready Ext JS application.');
    }

    let runtimeManifestValue = runtimeManifest.value;
    let runtimeManifestHash = null;
    if (runtimeManifest.reference) {
        const runtimeUrl = new URL(runtimeManifest.reference, inputs.baseUrl).href;
        const runtimeResponse = await request.get(runtimeUrl);
        if (!runtimeResponse.ok()) throw new Error(`Runtime manifest returned ${runtimeResponse.status()}.`);
        const runtimeText = await runtimeResponse.text();
        runtimeManifestHash = sha256(runtimeText);
        runtimeManifestValue = parseJsonc(runtimeText);
    } else {
        runtimeManifestHash = sha256(JSON.stringify(runtimeManifestValue));
    }
    const expectedPackage = expectedTheme === 'ext-theme-classic' ? 'theme-classic' : expectedTheme;
    const runtimeManifestText = JSON.stringify(runtimeManifestValue);
    const runtimeThemeMatches = runtimeManifestText.includes(expectedTheme) || runtimeManifestText.includes(expectedPackage);
    if (!runtimeThemeMatches) throw new Error(`Loaded runtime manifest does not identify ${expectedTheme}.`);

    const loadedHash = sha256(appManifestText);
    const localSourceText = await fs.readFile(path.join(repositoryRoot, 'TestApp', 'app.json'), 'utf8');
    const sourceHashMatches = loadedHash === sha256(localSourceText);
    const outputHashMatches = manifest.outputHashes['app.json'] === loadedHash;

    return {
        url: manifestUrl,
        sha256: loadedHash,
        manifestHashMatchesBuild: outputHashMatches || (inputs.buildMode === 'development' && sourceHashMatches),
        manifestHashSource: outputHashMatches ? 'generated-output' : sourceHashMatches ? 'development-source-config' : 'unverified',
        runtimeManifestReference: runtimeManifest.reference,
        runtimeManifestSha256: runtimeManifestHash,
        runtimeThemeMatches,
        theme: appManifest.theme,
        toolkit: appManifest.toolkit,
        manifestId: appManifest.id || null,
        runtimeManifestLoaded: true
    };
}

function verifyStylesheetHashes(stylesheets, manifest, baseUrl) {
    const basePath = new URL(baseUrl).pathname;
    return stylesheets.external.map((stylesheet) => {
        const url = new URL(stylesheet.url);
        const decodedPath = decodeURIComponent(url.pathname).replaceAll('\\', '/');
        const buildPrefix = `/build/${manifest.buildMode}/TestApp/`;
        const relativePath = decodedPath.startsWith(buildPrefix)
            ? decodedPath.slice(buildPrefix.length)
            : decodedPath.startsWith(basePath)
                ? decodedPath.slice(basePath.length)
                : decodedPath.replace(/^\//, '');
        const expectedHash = manifest.outputHashes[relativePath];
        return {
            url: stylesheet.url,
            relativePath,
            expectedHash: expectedHash || null,
            actualHash: stylesheet.sha256,
            matches: stylesheet.available && Boolean(expectedHash) && expectedHash === stylesheet.sha256
        };
    });
}

async function waitForStableFrames(page, comparisonCase) {
    const selectors = comparisonCase.targetElements.map((target) => target.componentQuery || target.domSelector);
    await page.evaluate((targetSelectors) => new Promise((resolve, reject) => {
        let previous = null;
        let stableFrames = 0;
        const deadline = performance.now() + 15000;
        const sample = () => {
            const signature = targetSelectors.map((selector) => {
                if (!selector) return null;
                let element;
                try {
                    element = selector.startsWith('#')
                        ? (Ext.ComponentQuery.query(`[itemId="${selector.slice(1)}"]`)[0]?.el?.dom || document.querySelector(selector))
                        : Array.from(document.querySelectorAll(selector)).find((candidate) => candidate.getClientRects().length) || document.querySelector(selector);
                } catch {
                    element = null;
                }
                if (!element) return null;
                const rect = element.getBoundingClientRect();
                return [rect.x, rect.y, rect.width, rect.height, element.clientWidth, element.clientHeight, element.scrollWidth, element.scrollHeight];
            });
            const current = JSON.stringify(signature);
            if (current === previous) stableFrames += 1;
            else stableFrames = 0;
            if (stableFrames >= 3) resolve();
            else if (performance.now() > deadline) reject(new Error('Target measurements did not stabilize across consecutive animation frames.'));
            else requestAnimationFrame(sample);
            previous = current;
        };
        requestAnimationFrame(sample);
    }), selectors);
}

async function resolveTargets(page, comparisonCase) {
    const resolved = await page.evaluate((targets) => targets.map((target) => {
        let element = null;
        let component = null;
        if (target.componentQuery) {
            const selector = target.componentQuery;
            const itemId = selector.startsWith('#') ? selector.slice(1) : null;
            component = itemId ? Ext.ComponentQuery.query(`[itemId="${itemId}"]`)[0] : null;
            if (!component) component = Ext.ComponentQuery.query(selector)[0] || null;
            const tabHeaderTargets = new Set(['compatibility-first-tab', 'compatibility-second-tab']);
            element = tabHeaderTargets.has(target.targetId)
                ? component?.tab?.el?.dom || null
                : component && component.rendered ? component.el.dom : null;
        } else if (target.domSelector) {
            const candidates = Array.from(document.querySelectorAll(target.domSelector));
            element = candidates.find((candidate) => candidate.getClientRects().length) || candidates[0] || null;
        }
        if (!element) return { targetId: target.targetId, missing: true };

        const chain = [];
        for (let current = element; current && current.nodeType === 1; current = current.parentElement) {
            const id = current.id && /^(?:ext-gen|ext-comp|ext-element|ext-quicktips-tip)-?\d+$/i.test(current.id)
                ? '[generated-id]'
                : current.id ? `#${current.id}` : '';
            chain.push(`${current.tagName.toLowerCase()}${id}${Array.from(current.classList, (name) => `.${name}`).join('')}`);
        }
        const rect = element.getBoundingClientRect();
        const style = window.getComputedStyle(element);
        const properties = {};
        for (let index = 0; index < style.length; index += 1) {
            const property = style[index];
            properties[property] = style.getPropertyValue(property);
        }
        const pseudoElements = {};
        for (const [name, pseudo] of [['before', '::before'], ['after', '::after']]) {
            const pseudoStyle = window.getComputedStyle(element, pseudo);
            const content = pseudoStyle.getPropertyValue('content');
            if (content && content !== 'none' && content !== 'normal'
                && pseudoStyle.getPropertyValue('display') !== 'none'
                && pseudoStyle.getPropertyValue('visibility') !== 'hidden'
                && Number(pseudoStyle.getPropertyValue('opacity') || '1') > 0) {
                const pseudoProperties = {};
                for (let index = 0; index < pseudoStyle.length; index += 1) {
                    const property = pseudoStyle[index];
                    pseudoProperties[property] = pseudoStyle.getPropertyValue(property);
                }
                pseudoElements[name] = pseudoProperties;
            }
        }

        const classes = Array.from(element.classList);
        const stateClasses = classes.filter((name) => name.startsWith('x-'));
        return {
            targetId: target.targetId,
            geometry: {
                rect: { x: rect.x, y: rect.y, width: rect.width, height: rect.height },
                client: { width: element.clientWidth, height: element.clientHeight },
                offset: { width: element.offsetWidth, height: element.offsetHeight },
                scroll: { width: element.scrollWidth, height: element.scrollHeight }
            },
            computedStyles: { properties, pseudoElements },
            dom: { hierarchy: chain.reverse(), classes, stateClasses }
        };
    }), comparisonCase.targetElements);

    const missing = resolved.filter((target) => target.missing);
    const missingRequired = missing.filter((target) => {
        const definition = comparisonCase.targetElements.find((item) => item.targetId === target.targetId);
        const selector = definition && (definition.domSelector || definition.componentQuery || '');
        const simpleSelector = selector.replace(/^.*\s/, '').replace(/[^A-Za-z0-9_-]/g, '');
        const optional = optionalTargets[comparisonCase.caseId] || new Set();
        return !optional.has(simpleSelector);
    });
    if (missingRequired.length) {
        throw new Error(`Required targets are missing: ${missingRequired.map((target) => target.targetId).join(', ')}.`);
    }
    return resolved.filter((target) => !target.missing);
}

async function collectStylesheets(page, request, comparisonCase, legacyRules) {
    const entries = await page.evaluate(() => Array.from(document.styleSheets, (sheet, order) => ({
        url: sheet.href ? new URL(sheet.href, location.href).href : null,
        order,
        inlineText: sheet.href ? null : Array.from(sheet.cssRules || [], (rule) => rule.cssText).join('\n')
    })));
    const external = [];
    const inlineStylesheets = [];
    const inlineOrder = [];
    const applicationOrder = [];

    for (const entry of entries) {
        if (entry.url) {
            let content = '';
            let status = 0;
            try {
                const response = await request.get(entry.url, { timeout: 30000 });
                status = response.status();
                if (response.ok()) content = await response.text();
            } catch {
                status = 0;
            }
            external.push({ url: entry.url, sha256: sha256(content), order: entry.order, available: status >= 200 && status < 400 });
            applicationOrder.push(`external:${entry.order}`);
        } else {
            const content = entry.inlineText || '';
            const hash = sha256(content);
            inlineStylesheets.push({ sha256: hash, order: entry.order });
            inlineOrder.push(`inline:${entry.order}:${hash}`);
            applicationOrder.push(`inline:${entry.order}`);
        }
    }

    const legacyDeclarations = await page.evaluate((rules) => {
        const results = [];
        for (const rule of rules) {
            if (rule.selector.includes('::')) continue;
            let matches = [];
            try {
                matches = Array.from(document.querySelectorAll(rule.selector));
            } catch {
                continue;
            }
            for (const element of matches) {
                results.push({
                    selector: rule.selector,
                    property: rule.property,
                    value: getComputedStyle(element).getPropertyValue(rule.property)
                });
            }
        }
        return results;
    }, legacyRules.filter((rule) => comparisonCase.legacySelectors.includes(rule.selector)));

    return { external, inlineStylesheets, inlineOrder, applicationOrder, legacyDeclarations };
}

async function readLegacyRules() {
    const css = await fs.readFile(path.join(repositoryRoot, 'TestApp', 'resources', 'css', 'compatibility-legacy.css'), 'utf8');
    const rules = [];
    for (const match of css.matchAll(/([^{}]+)\{([^{}]*)\}/g)) {
        const selectors = match[1].split(',').map((selector) => selector.trim());
        const declarations = Array.from(match[2].matchAll(/([\w-]+)\s*:\s*([^;]+)\s*;/g), (item) => ({ property: item[1].trim(), value: item[2].trim() }));
        for (const selector of selectors) {
            for (const declaration of declarations) rules.push({ selector, ...declaration });
        }
    }
    return rules;
}

async function layoutObservation(page, cdp, beforeMetrics) {
    const shifts = await page.evaluate(() => window.__compatLayoutObserver
        ? { supported: window.__compatLayoutObserver.supported, entries: window.__compatLayoutObserver.entries }
        : { supported: false, entries: [] });

    if (cdp && beforeMetrics) {
        const afterMetrics = await cdp.send('Performance.getMetrics');
        const before = extractMetrics(beforeMetrics);
        const after = extractMetrics(afterMetrics);
        const work = metricsDelta(before, after);
        const timing = afterMetrics.metrics
            .filter((item) => ['LayoutDuration', 'RecalcStyleDuration'].includes(item.name))
            .map((item) => ({ name: item.name, seconds: item.value }));
        return {
            sufficient: true,
            method: 'Chrome DevTools Protocol Performance.getMetrics',
            scope: 'entire page during state setup and settling',
            observedWork: work,
            timing,
            layoutShifts: shifts.entries,
            limitations: ['The protocol reports page totals. It does not identify the component that caused a layout pass.'],
            reason: 'Chromium reports layout and style recalculation counts for this page.'
        };
    }

    return {
        sufficient: false,
        method: 'PerformanceObserver layout-shift entries',
        scope: 'entire page during state setup and settling',
        observedWork: shifts.supported ? { layoutShifts: shifts.entries.length } : null,
        timing: [],
        layoutShifts: shifts.entries,
        limitations: ['Firefox does not expose a verified complete layout-pass counter through this capture interface.', 'Layout shifts do not include layout recalculations that leave element positions unchanged.'],
        reason: shifts.supported
            ? 'The observer records visible layout shifts but cannot detect every layout pass.'
            : 'This browser does not expose the layout-shift observer entry type.'
    };
}

async function openContext(browser, testInfo, viewport) {
    const use = testInfo.project.use;
    const context = await browser.newContext({
        viewport,
        deviceScaleFactor: use.deviceScaleFactor,
        locale: use.locale,
        timezoneId: use.timezoneId,
        colorScheme: use.colorScheme
    });
    await context.addInitScript(() => {
        window.__compatLayoutObserver = { supported: false, entries: [] };
        if (typeof PerformanceObserver === 'undefined') return;
        const supported = PerformanceObserver.supportedEntryTypes || [];
        if (!supported.includes('layout-shift')) return;
        window.__compatLayoutObserver.supported = true;
        new PerformanceObserver((list) => {
            for (const entry of list.getEntries()) {
                window.__compatLayoutObserver.entries.push({
                    startTime: entry.startTime,
                    value: entry.value,
                    hadRecentInput: entry.hadRecentInput,
                    sources: (entry.sources || []).map((source) => ({
                        node: source.node ? `${source.node.tagName.toLowerCase()}.${Array.from(source.node.classList || []).join('.')}` : null,
                        previousRect: source.previousRect,
                        currentRect: source.currentRect
                    }))
                });
            }
        }).observe({ type: 'layout-shift', buffered: true });
    });
    return context;
}

test('captures versioned compatibility evidence', async ({ browser }, testInfo) => {
    test.setTimeout(20 * 60 * 1000);

    const evidence = await import('./evidence.mjs');
    const { decodePng } = await import('./png.mjs');
    const inputs = evidence.parseCaptureInputs(process.env);
    const { captureVariants } = await import('./matrix.mjs');
    const projectName = testInfo.project.name;
    const projectUse = testInfo.project.use;
    const roleRoot = path.join(repositoryRoot, 'artifacts', 'compatibility', inputs.runId, inputs.buildMode, inputs.themeRole);
    if (JSON.stringify(testInfo.config.metadata.referenceViewport) !== JSON.stringify({ width: 1280, height: 900 })
        || JSON.stringify(testInfo.config.metadata.resizeViewport) !== JSON.stringify({ width: 900, height: 1280 })) {
        throw new Error('The capture matrix viewports do not match Playwright configuration metadata.');
    }
    const manifest = await evidence.readJson(path.join(roleRoot, 'manifest.json'));
    evidence.validateBuildManifest(manifest, inputs);
    evidence.validateRecord('ThemeBuild', manifest);

    const casesDocument = await evidence.readJson(path.join(repositoryRoot, 'artifacts', 'compatibility', inputs.runId, 'cases.json'));
    if (casesDocument.runId !== inputs.runId || !Array.isArray(casesDocument.cases)) {
        throw new Error('The immutable case document does not match this capture run.');
    }

    const expectedTheme = ['derived', 'modernized'].includes(inputs.themeRole) ? 'theme-classic-modern' : 'ext-theme-classic';
    const allLegacyRules = await readLegacyRules();
    const targetNames = new Set();
    const evidencePaths = [];

    for (const variant of captureVariants.filter((item) => item.project === projectName)) {
        const environmentId = `${variant.id}-${inputs.buildMode}`;
        const viewportEnvironmentRecords = [];
        const variantEvidencePaths = [];
        for (const comparisonCase of casesDocument.cases) {
            if (!sectionByCase[comparisonCase.caseId]) throw new Error(`No application section is mapped for ${comparisonCase.caseId}.`);

            for (const state of comparisonCase.states) {
                const context = await openContext(browser, testInfo, { width: variant.viewport.width, height: variant.viewport.height });
                const page = await context.newPage();
                const missingAssets = new Set();
                const pageErrors = [];
                page.on('pageerror', (error) => pageErrors.push(error.message));
                page.on('requestfailed', (request) => missingAssets.add(`${request.url()} (${request.failure()?.errorText || 'request failed'})`));
                page.on('response', (response) => {
                    if (response.status() >= 400) missingAssets.add(`${response.status()} ${response.url()}`);
                });

                let cdp = null;
                let beforeMetrics = null;
                if (testInfo.project.use.browserName === 'chromium') {
                    cdp = await context.newCDPSession(page);
                    await cdp.send('Performance.enable');
                }

                try {
                    await navigateToCase(page, inputs.baseUrl, comparisonCase.caseId);
                    const loadedManifest = await verifyBuildInPage(page, context.request, inputs, manifest);
                    const actualDpr = await page.evaluate(() => window.devicePixelRatio);
                    if (actualDpr !== projectUse.deviceScaleFactor) {
                        throw new Error(`Actual DPR ${actualDpr} does not match requested DPR ${projectUse.deviceScaleFactor}.`);
                    }

                    if (cdp) beforeMetrics = await cdp.send('Performance.getMetrics');
                    const stateResult = await setCaptureState(page, comparisonCase, state);
                    await page.evaluate(async () => {
                        await document.fonts.ready;
                        await Promise.all(Array.from(document.images, (image) => image.decode().catch(() => undefined)));
                    });
                    await page.waitForFunction(() => Array.from(document.images).every((image) => image.complete), null, { timeout: 30000 });
                    await waitForStableFrames(page, comparisonCase);
                    const actualState = await observeCaptureState(page, comparisonCase, state);

                    const targets = await resolveTargets(page, comparisonCase);
                    const geometryTargets = Object.fromEntries(targets.map((target) => [target.targetId, target.geometry]));
                    const computedStyleTargets = Object.fromEntries(targets.map((target) => [target.targetId, target.computedStyles]));
                    const domTargets = Object.fromEntries(targets.map((target) => [target.targetId, target.dom]));

                    const stylesheets = await collectStylesheets(page, context.request, comparisonCase, allLegacyRules);
                    const stylesheetHashChecks = verifyStylesheetHashes(stylesheets, manifest, inputs.baseUrl);
                    for (const check of stylesheetHashChecks.filter((item) => !item.matches)) {
                        missingAssets.add(`${check.url} (stylesheet hash does not match the build manifest)`);
                    }
                    const screenshotBuffer = await page.screenshot({ fullPage: false, scale: 'device' });
                    const screenshot = decodePng(screenshotBuffer);
                    if (screenshot.width !== variant.viewport.width * actualDpr
                        || screenshot.height !== variant.viewport.height * actualDpr) {
                        throw new Error(`Screenshot dimensions ${screenshot.width}x${screenshot.height} do not match viewport ${variant.viewport.width}x${variant.viewport.height} at DPR ${actualDpr}.`);
                    }
                    const screenshotRelative = path.join(inputs.buildMode, inputs.themeRole, variant.id, comparisonCase.caseId, state, 'screenshot.png');
                    const screenshotFile = path.join(repositoryRoot, 'artifacts', 'compatibility', inputs.runId, screenshotRelative);
                    await fs.mkdir(path.dirname(screenshotFile), { recursive: true });
                    await evidence.assertCapturePathAvailable(screenshotFile);
                    await fs.writeFile(screenshotFile, screenshotBuffer, { flag: 'wx' });

                    const layout = await layoutObservation(page, cdp, beforeMetrics);
                    const captureRelative = path.join(inputs.buildMode, inputs.themeRole, variant.id, comparisonCase.caseId, state, 'capture.json');
                    const captureFile = path.join(repositoryRoot, 'artifacts', 'compatibility', inputs.runId, captureRelative);
                    await evidence.assertCapturePathAvailable(captureFile);
                    const capture = {
                        schemaVersion: 1,
                        captureId: `capture-${sha256(`${inputs.runId}/${inputs.buildMode}/${inputs.themeRole}/${variant.id}/${comparisonCase.caseId}/${state}`).slice(0, 24)}`,
                        runId: inputs.runId,
                        buildId: manifest.buildId,
                        environmentId,
                        caseId: comparisonCase.caseId,
                        state,
                        timestamp: new Date().toISOString(),
                        geometry: { targets: geometryTargets },
                        computedStyles: { targets: computedStyleTargets },
                        dom: {
                            targets: domTargets,
                            normalizationRules: ['Replace generated Ext instance IDs with [generated-id].', 'Keep application IDs, hierarchy, and all classes.']
                        },
                        stylesheets,
                        interactions: {
                            expected: { configuredState: state },
                            actual: { configuredState: actualState, ready: stateResult.ready !== false, statePreparation: stateResult },
                            missingAssets: Array.from(missingAssets).sort(),
                            pageErrors
                        },
                        screenshotPath: screenshotRelative.replaceAll(path.sep, '/'),
                        diagnostics: {
                            actualDpr,
                            screenshotDimensions: { width: screenshot.width, height: screenshot.height },
                            screenshotSha256: sha256(screenshotBuffer),
                            loadedManifest,
                            stylesheetHashChecks,
                            initialRendering: { complete: true, fontStatus: await page.evaluate(() => document.fonts.status) },
                            layoutObservation: layout
                        }
                    };
                    evidence.validateRecord('Capture', capture);
                    await evidence.writeImmutableJson(captureFile, capture);
                    evidencePaths.push(captureRelative.replaceAll(path.sep, '/'), screenshotRelative.replaceAll(path.sep, '/'));
                    variantEvidencePaths.push(captureRelative.replaceAll(path.sep, '/'), screenshotRelative.replaceAll(path.sep, '/'));
                    const supplementalRecords = [
                        ['geometry.json', 'geometry'],
                        ['styles.json', 'computedStyles'],
                        ['dom.json', 'dom'],
                        ['stylesheets.json', 'stylesheets'],
                        ['interactions.json', 'interactions'],
                        ['diagnostics.json', 'diagnostics']
                    ];
                    for (const [fileName, fieldName] of supplementalRecords) {
                        const supplementalPath = path.join(path.dirname(captureFile), fileName);
                        await evidence.assertCapturePathAvailable(supplementalPath);
                        await evidence.writeImmutableJson(supplementalPath, {
                            schemaVersion: capture.schemaVersion,
                            runId: capture.runId,
                            buildId: capture.buildId,
                            environmentId: capture.environmentId,
                            caseId: capture.caseId,
                            state: capture.state,
                            [fieldName]: capture[fieldName]
                        });
                        const relativePath = path.relative(path.join(repositoryRoot, 'artifacts', 'compatibility', inputs.runId), supplementalPath).replaceAll(path.sep, '/');
                        evidencePaths.push(relativePath);
                        variantEvidencePaths.push(relativePath);
                    }
                    for (const targetId of Object.keys(geometryTargets)) targetNames.add(targetId);

                    const environment = {
                        schemaVersion: 1,
                        environmentId,
                        sdkVersion: '7.7.0.31',
                        cmdVersion: '7.7.0.36',
                        nodeVersion: process.version,
                        playwrightVersion: require('@playwright/test/package.json').version,
                        browserEngine: testInfo.project.use.browserName,
                        browserVersion: browser.version(),
                        browserMode: 'headless',
                        osVersion: `Windows ${os.release()} ${os.arch()}`,
                        fonts: testInfo.config.metadata.hostFonts,
                        viewport: page.viewportSize(),
                        zoom: 100,
                        requestedDpr: projectUse.deviceScaleFactor,
                        actualDpr,
                        locale: projectUse.locale,
                        timezone: projectUse.timezoneId,
                        buildMode: inputs.buildMode
                    };
                    evidence.validateRecord('Environment', environment);
                    viewportEnvironmentRecords.push(environment);

                    if (stateResult.ready === false) {
                        throw new Error(`State preparation reported not ready for ${comparisonCase.caseId}/${state}.`);
                    }
                    await expect(loadedManifest.manifestHashMatchesBuild).toBeTruthy();
                    if (!stylesheetHashChecks.every((item) => item.matches)) {
                        throw new Error(`Loaded stylesheet hashes do not match this build: ${JSON.stringify(stylesheetHashChecks)}.`);
                    }
                    if (actualState !== state) {
                        throw new Error(`Prepared state ${actualState} does not match ${state}.`);
                    }
                } finally {
                    if (cdp) await cdp.detach().catch(() => undefined);
                    await context.close();
                }
            }
        }
        const recordedViewports = new Set(viewportEnvironmentRecords.map((environment) => `${environment.viewport.width}x${environment.viewport.height}`));
        if (recordedViewports.size !== 1 || !recordedViewports.has(variant.viewport.id)) {
            throw new Error(`Capture environment ${variant.id} contains inconsistent viewport records.`);
        }
        const outputDirectory = path.join(roleRoot, variant.id);
        await fs.mkdir(outputDirectory, { recursive: true });
        const projectEnvironmentPath = path.join(outputDirectory, 'environment.json');
        await evidence.writeImmutableJson(projectEnvironmentPath, {
            schemaVersion: 1,
            runId: inputs.runId,
            environment: viewportEnvironmentRecords[0],
            captureCount: variantEvidencePaths.filter((item) => item.endsWith('/capture.json')).length,
            targetIds: Array.from(targetNames).sort()
        });
        const projectEvidencePath = path.join(outputDirectory, 'suite-evidence.json');
        await evidence.writeImmutableJson(projectEvidencePath, {
            schemaVersion: 1,
            runId: inputs.runId,
            themeRole: inputs.themeRole,
            project: variant.id,
            playwrightProject: projectName,
            viewport: variant.viewport,
            suite: 'capture.spec.js',
            status: 'completed',
            evidencePaths: [...variantEvidencePaths, path.relative(path.join(repositoryRoot, 'artifacts', 'compatibility', inputs.runId), projectEnvironmentPath).replaceAll(path.sep, '/')]
        });
    }
    testInfo.annotations.push({ type: 'capture-role', description: inputs.themeRole });
    testInfo.annotations.push({ type: 'expected-theme', description: expectedTheme });
});
