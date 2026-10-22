# T076 Collapsed-Panel Layout Diagnostic

**Date**: 2026-10-22

**Status**: Demo investigation complete. G1 and G2 remain blocked.

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

## Action-Boundary Traces

Eight more traces per theme use markers immediately before the collapse action and after the
animation queue and stable-frame check complete. All recorded `Layout` events fell between those
markers. The action spans lasted 313–332 ms. The trace count matched the `LayoutCount` delta.

| Theme | Readiness method | 1280x900 DPR 1 | 1280x900 DPR 2 | 900x1280 DPR 1 | 900x1280 DPR 2 |
| --- | --- | ---: | ---: | ---: | ---: |
| Classic | Current | 20 | 17 | 20 | 20 |
| Classic | Skip reads during animation | 20 | 20 | 20 | 20 |
| Modernized | Current | 20 | 20 | 19 | 18 |
| Modernized | Skip reads during animation | 19 | 16 | 20 | 19 |

The count varies within the same action boundary and duration range.
The variation remains on the Classic reference. This diagnostic cannot assign it to the theme.
It also cannot quantify extra theme-caused work while browser frame scheduling varies.
Keep the exact layout-work comparison blocked until the measurement isolates that effect.

## Synthetic-Time Experiment

On 2026-10-22, a diagnostic used the Chrome DevTools Protocol (CDP) virtual clock.
It paused virtual time before collapse and advanced it by 400 milliseconds.
The run covered 20 Modernized captures across the four viewport and DPR combinations.
Each capture ended with no active Ext JS animations.

All captures reported four layouts. Each reported five or six style recalculations.
The 400 millisecond virtual budget elapsed in 4 to 6 milliseconds of wall time.
Natural collapse captures took 313 to 332 milliseconds and recorded 15 to 20 layouts.

This result is not valid compatibility evidence. The virtual clock compressed the animation
and changed its frame cadence. Do not use it to accept the layout-work requirement or to replace
natural animation captures. Keep the experiment diagnostic only.
See the [raw virtual-time results](../../../artifacts/compatibility/t076-virtual-time-modern-20261022/results.json).

## Reproduce

Select the theme and build it with Sencha Cmd. Stop the watcher first.
Run this command from the repository root. Use a new output directory each time.
Set `$env:COMPAT_DIAGNOSTIC_ROOT = 'TestApp'` to serve the selected development app locally.

```powershell
node tests/compatibility/diagnose-layout.cjs artifacts/compatibility/t076-layout-new-run
```

The runner loads the actual capture helpers without registering their acceptance test.
Set `COMPAT_DIAGNOSTIC_VIRTUAL_TIME=1` only to reproduce the rejected synthetic-time experiment.
It records the loaded theme, browser version, helper hash, counters, and eight traces.
It does not verify a build manifest or produce acceptance records.
Its counter interval excludes the full capture's font/image recheck and state assertion.
Therefore, these counts cannot replace full comparison evidence.

## Evidence and Remaining Work

- [First Modernized raw counts](../../../artifacts/compatibility/t076-layout-diagnostic-20261022/results.json).
- [Traced Modernized raw counts](../../../artifacts/compatibility/t076-layout-traced-20261022/results.json).
- [Classic raw counts](../../../artifacts/compatibility/t076-classic-layout-20261022/captures/results.json).
- [Classic action traces](../../../artifacts/compatibility/t076-classic-layout-20261022/captures-marked2/results.json).
- [Modernized action traces](../../../artifacts/compatibility/t076-modern-marked2-20261022/results.json).
- [Example current-method trace](../../../artifacts/compatibility/t076-classic-layout-20261022/captures/trace-false-1280-1.json).
- [Example alternate-method trace](../../../artifacts/compatibility/t076-classic-layout-20261022/captures/trace-true-1280-1.json).

The artifacts are local ignored evidence. The table preserves the first-run counts in Git.
The Node.js compatibility suite passed 53 of 53 tests. JavaScript syntax checks passed.

The investigation tested natural timing, skipped geometry reads during animation, traces,
and a virtual clock. None produced a valid stable layout comparison. Do not disable
animations, subtract work, add tolerance, or choose a passing repeat.
The demo investigation is complete. Keep T035–T037, T067, G1, and G2 open or blocked.
Firefox measurement remains unsupported. Production checks remain skipped.
No visual group or screenshot reference was accepted.
