# T060 Demo Workflow Evidence

**Date**: 2026-10-23
**Scope**: `TestApp` development build only
**Status**: Build and rollback verified. Browser acceptance remains blocked.

The project owner selected `theme-classic-modern` in `TestApp/app.json`. Keep that selection after
the check.

## Build and rollback

Sencha Cmd 7.7.0.36 refresh and the development build passed with `theme-classic-modern` selected.
See `../../artifacts/compatibility/demo-selection-20261023/refresh.log` and
`../../artifacts/compatibility/demo-selection-20261023/development-build.log`.

The selection verifier started from the original `ext-theme-classic` setting and built the
replacement and rollback in development mode. Both builds passed. The verifier restored its
starting `app.json` bytes and found no source hash differences. See
`../../artifacts/compatibility/selection/demo-selection-20261023b/results.json`.

The workflow then restored the project owner's `theme-classic-modern` selection and rebuilt the
demo in development mode. See `../../artifacts/compatibility/demo-selection-20261023/restore-modern-refresh.log`
and `../../artifacts/compatibility/demo-selection-20261023/restore-modern-build.log`.

The development build reports two missing `navigation-more` theme images. T082 records that these
paths are unused in tested demo states. The build log records the warnings.

## Compatibility checks

`npm run test:compatibility` passed all 53 tests through the approved execution path.
`npm run compat:report` regenerated the report and returned exit code 1 because the recorded gates
remain blocked. The report status is blocked by design; report generation preserves that result.
The T084 run passed 40/40 browser tests and compared 40 toolbar states. The T086 run records the
full demo capture matrix. See [T084 toolbar evidence](t084-toolbar-demo.md) and the
[T086 compatibility report](../../artifacts/compatibility/t086-painted-readiness-20261021/compatibility-report.md).

The compatibility report remains blocked. G0 is blocked for production readiness and is deferred
to the next independent spec. G1 and G2 remain blocked by unstable layout observations and
incomplete Firefox layout-work evidence. G3 and G4 remain blocked. No production inputs or
production application coverage were tested.
