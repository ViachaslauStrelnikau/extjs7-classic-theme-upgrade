import assert from 'node:assert/strict';
import test from 'node:test';
import { browserProjects, captureVariants, viewports } from './matrix.mjs';

test('defines all browser, DPR, and viewport combinations without changing Playwright projects', () => {
    assert.deepEqual(browserProjects, ['chromium-dpr1', 'chromium-dpr2', 'firefox-dpr1', 'firefox-dpr2']);
    assert.deepEqual(viewports, [
        { id: '1280x900', width: 1280, height: 900 },
        { id: '900x1280', width: 900, height: 1280 }
    ]);
    assert.equal(captureVariants.length, 8);
    assert.equal(new Set(captureVariants.map((variant) => variant.id)).size, 8);
    for (const project of browserProjects) {
        assert.deepEqual(captureVariants.filter((variant) => variant.project === project).map((variant) => variant.viewport.id), ['1280x900', '900x1280']);
    }
});
