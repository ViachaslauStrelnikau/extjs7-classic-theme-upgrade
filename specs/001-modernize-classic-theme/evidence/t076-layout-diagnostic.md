# T076 Collapsed-Panel Layout Diagnostic

**Date**: 2026-10-22

**Status**: Partial investigation. T076 remains open.

## Method

The demo selected `theme-classic-modern` in development mode.
Chromium was `156.0.8078.4`. Playwright Test was `1.64.1`.
Each capture used a fresh browser context, locale `en-US`, and time zone `UTC`.
The diagnostic covered viewports `1280x900` and `900x1280`, each at DPR 1 and 2.
Each environment had five repeats for each readiness method.

The first method used the current capture helper.
The second method skipped geometry reads while the Ext JS animation queue was active.
The second method changed the helper in memory only.
Both methods kept the natural collapse animation and the same counter interval.
The diagnostic did not modify application, theme, or acceptance code.

The capture helper SHA-256 was
`053060238cd5e47e834dc511fb85e3bd8ad9d5140931a9985b3ed663f761ec96`.

## Results

The first run completed 40 captures without tracing.
Each cell below lists the five `LayoutCount` deltas in capture order.

| Viewport | DPR | Current readiness | Skip reads during animation |
| --- | --- | --- | --- |
| 1280x900 | 1 | 19, 20, 17, 17, 14 | 20, 15, 18, 19, 15 |
| 1280x900 | 2 | 16, 19, 18, 18, 20 | 17, 18, 15, 19, 17 |
| 900x1280 | 1 | 18, 16, 20, 18, 17 | 16, 19, 17, 19, 17 |
| 900x1280 | 2 | 20, 16, 17, 18, 17 | 16, 19, 20, 18, 17 |

Each `RecalcStyleCount` delta was two more than its layout delta.
Both methods remained unstable in every environment.
Reject the proposed readiness change as a solution for exact count repeatability.

A second run completed 40 captures. It recorded one trace per method and environment.
Both methods produced layout counts from 15 through 20.
The traces show repeated `Layout` and `UpdateLayoutTree` events during collapse.
Trace recording can affect scheduling. These traces are diagnostic evidence only.

The SDK uses elapsed time to advance animations in
`TestApp/ext/classic/classic/src/fx/Manager.js:225` and
`TestApp/ext/classic/classic/src/fx/Anim.js:452`.
This supports a scheduling-related explanation. It does not prove the full cause.
Skipping readiness geometry reads did not remove the variation.

## Classic Comparison

The same runner completed 40 captures against the original `ext-theme-classic` selection.
It covered the same viewports, DPR values, collapse action, and five repeats.
The `app.json` source hash before and after the guarded run was
`aaaf3278a9fe60cf4cac115f9f1a7653b10a0580de4ebf6d6c3c55728bcbe91f`.
The run restored `theme-classic-modern` and rebuilt it in development mode.

| Viewport | DPR | Classic layout counts | Modernized layout counts |
| --- | --- | --- | --- |
| 1280x900 | 1 | 20, 16, 17, 17, 19 | 18, 16, 17, 18, 18 |
| 1280x900 | 2 | 17, 19, 18, 18, 17 | 15, 18, 15, 18, 17 |
| 900x1280 | 1 | 19, 16, 17, 17, 17 | 20, 19, 18, 15, 18 |
| 900x1280 | 2 | 20, 18, 18, 15, 18 | 20, 15, 17, 18, 16 |

Both themes have unstable counts in every environment.
The counts vary in both themes. This result does not establish a theme-caused difference.
It shows the instability is not unique to Modernized. It does not prove equal count distributions.
The alternate readiness method also remains unstable against Classic.
No counter correction is supported by these captures.

## Reproduce

Select the theme and build it with Sencha Cmd. Stop the watcher first.
Run this command from the repository root. Use a new output directory each time.
Set `$env:COMPAT_DIAGNOSTIC_ROOT = 'TestApp'` to serve the selected development app locally.

```powershell
node tests/compatibility/diagnose-layout.cjs artifacts/compatibility/t076-layout-new-run
```

The runner loads the actual capture helpers without registering their acceptance test.
It records the loaded theme, browser version, helper hash, counters, and eight traces.
It does not verify a build manifest or produce acceptance records.
Its counter interval excludes the full capture's font/image recheck and state assertion.
Therefore, these counts cannot replace full comparison evidence.

## Evidence and Remaining Work

- [First Modernized raw counts](../../../artifacts/compatibility/t076-layout-diagnostic-20261022/results.json).
- [Traced Modernized raw counts](../../../artifacts/compatibility/t076-layout-traced-20261022/results.json).
- [Classic raw counts](../../../artifacts/compatibility/t076-classic-layout-20261022/captures/results.json).
- [Example current-method trace](../../../artifacts/compatibility/t076-classic-layout-20261022/captures/trace-false-1280-1.json).
- [Example alternate-method trace](../../../artifacts/compatibility/t076-classic-layout-20261022/captures/trace-true-1280-1.json).

The artifacts are local ignored evidence. The table preserves the first-run counts in Git.
The Node.js compatibility suite passed 52 of 52 tests. JavaScript syntax checks passed.

Record action and animation completion events with trace boundaries.
Use traces to test a counter boundary that excludes setup work but keeps the full animation.
Validate any correction against five fresh repeats in each environment.
Do not disable animations, subtract work, add tolerance, or choose a passing repeat.
Keep T035–T037, T067, T076, G1, and G2 open or blocked as applicable.
Firefox measurement remains unsupported. Production checks remain skipped.
No visual group or screenshot reference was accepted.
