# T046 Demo Paint Group

**Date**: 2026-10-21
**Run**: `t086-painted-readiness-20261021`
**Scope**: TestApp demo only

## Approval and implementation

The project owner approved this group for the demo. The approval covers background colors and
images in the button, panel header, grid header, tab, and tab bar Sass variables. It preserves
geometry, borders, icons, and behavior. It does not cover production use.

The five approved Sass variable files use flatter blue-gray surfaces and remove gradients. The
standard Sencha Cmd 7.7.0.36 development refresh and build passed. The group adds no Sass rules or
assets.

## Comparison results

The T086 run captured 336 records for each role. CSS and behavior checks pass in all 336 Modernized
pairs. The comparison found no direct component-geometry differences. Original-repeat and Rollback
screenshots match Classic in all 336 captures.

One Modernized collapsed-panel capture has two layout-counter differences. Original-repeat and
Rollback each have two captures with four counter differences. Firefox layout evidence remains
blocked in 168 captures per pair. All 336 Modernized screenshots differ from Classic and need
reviewer-approved references.

The formal T046 comparison processed 128 affected states. It blocked all 128 because no separate
reviewer-approved Modernized screenshots are recorded. The comparison reported no capture errors.
It does not close T047 or G3. The baseline comparison is also incomplete. T086 has a Modernized role,
not the empty Derived role required by the baseline comparator. G1 is not-run and G2 remains blocked.
See `../../artifacts/compatibility/t086-painted-readiness-20261021/modernization-results.json` and
`../../artifacts/compatibility/t086-painted-readiness-20261021/development-results.json`.

T046 completes the approved demo paint implementation. T047 and G3 remain blocked by layout
evidence and screenshot review. Production compatibility remains unverified.

See `../../artifacts/compatibility/t086-painted-readiness-20261021/development/raw-pair-comparison.json`
and `../../artifacts/compatibility/t086-painted-readiness-20261021/approvals.json`.
