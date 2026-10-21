const { defineConfig } = require('@playwright/test');
const path = require('node:path');

const configDirectory = __dirname;
const repositoryRoot = path.resolve(configDirectory, '../..');
const jsonReportPath = process.env.COMPAT_PLAYWRIGHT_REPORT
    || path.join(repositoryRoot, 'test-results', 'compatibility', 'playwright-report.json');
const outputDirectory = process.env.COMPAT_PLAYWRIGHT_OUTPUT_DIR
    || path.join(repositoryRoot, 'test-results', 'compatibility');

const viewport = { width: 1280, height: 900 };
const projects = [
    { name: 'chromium-dpr1', browserName: 'chromium', deviceScaleFactor: 1 },
    { name: 'chromium-dpr2', browserName: 'chromium', deviceScaleFactor: 2 },
    { name: 'firefox-dpr1', browserName: 'firefox', deviceScaleFactor: 1 },
    { name: 'firefox-dpr2', browserName: 'firefox', deviceScaleFactor: 2 }
].map(({ name, browserName, deviceScaleFactor }) => ({
    name,
    use: {
        browserName,
        deviceScaleFactor
    }
}));

module.exports = defineConfig({
    testDir: configDirectory,
    testMatch: '**/*.spec.js',
    outputDir: outputDirectory,
    fullyParallel: false,
    forbidOnly: true,
    retries: 0,
    workers: 1,
    reporter: [['list'], ['json', { outputFile: jsonReportPath }]],
    updateSnapshots: 'none',
    metadata: {
        browserMode: 'headless',
        locale: 'en-US',
        timezoneId: 'UTC',
        zoomPercent: 100,
        referenceViewport: viewport,
        resizeViewport: { width: 900, height: 1280 },
        hostFonts: ['Arial', 'Tahoma', 'Verdana', 'Segoe UI'],
        applicationFonts: ['Font Awesome 5 Free']
    },
    use: {
        headless: true,
        viewport,
        locale: 'en-US',
        timezoneId: 'UTC',
        screenshot: 'only-on-failure',
        trace: 'retain-on-failure',
        video: 'off',
        colorScheme: 'light'
    },
    projects
});
