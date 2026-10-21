# T028 Capture Readiness Evidence

**Date**: 2026-10-21
**Run**: `t086-painted-readiness-20261021`
**Scope**: TestApp development build

## Capture checks

The run captured 336 records for each role: Original, Original-repeat, Modernized, and Rollback.
Each role passed 40 of 40 Playwright checks.

The capture waits for visible navigation tabs, required control states, and stable geometry and text
for visible Ext JS components. It waits for fonts and images before capture. It samples PNG pixels
inside visible fixture text ranges. All text anchors passed on the first screenshot attempt.

## Layout observations

Chromium records `LayoutCount`, `RecalcStyleCount`, and duration values through the Chrome DevTools
Protocol. The method covers the full page during state setup and settling. It does not identify the
component that caused a layout pass.

The Original-repeat comparison found four layout-counter differences in two collapsed-panel
captures. The Modernized comparison found two counter differences in one collapsed-panel capture.
The Rollback comparison found four counter differences in two collapsed-panel captures.

Firefox records layout-shift entries through `PerformanceObserver`. This method does not count all
layout work. The comparison marks 168 Firefox captures as blocked for each role pair.

Keep G1 and G2 blocked until the original measurements are stable and the required Firefox layout
observations are sufficient. This task completes the capture implementation. It does not pass a
baseline or production acceptance gate.

See `../../artifacts/compatibility/t086-painted-readiness-20261021/development/raw-pair-comparison.json`
and `../../artifacts/compatibility/t086-painted-readiness-20261021/suite-results.json` for run
evidence.
