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

test('keeps legacy button selectors effective through normal and interactive states', async ({ page }) => {
    await openSection(page, 'compatibility-controls');
    const normal = await componentElement(page, 'compatibility-normal-button');
    const toolbar = await componentElement(page, 'compatibility-toolbar');
    const toggle = await componentElement(page, 'compatibility-toggle-button');
    const disabled = await componentElement(page, 'compatibility-disabled-button');

    await expect(normal).toHaveClass(/x-btn/);
    await expect(normal.locator('.x-btn-inner')).toHaveCSS('color', 'rgb(23, 59, 92)');
    await expect(toolbar.locator('.x-btn-inner').first()).toHaveCSS('color', 'rgb(36, 79, 112)');

    await normal.hover();
    await expect(normal.locator('.x-btn-inner')).toHaveCSS('color', 'rgb(122, 62, 18)');
    await normal.evaluate((element) => element.focus());
    await expect(normal.locator('.x-btn-inner')).toHaveCSS('color', 'rgb(107, 47, 117)');

    await toggle.evaluate((element) => Ext.getCmp(element.id).toggle(true));
    await expect(toggle.locator('.x-btn-inner')).toHaveCSS('color', 'rgb(20, 92, 54)');
    await disabled.evaluate((element) => Ext.getCmp(element.id).setDisabled(true));
    await expect(disabled.locator('.x-btn-inner')).toHaveCSS('color', 'rgb(102, 102, 102)');
});

test('keeps selected, invalid, and read-only legacy declarations effective', async ({ page }) => {
    await openSection(page, 'compatibility-data-views');
    const selectedGridCell = await page.evaluate(() => {
        const grid = Ext.ComponentQuery.query('#compatibility-grid')[0];
        grid.getSelectionModel().select(0);
        const cell = grid.getView().getNode(0).querySelector('.x-grid-cell');
        return { className: cell.className, background: getComputedStyle(cell).backgroundColor, color: getComputedStyle(cell).color };
    });
    expect(selectedGridCell.className).toContain('x-grid-cell');
    expect(selectedGridCell.background).toBe('rgb(220, 234, 245)');
    expect(selectedGridCell.color).toBe('rgb(23, 59, 92)');

    await openSection(page, 'compatibility-forms-floats');
    const fieldStyles = await page.evaluate(() => {
        const invalid = Ext.ComponentQuery.query('#compatibility-required-field')[0];
        const readOnly = Ext.ComponentQuery.query('#compatibility-readonly-field')[0];
        invalid.setValue('');
        invalid.validate();
        return {
            invalidClass: invalid.inputEl.dom.className,
            invalidBorder: getComputedStyle(invalid.inputEl.dom).borderColor,
            readOnlyClass: readOnly.el.dom.className,
            readOnlyBackground: getComputedStyle(readOnly.inputEl.dom).backgroundColor
        };
    });
    expect(fieldStyles.invalidClass).toContain('x-form-invalid-field');
    expect(fieldStyles.invalidBorder).toBe('rgb(163, 40, 40)');
    expect(fieldStyles.readOnlyClass).toContain('x-form-readonly');
    expect(fieldStyles.readOnlyBackground).toBe('rgb(240, 242, 244)');

    await openSection(page, 'compatibility-controls');
    const secondTab = await componentElement(page, 'compatibility-inner-tabs');
    await secondTab.getByText('Second tab', { exact: true }).click();
    await expect(secondTab.locator('.x-tab-active .x-tab-inner')).toHaveCSS('color', 'rgb(23, 59, 92)');

    const button = await componentElement(page, 'compatibility-normal-button');
    const buttonText = button.locator('.x-btn-inner');
    await buttonText.evaluate((element) => { element.style.color = 'rgb(1, 2, 3)'; });
    await expect(buttonText).toHaveCSS('color', 'rgb(1, 2, 3)');
    await buttonText.evaluate((element) => { element.style.removeProperty('color'); });
});

test('keeps pseudo-element declarations and stylesheet order stable', async ({ page }) => {
    await openSection(page, 'compatibility-controls');
    const result = await page.evaluate(() => {
        const header = Ext.ComponentQuery.query('#compatibility-collapsible-panel')[0].header.el.dom;
        const pseudo = getComputedStyle(header, '::before');
        const sheets = Array.from(document.styleSheets).map((sheet) => ({
            href: sheet.href,
            id: sheet.ownerNode.id,
            tagName: sheet.ownerNode.tagName
        }));
        const scope = document.querySelector('.compatibility-lab');
        return {
            content: pseudo.content,
            display: pseudo.display,
            cascadeOrder: getComputedStyle(scope).getPropertyValue('--compatibility-cascade-order').trim(),
            sheets
        };
    });

    expect(result.content).toBe('"compatibility-fixture"');
    expect(result.display).toBe('none');
    const inlineIndex = result.sheets.findIndex((sheet) => sheet.id === 'compatibility-inline-css');
    const legacyIndex = result.sheets.findIndex((sheet) => sheet.href?.includes('compatibility-legacy.css'));
    expect(legacyIndex).toBeGreaterThanOrEqual(0);
    const themeIndex = result.sheets.findIndex((sheet) => /TestApp-all.*\.css/i.test(sheet.href || ''));
    expect(inlineIndex).toBeGreaterThanOrEqual(0);
    expect(themeIndex).toBeGreaterThan(inlineIndex);
    expect(legacyIndex).toBeGreaterThan(themeIndex);
    expect(result.cascadeOrder).toBe('external');
});

test('preserves configured ui, cls, and bodyCls hooks', async ({ page }) => {
    await openSection(page, 'compatibility-forms-floats');
    const result = await page.evaluate(() => {
        const main = Ext.ComponentQuery.query('app-main')[0];
        const lab = main.items.items.find((item) => item.itemId === 'compatibility-lab-tab');
        const scrollPanel = Ext.ComponentQuery.query('#compatibility-scroll-container')[0];
        return {
            ui: main.ui,
            uiClass: lab.tab.el.dom.classList.contains('x-tab-navigation'),
            cls: lab.el.dom.classList.contains('compatibility-lab'),
            bodyCls: scrollPanel.body.el.dom.classList.contains('compatibility-scroll-body'),
            bodyStyle: getComputedStyle(scrollPanel.body.el.dom).getPropertyValue('--compatibility-body-class').trim()
        };
    });

    expect(result.ui).toBe('navigation');
    expect(result.uiClass).toBe(true);
    expect(result.cls).toBe(true);
    expect(result.bodyCls).toBe(true);
    expect(result.bodyStyle).toBe('retained');
});

test('keeps long text and the grid stress case available', async ({ page }) => {
    await page.setViewportSize({ width: 900, height: 1280 });
    await openSection(page, 'compatibility-data-views');
    const gridMetrics = await page.evaluate(() => {
        const grid = Ext.ComponentQuery.query('#compatibility-grid')[0];
        const view = grid.getView().el.dom;
        return {
            records: grid.getStore().getCount(),
            columns: grid.headerCt.items.items.length,
            scrollWidth: view.scrollWidth,
            clientWidth: view.clientWidth
        };
    });
    expect(gridMetrics.records).toBe(64);
    expect(gridMetrics.columns).toBe(6);
    expect(gridMetrics.scrollWidth).toBeGreaterThan(gridMetrics.clientWidth);

    await openSection(page, 'compatibility-controls');
    const longButton = await componentElement(page, 'compatibility-long-button');
    await expect(longButton.locator('.x-btn-inner'))
        .toHaveText('Long button text for clipping and alignment checks');
});
