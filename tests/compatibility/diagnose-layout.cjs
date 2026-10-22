const fs = require('node:fs');
const path = require('node:path');
const Module = require('node:module');
const { createHash } = require('node:crypto');
const { chromium } = require('@playwright/test');
const root = path.resolve(__dirname, '../..');
const outputDirectory = process.argv[2];
if (!outputDirectory) throw new Error('Supply a new diagnostic output directory.');
fs.mkdirSync(outputDirectory, { recursive: false });
const baseUrl = process.argv[3] || 'http://localhost:1841/';
const file = path.join(root, 'tests/compatibility/capture.spec.js');
const fullSource = fs.readFileSync(file, 'utf8');
const marker = "test('captures versioned compatibility evidence'";
if (!fullSource.includes(marker)) throw new Error('The capture test registration changed. Review this diagnostic.');
const source = fullSource.split(marker)[0];
// Load the actual capture helpers without registering the acceptance test.
// The alternate variant exists only in memory. It cannot change the acceptance harness.
function harness(skip) {
    if (!source.includes('const activeAnimationCount = animationQueue.length;')) {
        throw new Error('The readiness helper changed. Review this diagnostic.');
    }
    const loaded = new Module(file, module);
    loaded.filename = file;
    loaded.paths = Module._nodeModulePaths(path.dirname(file));
    const code = skip ? source.replace('const activeAnimationCount = animationQueue.length;', `const activeAnimationCount = animationQueue.length;
            if (activeAnimationCount > 0) {
                if (performance.now() > deadline) return reject(new Error('Animation did not finish.'));
                requestAnimationFrame(sample);
                return;
            }`) : source;
    loaded._compile(code + '\nmodule.exports = { navigateToCase, waitForStableFrames, setCaptureState, extractMetrics };', file);
    return loaded.exports;
}
(async () => {
    const browser = await chromium.launch();
    const results = [];
    try {
        for (const skip of [false, true]) {
            const api = harness(skip);
            for (const viewport of [{ width: 1280, height: 900 }, { width: 900, height: 1280 }]) {
                for (const dpr of [1, 2]) {
                    for (let repeat = 1; repeat <= 5; repeat++) {
                        const context = await browser.newContext({ viewport, deviceScaleFactor: dpr, locale: 'en-US', timezoneId: 'UTC' });
                        const page = await context.newPage();
                        const cdp = await context.newCDPSession(page);
                        await cdp.send('Performance.enable');
                        const definition = {
                            caseId: 'panels-and-headers',
                            targetElements: [
                                { componentQuery: '#compatibility-collapsible-panel' },
                                { domSelector: '.x-panel-header' },
                                { domSelector: '.x-title-text' }
                            ]
                        };
                        await api.navigateToCase(page, baseUrl, definition.caseId);
                        await api.waitForStableFrames(page, definition);
                        // Trace one repeat per environment. Trace overhead is part of this diagnostic.
                        if (repeat === 1) await cdp.send('Tracing.start', {
                            categories: 'devtools.timeline,blink.user_timing',
                            transferMode: 'ReturnAsStream'
                        });
                        const before = api.extractMetrics(await cdp.send('Performance.getMetrics'));
                        await api.setCaptureState(page, definition, 'collapsed');
                        await api.waitForStableFrames(page, definition);
                        const after = api.extractMetrics(await cdp.send('Performance.getMetrics'));
                        if (repeat === 1) {
                            const complete = new Promise(resolve => cdp.once('Tracing.tracingComplete', resolve));
                            await cdp.send('Tracing.end');
                            const { stream } = await complete;
                            const chunks = [];
                            let part;
                            do {
                                part = await cdp.send('IO.read', { handle: stream });
                                chunks.push(Buffer.from(part.data, part.base64Encoded ? 'base64' : 'utf8'));
                            } while (!part.eof);
                            await cdp.send('IO.close', { handle: stream });
                            fs.writeFileSync(path.join(outputDirectory,
                                `trace-${skip}-${viewport.width}-${dpr}.json`), Buffer.concat(chunks), { flag: 'wx' });
                        }
                        const row = {
                            skipGeometryDuringAnimation: skip, viewport, dpr, repeat,
                            traced: repeat === 1,
                            theme: await page.evaluate(() => Ext.manifest.theme),
                            work: Object.fromEntries(Object.keys(before).map(key => [key, after[key] - before[key]]))
                        };
                        results.push(row);
                        console.log(JSON.stringify(row));
                        fs.writeFileSync(path.join(outputDirectory, 'results.json'), JSON.stringify({
                            diagnosticOnly: true,
                            timestamp: new Date().toISOString(),
                            browser: browser.version(),
                            playwrightVersion: require('@playwright/test/package.json').version,
                            sourceSha256: createHash('sha256').update(fs.readFileSync(file)).digest('hex'),
                            baseUrl,
                            results
                        }, null, 2));
                        await context.close();
                    }
                }
            }
        }
    } finally {
        await browser.close();
    }
})().catch(error => {
    console.error(error);
    process.exitCode = 1;
});
