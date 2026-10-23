# T087 Full Demo Layout Matrix

- Date: 2026-10-23
- Run: `t087-full-demo-20261023c`
- Scope: `TestApp` development build only

## Matrix

Original, Original-repeat, Modernized, and Rollback each captured 336 states. The matrix covers
Chromium 156.0.8078.4 and Firefox 157.0, viewports 1280x900 and 900x1280, and actual DPR 1 and 2.
The capture used Arial, Tahoma, Verdana, and Segoe UI. Ext JS was 7.7.0.31. Sencha Cmd was 7.7.0.36.

Each role passed 40/40 Playwright checks. Each run included 4 capture checks, 20 CSS checks, and
16 interaction checks. No check failed or skipped.

Original-repeat and Rollback screenshots match Original in all 336 states. The captured component
geometry also matches Original in all 336 states for each role. Modernized screenshots differ from
Original in all 336 states. These are raw pair results. They do not accept the visual changes.

## Layout measurement

The capture records Chromium `Performance.getMetrics` page totals in 168 pairs. Firefox has no
complete layout-work observation in the current capture workflow. Its 168 pairs remain blocked.

Chromium counter values differ in three Original-repeat pairs, two Modernized pairs, and three
Rollback pairs. Every mismatch is the collapsed `panels-and-headers` state. The Original reference
also differs from its repeat. The current method cannot isolate theme-caused layout work. The
[T076 investigation](t076-layout-diagnostic.md) records the natural-animation traces and rejected
synthetic-time experiment. Do not use a tolerance, disable animations, or accept a selected repeat.

No supported complete cross-browser method was found. G1 and G2 remain blocked.

## Formal status

`compat:compare` and `compat:report` exited 1 with blocked results. G0 remains deferred for
production inputs. G1 is not-run because this four-role run has no derived manifest. G2, G3, and G4
remain blocked. The 152 T073 modernization records remain blocked because the prior visual group
and separate reviewed references are not accepted. T086 remains open for the screenshot decision.

No production input was collected. No production build or capture ran.

## Evidence

- [Raw layout and geometry comparison](../../../artifacts/compatibility/t087-full-demo-20261023c/raw-layout-comparison.json)
- [Development results](../../../artifacts/compatibility/t087-full-demo-20261023c/development-results.json)
- [Modernization results](../../../artifacts/compatibility/t087-full-demo-20261023c/modernization-results.json)
- [Playwright suite results](../../../artifacts/compatibility/t087-full-demo-20261023c/suite-results.json)
- [Compatibility report](../../../artifacts/compatibility/t087-full-demo-20261023c/compatibility-report.md)
- [Classic build log](../../../artifacts/compatibility/t087-full-demo-20261023c/classic-build.log)
- [Modernized build log](../../../artifacts/compatibility/t087-full-demo-20261023c/modernized-build.log)
- [Rollback build log](../../../artifacts/compatibility/t087-full-demo-20261023c/rollback-build.log)
