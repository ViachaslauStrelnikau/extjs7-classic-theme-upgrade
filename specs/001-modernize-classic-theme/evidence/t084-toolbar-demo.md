# T084 Toolbar Surface Evidence

**Status**: Implemented and automatically validated in the TestApp demo. Screenshot review and G3 acceptance remain pending.
**Date**: 2026-10-21
**Approval**: The project owner approved the toolbar gradient change for the demo only.

## Change

The replacement theme sets $toolbar-background-gradient to dynamic('none').
It keeps the inherited $toolbar-background-color.
The change adds no component override, application CSS, or JavaScript.
The Sass file comment records this scope.

## Checks

- npm run test:compatibility passed 52 of 52 checks.
- Sencha Cmd app refresh and app build development passed with theme-classic-modern.
- The generated .x-toolbar-default rule uses background-image: none.
  It keeps background-color: #d3e1f1.
- The Playwright run passed 40 of 40 tests across Chromium and Firefox at DPR 1 and 2.
  The run recorded 336 modernized captures across both viewports.
- The server on port 1841 served the current development CSS. Its SHA-256 hash matched the local build.
- The raw toolbar delta compared T084 with the prior modernized capture. It covered 40 toolbar states.
  It found zero direct geometry differences, zero unapproved CSS differences, and zero interaction differences.
  The only computed property change was the toolbar background-image.
  Chromium changed from a blue-gray gradient to none. Firefox changed from its matching gradient to none.
- All 40 toolbar screenshots changed. All 40 difference bounds stayed inside the measured toolbar surface.
  Review the [previous capture](../../../artifacts/compatibility/t086-painted-readiness-20261021/development/modernized/chromium-dpr1-1280x900/buttons-and-toolbars/normal/screenshot.png),
  [current capture](../../../artifacts/compatibility/t084-toolbar-demo-20261021/development/modernized/chromium-dpr1-1280x900/buttons-and-toolbars/normal/screenshot.png),
  and [difference image](../../../artifacts/compatibility/t084-toolbar-demo-20261021/toolbar-surface-difference.png).

The first compatibility suite run passed 51 of 52 checks.
Windows blocked a child Node process with spawn EPERM.
The approved execution-path rerun passed all 52 checks.
The first comparison found a trailing escape in approvals.json.
The run preserves that attempt. The corrected comparison keeps its required gate blocks.

The current repository compatibility suite passed 53 of 53 checks on 2026-10-23 after the
T061 report validation update. The T084 Playwright run remains the 40 of 40 browser-test run
recorded above.

The run reuses unchanged original and rollback captures from T086 and the empty derived captures from T042.
Their case definitions, source fixture hashes, browser versions, fonts, DPR, viewports, locale, time zone,
and build mode match this run. See [baseline references](../../../artifacts/compatibility/t084-toolbar-demo-20261021/baseline-reference.json).
This run did not rebuild the original theme.

## Acceptance Status

The compatibility report keeps G0 blocked for production readiness and defers its inputs to the next independent spec. G1 is not-run. G2, G3, and G4 remain blocked. Two repeated-original collapsed-panel cases are unstable in Chromium.
The modernization comparator needs reviewer-approved screenshots. No screenshots were auto-approved.
See the [compatibility report](../../../artifacts/compatibility/t084-toolbar-demo-20261021/compatibility-report.md)
and [toolbar delta results](../../../artifacts/compatibility/t084-toolbar-demo-20261021/toolbar-delta-comparison.json).
The formal T046 comparison also blocks all 128 affected states until the reviewer approves
separate Modernized references. See
`../../../artifacts/compatibility/t086-painted-readiness-20261021/modernization-results.json`.

Production capture remains outside this feature and belongs to the next independent spec.
Do not treat this evidence as production validation.
