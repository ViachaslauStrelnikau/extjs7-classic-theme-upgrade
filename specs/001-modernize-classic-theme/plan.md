# Implementation Plan: Drop-in Classic Theme Modernization

**Branch**: `master` (repository commit `5fe483e`; feature context `001-modernize-classic-theme`)
**Date**: 2026-10-20 | **Spec**: [spec.md](spec.md)
**Input**: `specs/001-modernize-classic-theme/spec.md`
**Status**: Phase 0 research and Phase 1 design complete. No runtime gate has passed.

## Summary

Deliver `theme-classic-modern` as a standard local Sencha Cmd theme package.
Support only Ext JS 7.7.0.31 Classic Toolkit.
Use the existing `TestApp` and Fashion Sass pipeline.
Select the package through `TestApp/app.json`. Rebuild through Sencha Cmd.
Keep the original theme available for rollback.

Start with no visual customizations. Prove equivalent output before changing paint.
Use inherited Sass variables before adding component rules.
Use Playwright for geometry, computed styles, screenshots, and interactions.
Do not create an application, runtime theme switcher, or CSS overlay.

The verified demo parent is `theme-classic`. Production inheritance is not available.
Treat this parent as the demo candidate until production inputs are verified.
If production uses another active package, resolve inheritance before baseline acceptance.
Do not claim that one package supports incompatible parent chains.

## Technical Context

**Language/Version**: Fashion-compatible Sass for the package. Existing Ext JS JavaScript for demo
fixtures. JavaScript on Node.js for the test harness. Preserve application language targets.

**Primary Dependencies**: Ext JS 7.7.0.31; installed Sencha Cmd 7.7.0.36.
The SDK records minimum Cmd 7.7.0.33. Keep the current SDK and Cmd.
Add only `@playwright/test` as a browser test dependency.
Pin an exact supported release during implementation. Lock its matching browser binaries.
Record the exact version in the lockfile and run manifests.

**Storage**: JSON measurements, PNG images, build logs, traces, and Markdown reports. No database.

**Testing**: Four Playwright projects: Chromium and Firefox, each at device pixel ratio (DPR) 1 and 2.
Use exact geometry comparisons and reviewed image comparisons. Capture both configured viewports.
Playwright Test 1.64.1 and the root capture, compare, and report scripts are installed.
The original demo capture completed in development. This does not pass production acceptance.

**Target Platform**: Fixed Windows host and fonts. One browser mode per reference set.
Use viewport 1280 × 900 CSS pixels and resize case 900 × 1280.
Set zoom to 100%, locale to `en-US`, and time zone to `UTC`.
Record actual browser versions, DPR, fonts, operating system, and viewport.

**Project Type**: Reusable theme package, existing demo, and external browser test harness.

**Performance Goals**: Zero unintended layout or scroll changes. No new theme runtime logic.
No numerical latency target was specified. Record instability and rendering errors as failures.

**Constraints**: Preserve geometry, APIs, DOM, `.x-*` contracts, CSS, font metrics, and build commands.
Require verified production inputs before baseline acceptance or modernization.

**Scale/Scope**: One SDK version, one package, ten required component families, applicable states,
four browser/DPR combinations, and two viewport cases. Add verified production-specific coverage.

## Constitution Check

Review against constitution 2.0.0 passed before research and after design.
This is a design review. It does not waive execution gates.

| Rule | Design response | Result |
| --- | --- | --- |
| Standard replaceable package | Local Cmd package; standard selection and rebuild | Pass |
| Preserve inheritance | Verify production chain before final parent selection | Pass; execution dependency |
| Geometry and CSS contracts | Exact measurements, cascade checks, DOM checks | Pass |
| Controlled paint changes | Empty derived baseline; ordered change groups | Pass |
| Evidence before claims | Separate verified source facts, design, and runtime results | Pass |
| Production gate | G0 blocks baseline acceptance and modernization | Pass; G0 blocked |
| Documentation standard | Simplified Technical English principles | Pass; no certification claimed |

| Gate | Required evidence | Current status |
| --- | --- | --- |
| G0: Production inputs | Actual CSS and order, theme parent chain, component and state inventory | BLOCKED: inputs absent |
| G1: Original build | Standard Cmd metadata, successful build, stable original captures | PARTIAL; one development capture is complete, repeat and production runs are pending |
| G2: Derived baseline | G0 and G1 pass; empty derived theme matches all required cases | NOT RUN; acceptance blocked by G0 |
| G3: Change group | G2 passes; approved goal; relevant regressions pass | BLOCKED until G2 passes |
| G4: Release and rollback | Complete acceptance evidence and successful rollback | NOT RUN |

Preparatory demo and harness work may be provisional.
Do not accept a baseline or start paint changes while G0 is blocked.
Stop work that conflicts with a constitutional rule. Documentation is not exception approval.

## Project Structure

### Documentation (this feature)

```text
specs/001-modernize-classic-theme/
├── spec.md
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
└── contracts/
    ├── theme-package.md
    └── compatibility-harness.md
```

`tasks.md` belongs to the next phase. This command does not create it.

### Source Code (repository root)

These paths describe future implementation. This command creates no source code.

```text
TestApp/
├── app.json
├── workspace.json
├── build.xml
├── app/                         # Shared demo coverage.
├── resources/                   # Shared legacy CSS fixtures and fixed data.
└── packages/local/theme-classic-modern/
    ├── package.json
    ├── sass/var/
    ├── sass/src/
    ├── sass/etc/                # Keep when the generated pipeline requires it.
    └── resources/
tests/compatibility/
├── playwright.config.js
├── capture.spec.js
├── compare.mjs
├── report.mjs
└── cases.json
artifacts/compatibility/         # Generated evidence by run and theme.
package.json                    # Planned test dependency and scripts.
package-lock.json
```

**Structure Decision**: Use the existing workspace's local package directory.
Keep measurement code outside the package.
Preserve required Cmd-generated files, including slicing support if generated.
Do not add authored JavaScript overrides. Preserve inherited framework overrides.

### Phase 0: Research Results

See [research.md](research.md) for evidence and alternatives.
Use the metadata shape emitted by the installed Cmd theme generator.
The package has a root `name` field and a nested `sencha` configuration object.
The SDK `theme-classic` and `theme-neutral` packages use this same shape.
Keep the generated theme identity initializer. Do not add component override classes.
Keep Fashion. Start with inherited assets and unchanged palette variables.
Standard Cmd refresh and development and production builds pass without `.sencha` metadata.
Do not create replacement metadata unless a reproducible Cmd requirement exists.
The earlier Fashion failure log is missing. Its cause remains unknown.
See [build recovery evidence](evidence/build-recovery.md).
Production inputs remain an external dependency. Do not invent them.

### Phase 1: Design Results

See [data-model.md](data-model.md) for evidence entities and gate transitions.
See [theme-package.md](contracts/theme-package.md) for selection and rollback.
See [compatibility-harness.md](contracts/compatibility-harness.md) for commands and result rules.
See [quickstart.md](quickstart.md) for the future validation sequence.

Freeze shared fixtures before paired captures. Use fixed data and stable case identifiers.
Do not add test-only classes to framework elements.
Measure roots, layout-sensitive children, and visible pseudo-elements.
Check interaction outcomes, not only successful clicks.

Run two unchanged original captures first. Reject unstable measurement conditions.
Do not round measurements or introduce a geometry tolerance.
Compare the empty derived package against the immutable original baseline.
After G2 passes, change one paint group at a time in FR-026 order.
Record variable scope, geometry dependencies, approvals, tests, and rollback for each group.
Keep original references separate from approved modernized references.

Build development and production output with both themes before release acceptance.
Compare each mode within its own theme pair.
Run the full matrix for the development reference mode.
Repeat the full matrix for production output before G4. Include rollback in both modes.
Investigate mode-specific failures before acceptance.

### Layout Recalculation Checks

Compare original and replacement builds during the same recorded actions.
Record initial rendering separately from interaction measurements.
For Chromium, record `Performance.getMetrics` before and after state setup through the Chrome DevTools
Protocol. Store deltas for `LayoutCount` and `RecalcStyleCount`, plus duration values.
This reports page totals. It does not identify the component that caused a layout pass.
For Firefox, record `PerformanceObserver` layout-shift entries. These entries do not measure every
layout pass. Mark the observation as insufficient and block affected acceptance until a complete
method is available. Firefox privileged counters and its WebDriver BiDi profiler need further
validation before use in this capture suite. See [Firefox layout measurement investigation](evidence/firefox-layout-measurement.md).
Record each method, scope, and limitation with the environment evidence.

Repeat original measurements to establish stable conditions.
Investigate additional layout work in the replacement.
Unintended additional layout work MUST fail acceptance.
Equal final geometry alone does not satisfy this check.
Keep unexplained additional work blocked until its cause is resolved.

Do not add theme JavaScript overrides or alter application layout behavior to collect evidence.
If a required environment cannot provide sufficient evidence, record the limitation.
Block the affected acceptance decision. Do not infer a pass from final geometry.

## Complexity Tracking

No constitutional exceptions are proposed.
One browser test dependency covers the required checks.
Small Node.js helpers compare and report evidence. They do not replace Sencha Cmd builds.
Production inputs and original build recovery remain execution gates.
