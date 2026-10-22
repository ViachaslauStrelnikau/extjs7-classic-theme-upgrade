---
description: "Tasks for the replaceable Ext JS 7.7.0.31 Classic theme"
---

# Tasks: Drop-in Classic Theme Modernization

**Input**: Design documents in `specs/001-modernize-classic-theme/`.
**Authority**: Constitution 2.0.0, `spec.md`, `plan.md`, and both contracts.
**Target**: Ext JS 7.7.0.31 Classic Toolkit only.
**Status**: Partial implementation. The selectable theme package, demo fixtures, evidence checks, and browser capture runner exist. Demo-only paint refinements are in progress. Production compatibility remains incomplete.

SDK means software development kit. CSS means Cascading Style Sheets.
DOM means Document Object Model. DPR means device pixel ratio.
API means application programming interface. CLI means command-line interface.
JSON means JavaScript Object Notation. SVG means Scalable Vector Graphics.
MVP means minimum viable product. G0 through G4 identify the plan's acceptance gates.

## Format and Paths

Each task has a checkbox, sequential ID, description, and repository-relative file path.
`[P]` permits parallel work on separate files after the stated prerequisites pass.
`[US1]` through `[US4]` identify specification user stories.
Tests are required by FR-021 through FR-024.
Write the checks before the corresponding feature. Demonstrate that negative cases fail.
Do not treat absent prerequisites as a successful negative test.

Use `TestApp` as the existing demo. Do not create another application.
Use `tests/compatibility/` for the harness and `artifacts/compatibility/` for evidence.
Below, `<run>` identifies a safe run name. It is not a literal directory name.
All new documentation MUST use ASD-STE100 Simplified Technical English principles.

## Current blockers

- Production inputs are missing. G0 remains blocked for production acceptance. The owner approved demo-only paint work by exception. Record its limits in [approved exceptions](evidence/approved-exceptions.md).
- Playwright Test 1.64.1 and matching Chromium and Firefox binaries are installed. The capture runner completed all four browser/DPR projects at both configured viewports in the development build. See `artifacts/compatibility/viewport-matrix-20261021c/`.
- Firefox layout-shift records do not measure every layout pass. The comparator blocks affected acceptance.
- The earlier Fashion failure log is absent. Its cause is unknown.
- Firefox layout-work evidence is incomplete. T063 and T069 record the limit. Firefox geometry acceptance remains blocked.

## Phase 1: Setup

**Purpose**: Record the environment and prepare shared test infrastructure.

- [X] T001 Record SDK, Cmd, Java, Node.js, npm, operating system, fonts, source hashes, and current build configuration in `specs/001-modernize-classic-theme/evidence/environment.md`. Verify SDK `7.7.0.31` and installed Cmd `7.7.0.36`. Keep source facts separate from runtime results.
- [X] T002 Select one supported exact `@playwright/test` release in `package.json` and `package-lock.json`. Install its matching Chromium and Firefox binaries. Record exact versions and the patched Firefox coverage limitation in `specs/001-modernize-classic-theme/evidence/environment.md`. Add no other browser test framework. Do not use the global Playwright package as project evidence.
- [X] T003 Configure `tests/compatibility/playwright.config.js` with projects `chromium-dpr1`, `chromium-dpr2`, `firefox-dpr1`, and `firefox-dpr2`. Fix host fonts, browser mode, viewport `1280x900`, resize case `900x1280`, zoom `100%`, locale `en-US`, and time zone `UTC`. Disable automatic reference approval and retry-based acceptance.
- [X] T004 [P] Create `specs/001-modernize-classic-theme/evidence/production-inputs.md`. List missing actual production CSS, stylesheet order, active theme chain, component and state inventory, and browser requirements. Record the owner or source for each requested input. Do not invent inputs or mark G0 passed.

**Checkpoint**: Tool versions and missing production inputs are recorded.

## Phase 2: Foundation

**Purpose**: Restore the standard build and define shared evidence rules.
Complete this phase before story implementation. Missing production inputs do not block preparation.
They block baseline acceptance and all paint changes.

- [X] T005 Diagnose the missing `TestApp/.sencha/` metadata and the Fashion failure in `sencha-error-20261020.log`. Record root cause evidence and a supported recovery procedure in `specs/001-modernize-classic-theme/evidence/build-recovery.md`. Do not assume that `app refresh` restores missing metadata. **Evidence**: Standard Cmd install, refresh, and development and production builds passed without `.sencha` metadata. The historical Fashion root cause remains unknown because `sencha-error-20261020.log` is absent and the failure did not recur. The investigation is complete; the incident cause is unresolved. See [build recovery evidence](evidence/build-recovery.md).
- [X] T006 Confirm whether `TestApp/.sencha/` metadata is required. Run supported Cmd install, refresh, and build commands. Record that Cmd builds without `.sencha` and does not create metadata. Do not create metadata without a reproducible requirement.
- [X] T007 Build the original `ext-theme-classic` selection with standard Cmd refresh and development and production builds. Save full commands, exit codes, logs, output paths, and hashes in `artifacts/compatibility/preflight/` and `artifacts/compatibility/selection/revalidation-final/`. Confirm static-server syntax and actual output URLs in `specs/001-modernize-classic-theme/quickstart.md`.
- [X] T008 Define shared record validation in `tests/compatibility/evidence.mjs` from `data-model.md`. Include every listed field. Apply these rules verbatim: "Use stable string identifiers. Do not use generated element IDs as case identifiers." "Use ISO 8601 timestamps and SHA-256 file hashes." "Version records with `schemaVersion`."
- [X] T009 Add `ProductionInputSet` and `Environment` validation in `tests/compatibility/evidence.mjs`. Apply: "Status values: `missing`, `received`, `verified`, `rejected`." "Only `verified` can satisfy G0. Record missing browser requirements as a coverage dependency." "Changed input hashes invalidate dependent approval." "Require SDK `7.7.0.31`. Record actual DPR and screenshot pixel dimensions." "Pair only equivalent environments. Different browsers and build modes need separate references."
- [X] T010 Add `ThemeBuild` and `ComparisonCase` validation in `tests/compatibility/evidence.mjs`. Apply: "Theme roles: `original`, `derived`, `modernized`, `rollback`." "The derived baseline has no authored paint rules or replacement assets." "Require a successful exit and verified output identity before capture." "Shared fixture hashes must match within each pair." "Identify roots and layout-sensitive children through stable case mappings." "Do not add theme-specific application configurations." "Map every required component family and applicable state to cases." "Production inputs add cases without removing required demo coverage."
- [X] T011 Add `Capture` validation in `tests/compatibility/evidence.mjs`. Apply: "Geometry includes unrounded bounding rectangles and client, offset, and scroll dimensions." "Styles include protected values, paint values, and applicable `::before` and `::after` values." "DOM records retain hierarchy and standard classes. Normalize only generated instance identity." "Record stylesheet URLs, hashes, and inline order." "Record expected and actual interaction outcomes, missing assets, and page errors."
- [X] T012 Add `ChangeGroup` validation in `tests/compatibility/evidence.mjs`. Apply: "Status sequence: `proposed` → `approved` → `implemented` → `validated` → `accepted`." "A failure moves the group to `rejected`. Preserve failed evidence." "Do not implement paint before G2. Do not start the next group before acceptance." "Approval identifies reviewer, scope, and date. Goal approval does not approve failing tests."
- [X] T013 Add `ComparisonResult` and `GateRecord` validation in `tests/compatibility/evidence.mjs`. Apply: "Category status values: `pass`, `fail`, `blocked`, `not-run`." "Unsupported required coverage is blocked or failed coverage. It is never a pass." "Paint changes require a matching approved goal." "Geometry and CSS exceptions require prior scoped approval. Behavior differences cannot pass." "Allowed paint differences do not suppress protected-property failures." "Gate status values: `not-run`, `blocked`, `failed`, `passed`." "Changed dependencies invalidate later approvals until affected checks pass again."
- [X] T014 Test record rejection, hash changes, evidence relationships, and G0 through G4 prerequisites in `tests/compatibility/evidence.test.mjs`. Reject mismatched cases, environments, builds, missing fields, invalid states, and stale approval. Run these harness checks with Node.js. Do not allow a copied pass summary to replace linked evidence.

**Checkpoint**: Original builds work. Evidence validation rejects invalid records.
G1 still needs stable original captures. G0 can remain blocked.

## Phase 3: US1 — Select and Restore the Theme (P1)

**Goal**: Deliver a selectable empty package and restore the original through standard operations.
**Independent test**: Build original, replacement, and original again in each build mode.
Verify unchanged application and legacy CSS hashes. The package has no demo dependency.
This story proves selection. It does not accept the visual baseline.

### Tests

- [X] T015 [P] [US1] Add package contract checks in `tests/compatibility/package-contract.test.mjs`. Require the metadata shape emitted by the installed Cmd theme generator, toolkit `classic`, type `theme`, Sass namespace `Ext`, the recorded demo parent candidate, no component override classes, no runtime overlay, and no demo or harness dependencies. Allow only the generated `overrides/init.js` theme identity marker. Require production parent verification before baseline acceptance. Test invalid package metadata before package creation.
- [X] T016 [P] [US1] Define original/replacement/rollback build and source-hash checks in `tests/compatibility/selection.test.mjs`. Permit only the standard `theme` configuration change between builds. Preserve `xtype`, `ui`, `cls`, `bodyCls`, event handlers, and existing CSS. Reject failed builds and stale output.

### Implementation and Verification

- [X] T017 [US1] Generate `TestApp/packages/local/theme-classic-modern/package.json` and required support files with installed Cmd. Use `theme-classic` only as the documented demo parent candidate until production inheritance is verified. Keep `sass/var/`, `sass/src/`, and `resources/` free of paint changes and replacement assets. Retain required `sass/etc/` and slicing support.
- [X] T018 [US1] Select `theme-classic-modern` through `TestApp/app.json`. Verify discovery through existing `TestApp/workspace.json` package paths. Build development and production output with standard Cmd commands. Record selected package, chain, logs, and hashes in `artifacts/compatibility/selection/revalidation-final/`. Preserve inherited framework overrides.
- [X] T019 [US1] Restore `ext-theme-classic` in `TestApp/app.json` and rebuild both modes. Run T015 and T016 checks. Save selection and rollback results in `artifacts/compatibility/selection/revalidation-final/results.json`. Require unchanged application source and legacy CSS hashes without manual patches.
- [X] T020 [US1] Write initial installation and rollback instructions in `TestApp/packages/local/theme-classic-modern/README.md`. Describe SDK scope, parent verification, standard configuration, refresh, rebuild, and package-only delivery. State that baseline and production compatibility remain unproved.

**Checkpoint**: US1 selection tests pass. No paint change is permitted.

## Phase 4: US2 — Prove the Initial Replacement Matches (P1)

**Goal**: Record stable originals and prove exact compatibility of the empty derived package.
**Independent test**: Run original, original-repeat, derived, and rollback captures.
Require equivalent images, geometry, computed styles, selector effects, and behavior.
Require verified production inputs before accepting G2.

### Tests

- [X] T021 [P] [US2] Add CLI contract tests in `tests/compatibility/cli-contract.test.mjs` for required `COMPAT_RUN`, `COMPAT_THEME`, `COMPAT_PHASE`, `COMPAT_BUILD_MODE`, and `COMPAT_BASE_URL` values. Reject path separators, traversal, invalid roles, query-based theme switching, duplicate captures, missing manifests, and cross-environment or cross-mode pairing. Confirm `original-repeat` maps to the original package.
- [X] T022 [P] [US2] Add comparator negative cases in `tests/compatibility/compare.test.mjs`. Reject any geometry change, protected computed-style change, unclassified property change, DOM or state-class change, interaction failure, unstable original, missing coverage, or unexplained initial image difference. Test all four result categories separately and preserve failures across reruns.

### Shared Demo and Evidence

- [X] T023 [P] [US2] Add shared buttons, split buttons, toolbars, collapsible panels, and tabs in `TestApp/app/view/compatibility/Controls.js`. Include fixed data, title and icon alignment cases, long text, applicable states, keyboard actions, and outcome targets. Use identical configurations with both themes.
- [X] T024 [P] [US2] Add deterministic grids and trees in `TestApp/app/view/compatibility/DataViews.js`. Cover selection, editing, edit validation, sorting, horizontal and vertical scrolling, tree expansion, collapse, and keyboard navigation. Preserve existing personnel-grid behavior.
- [X] T025 [P] [US2] Add fields, combo boxes, checkboxes, radio buttons, menus, submenus, windows, dialogs, tooltips, and scrollable containers in `TestApp/app/view/compatibility/FormsAndFloats.js`. Include invalid, read-only, disabled, edge-position, clipping, stacking, drag, resize, and focus cases where applicable.
- [X] T026 [US2] Connect shared coverage to the existing demo through `TestApp/app/view/main/Main.js`. Preserve current navigation and handlers. Add representative legacy fixtures in `TestApp/resources/css/compatibility-legacy.css` and load them through standard `TestApp/app.json` configuration. Cover standard `.x-*`, nested, state, competing-specificity, and pseudo-element selectors. Do not add replacement-only patches or test-only framework classes.
- [X] T027 [US2] Define stable cases, fixed data hashes, component targets, applicable states, action sequences, expected outcomes, legacy declarations, and protected properties in `tests/compatibility/cases.mjs`. The writer creates `cases.json` for each run. Map all ten specification component families. Add production cases only after a production inventory is verified.
- [X] T028 [US2] Implement readiness and capture in `tests/compatibility/capture.spec.js`. Start a fresh browser context for each capture. Verify successful build identity, loaded manifest, theme, CSS hashes, source hashes, actual DPR, and PNG dimensions. Wait for framework, fonts, images, required states, and consecutive stable frames. Capture exact roots and sensitive children without arbitrary readiness sleeps, test CSS injection, rounding, or layout patches. Verify and implement the layout observation method defined in `plan.md` for each required browser. Store original and replacement observations, repeated-original stability, method, scope, and limitations in `diagnostics.json`. Keep initial rendering separate from interaction measurements. Use identical conditions within each pair. Block affected acceptance when sufficient observations are unavailable. **Evidence**: The T086 development run captured 336 records each for Original, Original-repeat, Modernized, and Rollback. Each role passed 40/40 Playwright checks. Screenshot text anchors passed on the first attempt. The harness waits for navigation tabs and visible component geometry and text, and records PNG paint readiness. Chromium layout counters differ in two Original-repeat captures, one Modernized capture, and two Rollback captures. Firefox layout observations remain insufficient in 168 captures per comparison. Keep G1/G2 blocked. See [T028 capture evidence](evidence/t028-capture-readiness.md) and `../../artifacts/compatibility/t086-painted-readiness-20261021/development/raw-pair-comparison.json`.
- [X] T029 [US2] Complete capture records in `tests/compatibility/capture.spec.js` for full computed styles, visible pseudo-elements, DOM hierarchy and standard classes, ordered external and inline stylesheets, effective legacy declarations, interaction outcomes, missing assets, page errors, screenshots, and failure traces. Normalize only generated instance IDs and record the rules. **Evidence**: The T042 development run records 336 captures per role. Records include six field files and a full versioned record. The CSS and interaction suites check actions and provide linked outcomes in `suite-results.json`.
- [X] T030 [US2] Implement `tests/compatibility/compare.mjs` against the harness contract. Require all baseline roles and stable original-repeat results. Compare unrounded geometry with zero tolerance, protected styles, DOM, cascade effects, behavior, and screenshots within equivalent environments. Separate identity and URL changes from semantic failures. Reject unresolved additional layout work and missing required layout evidence. Report layout observations separately from final geometry equality. Reject missing suite results required by the current story stage. Use nonzero exit for fail, blocked, invalid, or incomplete evidence. Unit tests cover these rules. A current preflight exits with a blocked status because capture evidence is absent.
- [X] T031 [US2] Implement `tests/compatibility/report.mjs` with linked raw evidence, separate visual/geometry/CSS/behavior results, limitations, and G0 through G4 dependencies. Write `report.html`, `results.json`, and diagnostic reports under `artifacts/compatibility/<run>/`. Preserve failing status during report generation.
- [X] T032 [US2] Add `compat:capture`, `compat:compare`, and `compat:report` scripts in `package.json`. Enforce contract inputs and immutable paths in `tests/compatibility/evidence.mjs`. Use `artifacts/compatibility/<run>/<build-mode>/<role>/<project-viewport>/<case>/<state>/`. Keep helpers independent of Cmd builds and application theme configuration. Run T014, T021, and T022 negative checks. All required checks passed.
- [ ] T033 [US2] Obtain and verify actual production inputs in `artifacts/compatibility/<run>/production-inputs.json`. Map source hashes, CSS order, parent chain, components, states, and browser requirements to cases. Record reviewer evidence in `specs/001-modernize-classic-theme/evidence/production-inputs.md`. Compare production browser requirements with the configured matrix. Add each required browser environment to `tests/compatibility/playwright.config.js`. Record exact versions and supported DPR settings. Install required browser binaries through the selected test tool. If the tool cannot test a required browser, record blocked coverage and resolve the test approach before acceptance. If production inputs are absent, record G0 as blocked and leave this task incomplete. Do not accept a baseline or start paint work.
  **Current status**: The project owner directed work to focus on `TestApp` on 2026-10-21. No production files or inventory were supplied. Keep G0 blocked and T033 incomplete. See [production input record](evidence/production-inputs.md).
- [ ] T034 [US2] Reconcile verified production and demo inheritance in `TestApp/packages/local/theme-classic-modern/package.json`. Finalize `extend` only when the supported application chain is resolved. If chains differ, record the scope decision in `specs/001-modernize-classic-theme/evidence/production-inputs.md`. Do not silently reparent the demo or claim support for incompatible chains. Rebuild and repeat affected US1 checks after changes.
- [ ] T035 [US2] Freeze shared fixtures and run two unchanged original captures in all four required projects, all additional production-required environments, and both viewport cases for development and production builds. Save source manifests, logs, raw captures, and G1 evidence in `artifacts/compatibility/<run>/`. Use separate references by mode and environment. Resolve unstable originals before derived comparison. Do not accept G2 while required environment coverage is missing.
  **Partial evidence**: Capture readiness now waits for the Ext JS animation queue to drain. The development original and repeat runs passed 40/40 Playwright tests each. Chromium collapsed-panel layout counts remain unstable: 18/19, 19/20, 20/20, and 19/17. Firefox layout counts remain unavailable. Production was not run as authorized. Keep G1 and G2 blocked. See [stability experiment](../../artifacts/compatibility/t035-layout-stability-retry-20261021/stability-experiment.json).
  **Measurement-boundary experiment**: Captures now wait for three stable frames after initial case rendering and before the target state action. Original and original-repeat each passed 40/40 Playwright tests and produced 336 records. Their geometry, computed-style values, DOM, and screenshots match across all records. Original/repeat collapsed-panel Chromium layout counts are `20/16`, `20/20`, `20/18`, and `14/17`. Layout and style-recalculation counts still differ at three of four viewports. Firefox still has no complete layout counter. Production captures remain skipped under the approved demo-only scope. Keep T035 and G1 blocked. See `artifacts/compatibility/t035-boundary-repeat-20261021/repeat-stability-summary.json`.
- [ ] T036 [US2] Build and capture the empty derived theme, then restore and capture the original in both modes using standard operations. Run comparisons and reports in `artifacts/compatibility/<run>/`. Require complete appearance, geometry, computed-style, selector, and behavior equality. Investigate every difference without changing shared fixtures between paired captures.
- [ ] T037 [US2] Review linked evidence and record G0, G1, and G2 decisions in `artifacts/compatibility/<run>/gates.json`. Accept G2 only with verified production inputs and complete matching derived and rollback results. Keep the task incomplete on any blocked, failed, unsupported required, or unexplained case. Archive immutable original references for later groups.

**Checkpoint**: G2 passes with evidence. Provisional demo success alone cannot pass this checkpoint.

## Phase 5: US3 — Keep Existing Styles and Interactions (P1)

**Goal**: Protect application CSS and component behavior under realistic boundary conditions.
**Independent test**: Run explicit cascade and interaction assertions with both themes.
Require equal effective legacy declarations, geometry, DOM contracts, and outcomes.

### Tests

- [X] T038 [P] [US3] Add CSS compatibility assertions in `tests/compatibility/css-contract.spec.js`. Verify standard, nested, hover, selected, focused, disabled, invalid, and pseudo-element selectors where applicable. Test competing specificity and external and inline stylesheet order. Compare actual effective values and retain existing navigation Sass fixtures.
- [X] T039 [P] [US3] Add interaction assertions in `tests/compatibility/interactions.spec.js` for every coverage-table action. Verify outcomes after clicks, toggles, input, validation, combo selection, grid edit/sort/select/scroll, tree and tab keyboard navigation, menus, collapse/expand, window drag/resize, dialogs, and focus traversal. Include viewport resize and edge-positioned floats.

### Integration and Verification

- [ ] T040 [US3] Extend `tests/compatibility/cases.json` with CSS precedence conflicts, custom existing `ui`, `cls`, and `bodyCls`, long text, many grid rows and columns, invalid and read-only fields, container edges, and resized layouts. Apply the same cases to both themes. Map verified production-specific selectors and interactions without removing required demo cases. **Partial**: Demo fixtures cover configured classes, long text, 64 rows and six columns, invalid and read-only fields, viewport edges, and resize. Production-specific mapping remains blocked until verified inputs exist.
- [X] T041 [US3] Connect T038 and T039 to `tests/compatibility/playwright.config.js` and the capture/report workflow. Verify that `npm run compat:capture` discovers `capture.spec.js`, `css-contract.spec.js`, and `interactions.spec.js`. Store suite identities, completion status, actual outcomes, and evidence paths through `tests/compatibility/evidence.mjs`. Add a negative check for each missing suite. Reject incomplete evidence before US3 acceptance or change-group acceptance. Fail on altered state transitions, classes, hierarchy, public behavior, clipping, scroll dimensions, or effective legacy declarations. **Evidence**: The T042 development run records all four roles. Capture passed 16/16 cases, CSS passed 80/80 assertions, and interactions passed 64/64 checks. Suite discovery and missing-suite rejection also pass. Geometry, G1, and G2 remain blocked by unstable collapse observations and incomplete Firefox layout evidence. Production remains unverified.
- [ ] T042 [US3] Run the full original/derived/rollback matrix for development and production with the completed cases. Record results in `artifacts/compatibility/<run>/`. If fixture or input hashes changed, invalidate affected approvals, recapture originals, and repeat G1 and G2. Require all interaction and CSS assertions to pass before US4. **Partial**: Development captures completed for original, original-repeat, derived, and rollback (40/40 Playwright tests per role). All 672 CSS, behavior, and screenshot comparisons pass. Geometry remains blocked by incomplete layout observations. Three original-repeat collapsed-panel cases have different layout counts, so G1 is not-run and G2 remains blocked. Production was skipped as authorized; G0 remains blocked because production inputs are missing.

**Checkpoint**: Full CSS and interaction coverage passes. G2 remains valid for current inputs.

## Phase 6: US4 — Review and Accept Visual Improvements (P2)

**Goal**: Improve paint in isolated, approved groups without breaking the established contracts.
**Independent test**: Review one group's before/after images and all relevant regression results.
Accept the group before starting the next group. G2 and US3 are mandatory prerequisites.

### Tests and Review Controls

- [X] T043 [P] [US4] Extend `tests/compatibility/compare.test.mjs` with modernization cases. Reject missing goal approval, stale baseline hashes, out-of-order groups, an unaccepted previous group, unapproved paint properties, failed rollback, and any protected-property or behavior difference despite visual approval. The added checks pass.
- [X] T044 [US4] Implement approved-group comparison in `tests/compatibility/compare.mjs` and `tests/compatibility/report.mjs`. Require immutable original references, matching `approvals.json`, modernized and rollback captures, per-case goals, and separate approved modernized references. Keep original, actual, and difference images. Do not auto-approve screenshots or erase prior failures. Comparison results and difference images now appear in the report. The compatibility suite passes.
- [X] T045 [US4] Record approved goals for required surface families in `artifacts/compatibility/theme-modern-demo-20261021/approvals.json`. Include components, variables and generated-rule impact, palette and semantic-color constraints, risk, tests, rollback, reviewer, scope, and date. The project owner approved the demo-only goal in this conversation. This does not approve production use or screenshots.

### Ordered Paint Groups

- [X] T046 [US4] Reduce gloss in button, panel header, grid header, tab, and tab bar surfaces with verified Sass variables. Use muted blue-gray fills for normal, hover, active, pressed, and disabled states. Preserve color roles, geometry, and state behavior. Limit changes to `background-image` and `background-color`. **Evidence**: The approved five-file Sass variable group builds in development. T086 CSS and behavior comparisons pass in 336/336 captures, with no direct component-geometry differences. Same-run Original-repeat and Rollback captures match Classic pixel-for-pixel. Layout observations and modernized screenshot review remain blocked, so T047 and G3 are incomplete. See [T046 demo evidence](evidence/t046-demo-change.md).
- [ ] T047 [US4] Validate T046 with both build modes, the full browser/DPR matrix, all affected states, clipping checks, computed styles, interactions, and standard rollback. Save evidence and G3 acceptance in `artifacts/compatibility/<run>/gates.json`. Resolve all failures before accepting or starting T048.
  **Partial evidence**: `app refresh` and `app build production` passed on 2026-10-21 with `theme-classic-modern` selected. The production output uses the selected theme and includes the approved Sass colors. Missing navigation image warnings remain. Browser captures, visual review, rollback, and G3 acceptance remain open. See `artifacts/compatibility/implement-build-20261021/production-build.log`.
  **Classic reference comparison**: The corrected development build passed 40/40 Playwright checks and captured 336 states. Fixtures match the original `ext-theme-classic` run. Geometry, DOM, normalized interactions, and legacy CSS match in every pair. Computed-style changes are limited to `background-color` and `background-image`. All 336 screenshot pairs differ. No reviewer-approved modernized reference or rollback capture exists. Two Chromium collapsed-panel captures have layout-count differences. Firefox layout work remains blocked in 168 captures. Production capture was skipped under the approved demo-only scope. Keep T047 and G3 open. See [comparison summary](../../artifacts/compatibility/t046-final-preserve-20261021/development/original-vs-modernized-summary.json) and [capture log](../../artifacts/compatibility/t046-final-preserve-20261021/development/modernized-capture.log).
- [ ] T048 [US4] Refine approved background colors, border colors, and separators in class-mapped files under `TestApp/packages/local/theme-classic-modern/sass/var/`. Preserve border widths, base palette identity, semantic colors, and geometry variables. Record the exact file and variable changes in `artifacts/compatibility/<run>/approvals.json` before edits.
- [ ] T049 [US4] Validate T048 through the same regression, visual review, and rollback process as T047. Save separate group evidence in `artifacts/compatibility/<run>/`. Require G3 acceptance before T050.
- [ ] T050 [US4] Improve approved hover, focus, and selection paint in class-mapped files under `TestApp/packages/local/theme-classic-modern/sass/var/`. Review normal, pressed, disabled, read-only, and invalid states for consistency. Preserve state classes, behavior, visible focus, and protected font metrics. Record exact scope in `artifacts/compatibility/<run>/approvals.json`.
- [ ] T051 [US4] Validate T050 with all applicable states, keyboard focus, legacy state selectors, full regression checks, and rollback. Save group evidence and acceptance in `artifacts/compatibility/<run>/gates.json`. Require acceptance before T052.
- [ ] T052 [US4] Evaluate subtle shadows and focus outlines in `specs/001-modernize-classic-theme/evidence/visual-decisions.md`. Implement only approved safe candidates under `TestApp/packages/local/theme-classic-modern/sass/src/`. Test border radius only with separate scoped approval. Record clipping, overlap, stacking, focus visibility, and zero geometry effects. Reject unsafe effects instead of compensating with layout changes.
- [ ] T053 [US4] Validate every adopted T052 effect with full regression and rollback evidence in `artifacts/compatibility/<run>/`. Record accepted changes or an evidence-based decision to omit optional effects. Require completion before asset work.
- [ ] T054 [US4] Evaluate individual icon replacements in `specs/001-modernize-classic-theme/evidence/visual-decisions.md`. Adopt only approved assets under `TestApp/packages/local/theme-classic-modern/resources/`. Record original and replacement intrinsic dimensions, rendered CSS dimensions, paths, sprite regions, background positions, alignment, and clipping. Preserve the global icon technology and required paths.
- [ ] T055 [US4] Validate each adopted T054 icon separately at DPR 1 and 2 in Chromium and Firefox. Verify network loading, rendered dimensions, sprite behavior, full regression, and rollback in `artifacts/compatibility/<run>/`. Accept each asset before starting the next. Record a reason if no safe replacement is adopted.
- [ ] T056 [US4] Evaluate incremental higher-resolution raster or SVG assets after icon-group acceptance. Record approval or rejection in `specs/001-modernize-classic-theme/evidence/visual-decisions.md`. Place adopted files in `TestApp/packages/local/theme-classic-modern/resources/`. Preserve rendered dimensions, required paths, background positions, and existing icon technology. Do not change DPR or zoom through CSS.
- [ ] T057 [US4] Validate each adopted T056 asset with intrinsic/rendered dimension checks, DPR coverage, network, alignment, sprite, clipping, regression, and rollback evidence in `artifacts/compatibility/<run>/`. Accept each change separately. Record omitted candidates and reasons. Do not add other visual techniques without a new scoped review and task.

**Checkpoint**: Required visual goals pass review. Every adopted group has accepted G3 evidence.

## Phase 7: Documentation and Release Review

**Purpose**: Complete delivery evidence across all stories.

- [X] T058 [P] Update `TestApp/packages/local/theme-classic-modern/README.md` with tested installation, exact SDK scope, inheritance prerequisites, standard selection, build, and rollback commands. Confirm package contents exclude demo, harness, evidence, production inputs, and SDK files. Do not require application source or CSS patches.
- [X] T059 [P] Update `specs/001-modernize-classic-theme/quickstart.md` with verified recovery prerequisites, dependency versions, static serving, evidence commands, both build modes, approvals, and blocked-gate behavior. Preserve exact identifiers and commands. Review all generated documentation for short active sentences and consistent technical terms. Do not claim formal ASD-STE100 certification. (complete)
- [ ] T060 Run the delivered quickstart from its documented prerequisites using the existing `TestApp`. Build original and final replacement, capture the full matrix, and restore the original in development and production. Save final immutable evidence in `artifacts/compatibility/<run>/`. Require unchanged component and legacy CSS hashes during selection and rollback.
- [ ] T061 Generate `artifacts/compatibility/<run>/compatibility-report.md` with AC-001 through AC-014 and SC-001 through SC-008 evidence links. Include approved paint differences, actual environment coverage, all failed attempts, resolutions, known risks, unsupported cases, and unverified production assumptions. Distinguish demo results from actual production validation.
- [ ] T062 Review package independence, all accepted groups, exact geometry, CSS contracts, behavior, actual production coverage, successful standard builds, and rollback evidence. Record G4 in `artifacts/compatibility/<run>/gates.json`. Keep release and production adoption blocked when required evidence is absent. Record reviewer identity and decision without inventing approval.

## Dependencies and Execution Order

```text
Setup T001–T004
  -> Foundation T005–T014
  -> US1 T015–T020
  -> US2 preparation T021–T032
  -> G0 production inputs T033 and parent resolution T034
  -> G1 original stability T035
  -> G2 derived equivalence T036–T037
  -> US3 full contract validation T038–T042
  -> US4 approved sequential groups T043–T057
  -> Final review T058–T062
```

Production input collection can start during setup. T033 remains incomplete until verification.
T034 through baseline acceptance depend on T033. Do not bypass this external dependency.
US1 does not require a passed visual baseline. Its parent remains provisional until T034.
US2 requires a selectable empty package from US1.
US3 uses the US2 harness and fixtures. It adds explicit contract assertions.
Changed fixtures or production inputs invalidate affected baseline approvals.
US4 requires a current passed G2 and completed US3 checks.
All builds and captures use one workspace. Run them sequentially without a watcher.

## Parallel Opportunities

Parallel work is limited to separate files after each phase's prerequisites pass.
Do not run paired builds, theme selection changes, or shared evidence writes concurrently.
The `[P]` tasks are T004, T015, T016, T021–T025, T038, T039, T043, T058, and T059.
There are 13 marked tasks. Run T004 alongside T002–T003 after T001.
T043 can run beside preparation of the approval record. Paint edits still require approval.

### US1 Example

After foundation, write T015 package contract tests and T016 selection tests in parallel.
Then create and build the package sequentially with T017–T019.

### US2 Example

After US1, write T021 CLI tests and T022 comparator tests in parallel.
Create T023 controls, T024 data views, and T025 forms/floats in separate files.
Integrate them only after those tasks finish. Run captures sequentially.

### US3 Example

After US2, write T038 CSS assertions and T039 interaction assertions in parallel.
T040–T042 then update shared case mappings and run validation sequentially.

### US4 Example

After US3, prepare T043 negative tests while the reviewer prepares T045 goal approval.
Do not start T046 until T043–T045 finish. Keep paint groups and their validation sequential.

## Requirement Coverage

| Requirements | Main tasks |
| --- | --- |
| FR-001–FR-005: package, selection, rollback | T015–T020, T034, T058, T060 |
| FR-006–FR-008: evidence and initial baseline | T001, T005–T014, T033–T037 |
| FR-009–FR-013: geometry and CSS contracts | T022, T026–T030, T038–T042 |
| FR-014–FR-018: paint, states, assets, metrics | T043–T057 |
| FR-019–FR-020: existing demo and coverage | T023–T027, T040 |
| FR-021–FR-025: automated comparisons and results | T003, T021–T022, T028–T032, T035–T042 |
| FR-026: ordered change groups | T012–T014, T043–T057 |
| FR-027–FR-028: documentation and evidence | T020, T031, T058–T061 |
| FR-029: architecture limits | T005–T006, T015–T020, T043–T057 |
| FR-030: actual production validation | T004, T033–T034, T040–T042, T061–T062 |

## Implementation Strategy

### Minimum Viable Product

Complete setup, foundation, and US1 first.
Demonstrate standard package selection and rollback without paint changes.
This is an integration milestone. It is not the completed modernization feature.

### Incremental Delivery

1. Complete the empty selectable package.
2. Complete the harness and shared demo coverage.
3. Verify production inputs and resolve inheritance.
4. Prove the unchanged derived baseline in both build modes.
5. Complete CSS and interaction boundary checks.
6. Approve, implement, validate, and accept one paint group at a time.
7. Reproduce the final workflow and review the complete release evidence.

Stop dependent work at a failed or blocked acceptance gate.
Keep preparatory work separate from acceptance claims.
Do not mark a task complete until its stated evidence exists.

## Phase 8: Convergence

- [X] T063 [HIGH] Complete a sufficient Firefox layout-work measurement in `tests/compatibility/capture.spec.js`. Investigate a method that measures layout and style recalculation beyond visible layout shifts. Validate it on the recorded actions and pair it with the same method for the original and candidate. If no sufficient supported method exists, record the limitation and keep affected acceptance blocked. Do not mark SC-006 or the baseline as passed without adequate evidence. **Evidence**: No complete count method is supported by the current capture workflow. Firefox Profiler uses periodic samples and selected markers. Playwright CDP sessions support Chromium only. Firefox geometry acceptance remains blocked. See [Firefox layout measurement investigation](evidence/firefox-layout-measurement.md).
- [X] T064 [MEDIUM] Review `TestApp/packages/local/theme-classic` and determine why it declares `theme-classic` with `extend: theme-neptune`. Verify current Sencha Cmd package resolution. Remove or justify this unrequested package without changing the verified `theme-classic` → `theme-neutral` → `theme-base` chain. Record the resolution and build evidence. Per FR-003 and plan: Project Structure (complete; see [package resolution evidence](evidence/package-resolution.md)).
- [X] T065 [MEDIUM] Reconcile the `.sencha` metadata note in `specs/001-modernize-classic-theme/plan.md` with T006 evidence. Record that standard builds pass without this metadata and do not create it unless a reproducible Cmd requirement exists. Per T006 and plan: Project Structure (complete; see [build recovery evidence](evidence/build-recovery.md)).
## Phase 9: Convergence

- [ ] T066 [CRITICAL] Obtain and verify the production input set for G0. Record source hashes, stylesheet order, theme inheritance, component and state coverage, browser requirements, and reviewer evidence per FR-006 and FR-030 (partial).
- [ ] T067 [CRITICAL] Complete stable original captures and derived and rollback comparisons in every required environment and build mode. Resolve baseline differences and record G1 and G2 decisions per FR-007–FR-008, SC-002, and US2/AC1–AC2 (partial).
- [X] T068 [CRITICAL] Add runtime CSS compatibility and interaction assertions for all required selectors, states, and actions. Integrate them into capture and reject missing suite evidence per FR-013, FR-020–FR-025, and US3/AC1–AC3 (missing).
- [X] T069 [HIGH] Validate a complete Firefox layout and style recalculation method against recorded actions, or record unsupported coverage and keep acceptance blocked per FR-021, FR-024, and SC-006. **Evidence**: Unsupported coverage is recorded, and T042 marks Firefox geometry comparisons blocked. See [Firefox layout measurement investigation](evidence/firefox-layout-measurement.md).
- [ ] T070 [HIGH] After G2 and US3 pass, obtain reviewer approval and implement and validate each required visual change group in order, with regression and rollback evidence per FR-014–FR-018, FR-026, and US4/AC1–AC3 (missing).
- [ ] T071 [HIGH] Run the documented final workflow, generate the report with AC-001 through AC-014 and SC-001 through SC-008 evidence, and record the G4 review per FR-027, SC-008, and AC-014 (missing).

## Phase 10: Convergence

- [X] T072 [HIGH] Connect compareModernizationRun to the compat:compare workflow. Include each change group, case result, rollback result, and difference image in tests/compatibility/report.mjs. Remove the stale claim that the theme has no visual changes. Preserve blocked and failed results. Per T044, FR-022–FR-027, and SC-008 (partial).
- [ ] T073 [HIGH] Define and approve paint goals for form controls, menus, and floating components. Add approved paint-only Sass variables under TestApp/packages/local/theme-classic-modern/sass/var/. Map each family to its applicable states. Validate each group in order and record omitted changes with a reason. Keep demo-only scope and blocked acceptance statuses where required evidence is incomplete. Per FR-014–FR-016, FR-020, FR-026, SC-004, and US4/AC1–AC3 (missing).

## Phase 11: Convergence

- [X] T074 [CRITICAL] Resolve the G2 sequencing conflict for active overrides in TestApp/packages/local/theme-classic-modern/sass/var/. Record an explicit approved demo-only G2 exception with reviewer, scope, and date, or restore the empty derived theme until G2 passes. Recapture and validate retained changes per Constitution III, plan G2, and T046–T047 (contradicts). **Evidence**: The project owner approved the demo-only exception on 2026-10-21. It permits T046 paint work in `TestApp` only and keeps Classic as the geometry and behavior reference. The T086 Modernized comparison passed CSS and behavior in 336/336 captures and found no component-geometry differences. Layout-counter differences, unstable original-repeat evidence, and unreviewed screenshots keep G2 and G3 acceptance blocked. See [approved exception](evidence/approved-exceptions.md) and [fresh comparison](../../artifacts/compatibility/t074-demo-exception-recapture-20261021b/development/modernized-vs-original-recapture.json).

## Phase 12: Convergence

- [ ] T075 [CRITICAL] Complete and verify the G0 production inputs: source hashes, stylesheet order, active theme chain, component and state inventory, browser requirements, and reviewer evidence. Keep baseline acceptance blocked until verification. Reconcile T033 and T066 per FR-006, FR-030, and US2/AC4 (partial).
- [ ] T076 [CRITICAL] Complete stable original captures and derived and rollback comparisons. Resolve unstable layout measurements or record unavailable evidence and keep G1/G2 blocked. Reconcile T035–T037 and T067 per FR-007–FR-008, SC-002, and US2/AC1–AC2 (partial).
  **Owner direction and current evidence**: Use the original `ext-theme-classic` selection (package `theme-classic`) as the immutable reference for measurements and behavior. Pair every candidate capture with that reference under the same build mode, browser, DPR, viewport, fixtures, and actions. In `artifacts/compatibility/t042-development-20261021/results.json`, CSS, behavior, and visual status pass for 672 comparison records with zero unexpected differences. Geometry remains blocked for all records because the baseline gate is incomplete. Three original-repeat collapsed-panel cases have unstable Chromium layout counts. Firefox does not provide a verified complete layout-work count. Keep G1 and G2 blocked until the capture evidence is complete; do not replace original measurements with candidate measurements.
  **Current theme comparison**: The final development run compared 336 captures with matching fixtures. Component geometry, DOM, interactions, legacy CSS, and all computed-style properties outside the requested backgrounds match the Classic reference. Two collapsed-panel layout observations differ. The original and repeated Classic counts also vary, so these results do not establish a theme-caused layout change. Firefox layout work is unavailable in 168 captures. Keep G1 and G2 blocked. See [current comparison summary](../../artifacts/compatibility/t046-final-preserve-20261021/development/original-vs-modernized-summary.json).
- [X] T077 [CRITICAL] Resolve active theme overrides while G2 is blocked. Record an explicit demo-only G2 exception with reviewer, scope, and date, or restore the empty derived theme. Recapture and validate retained overrides. Complete T074 per Constitution III, plan G2, FR-008, and T046–T047 (contradicts). **Evidence**: T074 is complete. The project owner approved the demo-only exception on 2026-10-21 and recorded it as `approved-g2-sequencing-exception-20261021`. The fresh modernized capture passed 40/40 checks and matched Classic component geometry, CSS contracts, and behavior in 336 pairs. Three layout-counter comparisons differed, Firefox layout-work evidence remained blocked, and no reviewer-approved screenshots exist. G2 and G3 remain blocked.
  **T086 update**: The same-run rollback matches Original pixel-for-pixel in all 336 captures. CSS and behavior pass for all three comparisons. Modernized screenshots differ in all 336 captures and still lack reviewer-approved references. Layout evidence remains incomplete. The exception stays limited to the demo.
- [ ] T078 [HIGH] Complete production-specific component and selector mapping and the full comparison matrix. Keep unsupported production coverage blocked. Reconcile T040 and T042 per FR-013, FR-020–FR-025, and SC-003, SC-005–SC-006 (partial).
- [ ] T079 [HIGH] Complete the remaining visual groups in order. Approve each goal and validate geometry, styles, behavior, and rollback before starting the next group. Reconcile T046–T057, T070, and T073 per FR-014–FR-026 and SC-004 (partial).
- [ ] T080 [HIGH] Run the documented final workflow in both build modes. Generate the report with linked evidence for AC-001 through AC-014 and SC-001 through SC-008. Record the release review and all blocked limits. Reconcile T060–T062 and T071 per FR-027, SC-008, and AC-014 (partial).
- [X] T081 [MEDIUM] Close the build-recovery finding by documenting that the missing historical Fashion log prevents a root-cause finding. Record the supported recovery evidence and its limits without inventing a cause. Reconcile T005 per plan Phase 0 and Constitution IV (partial).

## Phase 13: Convergence

- [X] T082 [MEDIUM] Audit the 20 missing tab-navigation image warnings in `artifacts/compatibility/implement-build-20261021/production-build.log`. Compare each path with the original Classic theme and test the affected tab-navigation states. Record the source, impact, and evidence for each warning. Add only required compatible assets, or document why each path is unused, before visual acceptance per FR-017, FR-020, T047, and Constitution III. **Demo-only evidence**: Added the nine active GIF paths to `theme-classic-modern` as byte-identical copies of the verified Classic assets. The development build merged them. The focused Chromium probe loaded all nine with HTTP 200, advanced scrollers by 20 CSS pixels in all four tab positions, and closed one tab. The two `navigation-more` paths were not requested and remain as build warnings. T082 is complete for the approved demo scope. Keep G0, G1, G2, G3, T047, and production acceptance blocked. See [navigation image audit](evidence/navigation-image-audit.md).

## Phase 14: Convergence

- [X] T083 [MEDIUM] Review the grid-header rule and border-variable overrides in `TestApp/packages/local/theme-classic-modern/sass/src/grid/header/Container.scss`, `sass/var/grid/header/Container.scss`, and `sass/var/tab/Tab.scss` against the T046 approval manifest. Remove declarations that are not needed to preserve Classic styling, or obtain separate scoped approval before retaining them. Rebuild and verify stylesheet order, legacy CSS effects, and computed border styles per FR-012, FR-022, and Constitution II–III (unrequested). **Evidence**: T046 approved only background colors and images and listed no added rules. The project owner separately approved these border-preservation declarations for the demo only. Sencha Cmd 7.7.0.36 refresh and development build passed. The new CSS bundles match the captured hashes. The browser capture records inline styles first, two theme bundles next, and legacy CSS last. Original and Modernized grid-header borders both compute to `rgb(197, 197, 197)`. Tab borders both compute to `rgb(141, 179, 227)`. Legacy CSS cascade checks, all 336 CSS comparisons, and all 336 behavior comparisons pass. Production checks remain outside this approval. See [tracked T083 record](evidence/t083-border-preservation.md), [T083 review](../../artifacts/compatibility/t083-border-preservation-20261021/review.json), and [demo-only approval](../../artifacts/compatibility/t083-border-preservation-20261021/approval.json).

## Phase 15: Convergence

- [ ] T084 [HIGH] Complete the toolbar container surface required by FR-014 and AC-004. T045 and T046 cover toolbar buttons but not the toolbar surface. The Classic parent still defines `$toolbar-background-gradient` in `TestApp/ext/classic/theme-classic/sass/var/toolbar/Toolbar.scss`, and the replacement has no toolbar container variables. Obtain scoped demo-only approval before changing this surface. Then update only approved paint variables in `TestApp/packages/local/theme-classic-modern/sass/var/toolbar/Toolbar.scss` and validate toolbar states, geometry, CSS, interactions, screenshots, and rollback before accepting T047/G3 (partial).
  **Approval**: The project owner approved the demo-only toolbar gradient change on 2026-10-21. See [approved exceptions](evidence/approved-exceptions.md).
  **Partial evidence**: The development build passed. The Playwright run passed 40/40 tests. The toolbar delta found zero direct geometry, unapproved CSS, or interaction differences. It changed only the toolbar background image. Keep T084 open. G0, G2, G3, and G4 remain blocked. G1 is not-run. See [T084 toolbar evidence](evidence/t084-toolbar-demo.md).

## T076 Investigation Update — 2026-10-22

The focused demo diagnostic completed two runs of 40 collapsed-panel captures.
Both current readiness and the proposed geometry-read delay produced unstable counts.
Reject that proposed correction. Keep T076 open and G1/G2 blocked.
The runner and eight browser traces support further investigation.
Next, repeat against isolated Classic output and record animation completion events.
The 52 Node.js compatibility checks passed. Production checks remain skipped.
See [T076 diagnostic evidence](evidence/t076-layout-diagnostic.md).
