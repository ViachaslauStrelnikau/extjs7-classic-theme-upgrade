const { test, expect } = require('@playwright/test');

const baseUrl = process.env.COMPAT_BASE_URL || 'http://localhost:1841/';

async function openSection(page, xtype) {
    await page.goto(baseUrl, { waitUntil: 'domcontentloaded' });
    await page.waitForFunction(() => Boolean(window.Ext && Ext.isReady && Ext.ComponentQuery.query('app-main').length));
    await page.evaluate((sectionXtype) => {
        const main = Ext.ComponentQuery.query('app-main')[0];
        const compatibilityTab = main.items.items.find((item) => item.itemId === 'compatibility-lab-tab');
        if (!compatibilityTab) throw new Error('Compatibility Lab tab is missing.');
        main.setActiveTab(compatibilityTab);
        const sections = compatibilityTab.down('tabpanel');
        const section = sections.items.items.find((item) => item.getXType() === sectionXtype);
        if (!section) throw new Error(`Compatibility section ${sectionXtype} is missing.`);
        sections.setActiveTab(section);
    }, xtype);
}

async function componentElement(page, itemId) {
    const id = await page.evaluate((id) => {
        const component = Ext.ComponentQuery.query(`[itemId="${id}"]`)[0];
        return component?.rendered ? component.el.dom.id : null;
    }, itemId);
    expect(id, `${itemId} must render`).toBeTruthy();
    return page.locator(`[id="${id}"]`);
}

async function clickCenter(page, locator) {
    const bounds = await locator.boundingBox();
    expect(bounds, 'click target must have visible bounds').toBeTruthy();
    await page.mouse.click(bounds.x + bounds.width / 2, bounds.y + bounds.height / 2);
}

test('button clicks, toggles, collapse, and tab navigation keep their outcomes', async ({ page }) => {
    await openSection(page, 'compatibility-controls');
    await (await componentElement(page, 'compatibility-normal-button')).click();
    expect(await page.evaluate(() => Ext.ComponentQuery.query('#compatibility-action-result')[0].getValue()))
        .toBe('Normal action completed');

    const toolbar = await componentElement(page, 'compatibility-toolbar');
    await toolbar.locator('.x-btn').first().click();
    expect(await page.evaluate(() => Ext.ComponentQuery.query('#compatibility-action-result')[0].getValue()))
        .toBe('Toolbar action completed');

    const splitButtonId = await page.evaluate(() => Ext.ComponentQuery.query('#compatibility-toolbar')[0].items.items[1].el.dom.id);
    await clickCenter(page, page.locator(`[id="${splitButtonId}"] .x-btn-arrow-el`));
    await page.locator('.x-menu:visible .x-menu-item').filter({ hasText: 'First menu action' }).click();
    expect(await page.evaluate(() => Ext.ComponentQuery.query('#compatibility-action-result')[0].getValue()))
        .toBe('First menu action completed');

    const toggle = await componentElement(page, 'compatibility-toggle-button');
    await toggle.click();
    expect(await page.evaluate(() => Ext.ComponentQuery.query('#compatibility-toggle-button')[0].pressed)).toBe(true);
    await toggle.click();
    expect(await page.evaluate(() => Ext.ComponentQuery.query('#compatibility-toggle-button')[0].pressed)).toBe(false);

    const panel = await componentElement(page, 'compatibility-collapsible-panel');
    await panel.locator('.x-tool').click();
    await expect(panel).toHaveClass(/x-panel-collapsed/);
    await expect(panel.locator('.x-panel-body')).toBeHidden();
    await expect.poll(() => page.evaluate(() => Ext.ComponentQuery.query('#compatibility-collapsible-panel')[0].getCollapsed()))
        .toBe('top');
    await panel.locator('.x-tool').click();
    await expect.poll(() => page.evaluate(() => Ext.ComponentQuery.query('#compatibility-collapsible-panel')[0].getCollapsed()))
        .toBe(false);

    const firstTab = page.getByText('First tab', { exact: true });
    await firstTab.click();
    await page.keyboard.press('ArrowRight');
    expect(await page.evaluate(() => Ext.ComponentQuery.query('#compatibility-inner-tabs')[0].getActiveTab().itemId))
        .toBe('compatibility-second-tab');
});

test('field input, validation, choices, menus, and submenus preserve outcomes', async ({ page }) => {
    await openSection(page, 'compatibility-forms-floats');
    const required = await componentElement(page, 'compatibility-required-field');
    const validate = await componentElement(page, 'compatibility-validate-button');
    await validate.click();
    expect(await page.evaluate(() => Ext.ComponentQuery.query('#compatibility-required-field')[0].isValid())).toBe(false);
    await required.locator('input').fill('Valid value');
    await validate.click();
    expect(await page.evaluate(() => Ext.ComponentQuery.query('#compatibility-required-field')[0].isValid())).toBe(true);

    const combo = await componentElement(page, 'compatibility-combo');
    await combo.click();
    await page.locator('.x-boundlist:visible .x-boundlist-item').filter({ hasText: 'Beta' }).click();
    expect(await page.evaluate(() => Ext.ComponentQuery.query('#compatibility-combo')[0].getValue())).toBe('Beta');

    await page.getByText('Enabled option', { exact: true }).click();
    expect(await page.evaluate(() => Ext.ComponentQuery.query('#compatibility-checkbox')[0].getValue())).toBe(false);
    await page.getByText('Enabled option', { exact: true }).click();
    expect(await page.evaluate(() => Ext.ComponentQuery.query('#compatibility-checkbox')[0].getValue())).toBe(true);
    await page.getByText('Compact', { exact: true }).click();
    expect(await page.evaluate(() => Ext.ComponentQuery.query('#compatibility-radio-group')[0].getValue().mode)).toBe('compact');

    await (await componentElement(page, 'compatibility-menu-button')).click();
    await page.locator('.x-menu-item:visible').filter({ hasText: 'Menu action' }).click();
    expect(await page.evaluate(() => Ext.ComponentQuery.query('#compatibility-validation-result')[0].getValue()))
        .toBe('Menu action completed');

    await expect(page.locator('.x-menu:visible')).toHaveCount(0);

    const keyboardPage = await page.context().newPage();
    await openSection(keyboardPage, 'compatibility-forms-floats');
    await (await componentElement(keyboardPage, 'compatibility-menu-button')).click();
    await keyboardPage.keyboard.press('ArrowDown');
    await keyboardPage.keyboard.press('ArrowDown');
    await keyboardPage.keyboard.press('ArrowRight');
    await expect(keyboardPage.locator('.x-menu:visible').filter({
        has: keyboardPage.getByText('Submenu action', { exact: true })
    })).toBeVisible();
    await keyboardPage.keyboard.press('Escape');
    await expect(keyboardPage.locator('.x-menu:visible')).toHaveCount(1);
    await keyboardPage.keyboard.press('Escape');
    await expect(keyboardPage.locator('.x-menu:visible')).toHaveCount(0);
    await keyboardPage.close();
});

test('tooltips, windows, dialogs, and scrolling remain interactive', async ({ page }) => {
    await openSection(page, 'compatibility-forms-floats');
    const tooltipButton = await componentElement(page, 'compatibility-tooltip-button');
    await tooltipButton.hover();
    await expect(page.locator('.x-tip:visible')).toContainText('Compatibility tooltip fixture');
    await page.mouse.move(2, 2);
    await expect(page.locator('.x-tip:visible')).toHaveCount(0);

    await page.setViewportSize({ width: 900, height: 1280 });
    await (await componentElement(page, 'compatibility-combo')).click();
    const boundList = page.locator('.x-boundlist:visible');
    await expect(boundList).toBeVisible();
    const listBounds = await boundList.boundingBox();
    expect(listBounds.x).toBeGreaterThanOrEqual(0);
    expect(listBounds.y).toBeGreaterThanOrEqual(0);
    expect(listBounds.x + listBounds.width).toBeLessThanOrEqual(901);
    expect(listBounds.y + listBounds.height).toBeLessThanOrEqual(1281);
    await page.keyboard.press('Escape');

    await (await componentElement(page, 'compatibility-window-button')).click();
    const window = page.locator('.x-window:visible').filter({ hasText: 'Compatibility window' });
    await expect(window).toBeVisible();
    const windowId = await page.evaluate(() => Ext.ComponentQuery.query('#compatibility-window')[0].el.dom.id);
    await expect.poll(() => page.evaluate(() => document.activeElement.id)).toBe(windowId);
    const position = await page.evaluate(() => {
        const win = Ext.ComponentQuery.query('#compatibility-window')[0];
        return { x: win.getX(), y: win.getY(), width: win.getWidth(), height: win.getHeight() };
    });
    const headerId = await page.evaluate(() => Ext.ComponentQuery.query('#compatibility-window')[0].header.el.dom.id);
    const header = await page.locator(`[id="${headerId}"]`).boundingBox();
    await page.mouse.move(header.x + header.width / 2, header.y + header.height / 2);
    await page.mouse.down();
    await page.mouse.move(header.x + header.width / 2 + 40, header.y + header.height / 2 + 30, { steps: 5 });
    await page.mouse.up();
    const moved = await page.evaluate(() => {
        const win = Ext.ComponentQuery.query('#compatibility-window')[0];
        return { x: win.getX(), y: win.getY() };
    });
    expect(moved.x !== position.x || moved.y !== position.y).toBe(true);

    const beforeResize = await page.evaluate(() => {
        const win = Ext.ComponentQuery.query('#compatibility-window')[0];
        return { width: win.getWidth(), height: win.getHeight() };
    });
    const resizeHandle = window.locator('.x-resizable-handle-southeast');
    const resizeBounds = await resizeHandle.boundingBox();
    await page.mouse.move(resizeBounds.x + resizeBounds.width / 2, resizeBounds.y + resizeBounds.height / 2);
    await page.mouse.down();
    await page.mouse.move(resizeBounds.x + resizeBounds.width / 2 + 40, resizeBounds.y + resizeBounds.height / 2 + 30, { steps: 5 });
    await page.mouse.up();
    await expect.poll(() => page.evaluate(() => Ext.ComponentQuery.query('#compatibility-window')[0].getWidth()))
        .toBeGreaterThan(beforeResize.width);

    await (await componentElement(page, 'compatibility-dialog-button')).click();
    const messageBox = page.locator('.x-message-box:visible');
    await expect(messageBox).toContainText('Compatibility dialog');
    const floatStack = await page.evaluate(() => {
        const win = Ext.ComponentQuery.query('#compatibility-window')[0].el.dom;
        const dialog = document.querySelector('.x-message-box');
        return { window: Number(getComputedStyle(win).zIndex), dialog: Number(getComputedStyle(dialog).zIndex) };
    });
    expect(floatStack.dialog).toBeGreaterThan(floatStack.window);
    await page.locator('.x-message-box:visible .x-btn').first().click();
    await expect(page.locator('.x-message-box:visible')).toHaveCount(0);
    await window.locator('.x-tool').click();
    await expect(page.locator('.x-window:visible').filter({ hasText: 'Compatibility window' })).toHaveCount(0);

    const scrollPanel = await componentElement(page, 'compatibility-scroll-container');
    const scrollTarget = scrollPanel.locator('.x-panel-body');
    await scrollTarget.hover();
    await page.mouse.wheel(600, 300);
    await expect.poll(() => page.evaluate(() => {
        const panel = Ext.ComponentQuery.query('#compatibility-scroll-container')[0];
        const position = panel.getScrollable().getPosition();
        return position.x > 0 || position.y > 0;
    })).toBe(true);
});

test('grid and tree selection, sorting, editing, scrolling, and keyboard actions work', async ({ page }) => {
    await page.setViewportSize({ width: 900, height: 1280 });
    await openSection(page, 'compatibility-data-views');
    const grid = await componentElement(page, 'compatibility-grid');
    await page.getByText('Case 01', { exact: true }).click();
    expect(await page.evaluate(() => Ext.ComponentQuery.query('#compatibility-grid')[0].getSelectionModel().hasSelection())).toBe(true);

    const nameHeaderId = await page.evaluate(() => Ext.ComponentQuery.query('#compatibility-grid')[0].headerCt.items.items[1].el.dom.id);
    await page.locator(`[id="${nameHeaderId}"]`).click();
    expect(await page.evaluate(() => Ext.ComponentQuery.query('#compatibility-grid')[0].getStore().getSorters().getCount())).toBeGreaterThan(0);

    const nameCell = grid.locator('.x-grid-item').filter({ hasText: 'Case 01' }).locator('.x-grid-cell').nth(1);
    await nameCell.click();
    const editor = page.locator('.x-grid-cell-editor input');
    await expect(editor).toBeVisible();
    await editor.fill('');
    await page.keyboard.press('Enter');
    const recordName = () => page.evaluate(() => Ext.ComponentQuery.query('#compatibility-grid')[0].getStore()
        .getRange().find((record) => String(record.get('id')) === '1').get('name'));
    expect(await recordName())
        .toBe('Case 01');
    await nameCell.click();
    await expect(editor).toBeVisible();
    await editor.fill('Edited Case 01');
    await page.keyboard.press('Enter');
    expect(await recordName())
        .toBe('Edited Case 01');

    await grid.hover();
    await page.mouse.wheel(500, 0);
    await expect.poll(() => page.evaluate(() => Ext.ComponentQuery.query('#compatibility-grid')[0].getView().getScrollable().getPosition().x))
        .toBeGreaterThan(0);
    await page.mouse.wheel(0, 500);
    await expect.poll(() => page.evaluate(() => Ext.ComponentQuery.query('#compatibility-grid')[0].getView().getScrollable().getPosition().y))
        .toBeGreaterThan(0);

    const tree = await componentElement(page, 'compatibility-tree');
    const groupA = tree.locator('.x-grid-item').filter({ hasText: 'Group A' });
    await groupA.locator('.x-tree-expander').click();
    await expect.poll(() => page.evaluate(() => Ext.ComponentQuery.query('#compatibility-tree')[0].getStore()
        .getRoot().findChild('text', 'Group A').isExpanded())).toBe(false);
    await groupA.locator('.x-tree-expander').click();
    await expect.poll(() => page.evaluate(() => Ext.ComponentQuery.query('#compatibility-tree')[0].getStore()
        .getRoot().findChild('text', 'Group A').isExpanded())).toBe(true);
    await page.getByText('Node A1', { exact: true }).click();
    expect(await page.evaluate(() => Ext.ComponentQuery.query('#compatibility-tree')[0].getSelectionModel().hasSelection())).toBe(true);
    await page.keyboard.press('ArrowDown');
    await expect.poll(() => page.evaluate(() => Ext.ComponentQuery.query('#compatibility-tree')[0].getSelectionModel().getSelection()[0]?.get('text')))
        .not.toBe('Node A1');

    const appWidth = await page.evaluate(() => Ext.ComponentQuery.query('app-main')[0].getWidth());
    await page.setViewportSize({ width: 1280, height: 900 });
    await expect.poll(() => page.evaluate(() => Ext.ComponentQuery.query('app-main')[0].getWidth()))
        .toBeGreaterThan(appWidth);
});
