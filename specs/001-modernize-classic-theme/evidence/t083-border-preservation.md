# T083: Grid and tab border preservation

The T046 approval allows background colors and images. It lists no new CSS rules. On 2026-10-21, the project owner approved the grid-header border rule and grid-header and tab border variables for the TestApp demo only.

Keep these declarations to preserve the Classic border colors while the approved surface colors change. This approval does not cover production use.

## Verification

- Sencha Cmd 7.7.0.36 refreshed and built the development app with `theme-classic-modern` selected.
- The new CSS bundles match the T086 browser capture hashes. The captured order is inline styles, two theme bundles, then `compatibility-legacy.css`.
- Original and Modernized grid-header bottom borders both compute to `rgb(197, 197, 197)`. The captured tab borders both compute to `rgb(141, 179, 227)`.
- The legacy cascade fixture remains active. The Modernized pair passed 336 CSS comparisons and 336 behavior comparisons.

## Limits

The build still reports missing tab-navigation images. T082 tracks that finding. This approval does not pass G2 or G3. Production checks remain open.

## Artifacts

- [Demo-only approval](../../../artifacts/compatibility/t083-border-preservation-20261021/approval.json)
- [Build and comparison review](../../../artifacts/compatibility/t083-border-preservation-20261021/review.json)
- [T086 comparison](../../../artifacts/compatibility/t086-painted-readiness-20261021/development/raw-pair-comparison.json)
