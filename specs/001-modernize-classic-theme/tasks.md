---
description: "Tasks for the replaceable Ext JS 7.7.0.31 Classic theme"
---

# Tasks: Drop-in Classic Theme Modernization

**Input**: Design documents in `specs/001-modernize-classic-theme/`.
**Authority**: Constitution 2.0.0, `spec.md`, `plan.md`, and both contracts.
**Target**: Ext JS 7.7.0.31 Classic Toolkit only.
**Status**: Partial implementation. The empty package, demo fixtures, evidence checks, and browser capture runner exist. Production compatibility and visual modernization remain incomplete.

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

- Production inputs are missing. G0 blocks baseline acceptance and paint changes.
- Playwright Test 1.64.1 and matching Chromium and Firefox binaries are installed. The capture runner completed all four browser/DPR projects at both configured viewports in the development build. See `artifacts/compatibility/viewport-matrix-20261021c/`.
- Firefox layout-shift records do not measure every layout pass. The comparator blocks affected acceptance.
- The earlier Fashion failure log is absent. Its cause is unknown.
- T028 remains open until a complete Firefox layout method is available.

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

- [ ] T005 Diagnose the missing `TestApp/.sencha/` metadata and the Fashion failure in `sencha-error-20261020.log`. Record root cause evidence and a supported recovery procedure in `specs/001-modernize-classic-theme/evidence/build-recovery.md`. Do not assume that `app refresh` restores missing metadata. **Blocked**: the historical Fashion log is absent. The failure did not recur.
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
- [ ] T028 [US2] Implement readiness and capture in `tests/compatibility/capture.spec.js`. Start a fresh browser context for each capture. Verify successful build identity, loaded manifest, theme, CSS hashes, source hashes, actual DPR, and PNG dimensions. Wait for framework, fonts, images, required states, and consecutive stable frames. Capture exact roots and sensitive children without arbitrary readiness sleeps, test CSS injection, rounding, or layout patches. Verify and implement the layout observation method defined in `plan.md` for each required browser. Store original and replacement observations, repeated-original stability, method, scope, and limitations in `diagnostics.json`. Keep initial rendering separate from interaction measurements. Use identical conditions within each pair. Block affected acceptance when sufficient observations are unavailable. **Partial**: The development original capture recorded 42 states per browser/DPR/viewport. Chromium reports CDP layout counts. Firefox records layout shifts and marks them insufficient. The plan defines both methods and their limits.
- [ ] T029 [US2] Complete capture records in `tests/compatibility/capture.spec.js` for full computed styles, visible pseudo-elements, DOM hierarchy and standard classes, ordered external and inline stylesheets, effective legacy declarations, interaction outcomes, missing assets, page errors, screenshots, and failure traces. Normalize only generated instance IDs and record the rules. **Partial**: Each capture writes six field JSON files and a full record. State preparation outcomes are recorded. Full action outcome checks remain in T039.
- [X] T030 [US2] Implement `tests/compatibility/compare.mjs` against the harness contract. Require all baseline roles and stable original-repeat results. Compare unrounded geometry with zero tolerance, protected styles, DOM, cascade effects, behavior, and screenshots within equivalent environments. Separate identity and URL changes from semantic failures. Reject unresolved additional layout work and missing required layout evidence. Report layout observations separately from final geometry equality. Reject missing suite results required by the current story stage. Use nonzero exit for fail, blocked, invalid, or incomplete evidence. Unit tests cover these rules. A current preflight exits with a blocked status because capture evidence is absent.
- [X] T031 [US2] Implement `tests/compatibility/report.mjs` with linked raw evidence, separate visual/geometry/CSS/behavior results, limitations, and G0 through G4 dependencies. Write `report.html`, `results.json`, and diagnostic reports under `artifacts/compatibility/<run>/`. Preserve failing status during report generation.
- [X] T032 [US2] Add `compat:capture`, `compat:compare`, and `compat:report` scripts in `package.json`. Enforce contract inputs and immutable paths in `tests/compatibility/evidence.mjs`. Use `artifacts/compatibility/<run>/<build-mode>/<role>/<project-viewport>/<case>/<state>/`. Keep helpers independent of Cmd builds and application theme configuration. Run T014, T021, and T022 negative checks. All required checks passed.
- [ ] T033 [US2] Obtain and verify actual production inputs in `artifacts/compatibility/<run>/production-inputs.json`. Map source hashes, CSS order, parent chain, components, states, and browser requirements to cases. Record reviewer evidence in `specs/001-modernize-classic-theme/evidence/production-inputs.md`. Compare production browser requirements with the configured matrix. Add each required browser environment to `tests/compatibility/playwright.config.js`. Record exact versions and supported DPR settings. Install required browser binaries through the selected test tool. If the tool cannot test a required browser, record blocked coverage and resolve the test approach before acceptance. If production inputs are absent, record G0 as blocked and leave this task incomplete. Do not accept a baseline or start paint work.
- [ ] T034 [US2] Reconcile verified production and demo inheritance in `TestApp/packages/local/theme-classic-modern/package.json`. Finalize `extend` only when the supported application chain is resolved. If chains differ, record the scope decision in `specs/001-modernize-classic-theme/evidence/production-inputs.md`. Do not silently reparent the demo or claim support for incompatible chains. Rebuild and repeat affected US1 checks after changes.
- [ ] T035 [US2] Freeze shared fixtures and run two unchanged original captures in all four required projects, all additional production-required environments, and both viewport cases for development and production builds. Save source manifests, logs, raw captures, and G1 evidence in `artifacts/compatibility/<run>/`. Use separate references by mode and environment. Resolve unstable originals before derived comparison. Do not accept G2 while required environment coverage is missing.
- [ ] T036 [US2] Build and capture the empty derived theme, then restore and capture the original in both modes using standard operations. Run comparisons and reports in `artifacts/compatibility/<run>/`. Require complete appearance, geometry, computed-style, selector, and behavior equality. Investigate every difference without changing shared fixtures between paired captures.
- [ ] T037 [US2] Review linked evidence and record G0, G1, and G2 decisions in `artifacts/compatibility/<run>/gates.json`. Accept G2 only with verified production inputs and complete matching derived and rollback results. Keep the task incomplete on any blocked, failed, unsupported required, or unexplained case. Archive immutable original references for later groups.

**Checkpoint**: G2 passes with evidence. Provisional demo success alone cannot pass this checkpoint.

## Phase 5: US3 — Keep Existing Styles and Interactions (P1)

**Goal**: Protect application CSS and component behavior under realistic boundary conditions.
**Independent test**: Run explicit cascade and interaction assertions with both themes.
Require equal effective legacy declarations, geometry, DOM contracts, and outcomes.

### Tests

- [ ] T038 [P] [US3] Add CSS compatibility assertions in `tests/compatibility/css-contract.spec.js`. Verify standard, nested, hover, selected, focused, disabled, invalid, and pseudo-element selectors where applicable. Test competing specificity and external and inline stylesheet order. Compare actual effective values and retain existing navigation Sass fixtures.
- [ ] T039 [P] [US3] Add interaction assertions in `tests/compatibility/interactions.spec.js` for every coverage-table action. Verify outcomes after clicks, toggles, input, validation, combo selection, grid edit/sort/select/scroll, tree and tab keyboard navigation, menus, collapse/expand, window drag/resize, dialogs, and focus traversal. Include viewport resize and edge-positioned floats.

### Integration and Verification

- [ ] T040 [US3] Extend `tests/compatibility/cases.json` with CSS precedence conflicts, custom existing `ui`, `cls`, and `bodyCls`, long text, many grid rows and columns, invalid and read-only fields, container edges, and resized layouts. Apply the same cases to both themes. Map verified production-specific selectors and interactions without removing required demo cases.
- [ ] T041 [US3] Connect T038 and T039 to `tests/compatibility/playwright.config.js` and the capture/report workflow. Verify that `npm run compat:capture` discovers `capture.spec.js`, `css-contract.spec.js`, and `interactions.spec.js`. Store suite identities, completion status, actual outcomes, and evidence paths through `tests/compatibility/evidence.mjs`. Add a negative check for each missing suite. Reject incomplete evidence before US3 acceptance or change-group acceptance. Fail on altered state transitions, classes, hierarchy, public behavior, clipping, scroll dimensions, or effective legacy declarations.
- [ ] T042 [US3] Run the full original/derived/rollback matrix for development and production with the completed cases. Record results in `artifacts/compatibility/<run>/`. If fixture or input hashes changed, invalidate affected approvals, recapture originals, and repeat G1 and G2. Require all interaction and CSS assertions to pass before US4.

**Checkpoint**: Full CSS and interaction coverage passes. G2 remains valid for current inputs.

## Phase 6: US4 — Review and Accept Visual Improvements (P2)

**Goal**: Improve paint in isolated, approved groups without breaking the established contracts.
**Independent test**: Review one group's before/after images and all relevant regression results.
Accept the group before starting the next group. G2 and US3 are mandatory prerequisites.

### Tests and Review Controls

- [ ] T043 [P] [US4] Extend `tests/compatibility/compare.test.mjs` with modernization cases. Reject missing goal approval, stale baseline hashes, out-of-order groups, an unaccepted previous group, unapproved paint properties, failed rollback, and any protected-property or behavior difference despite visual approval.
- [ ] T044 [US4] Implement approved-group comparison in `tests/compatibility/compare.mjs` and `tests/compatibility/report.mjs`. Require immutable original references, matching `approvals.json`, modernized and rollback captures, per-case goals, and separate approved modernized references. Keep original, actual, and difference images. Do not auto-approve screenshots or erase prior failures.
- [ ] T045 [US4] Record approved goals for required surface families in `artifacts/compatibility/<run>/approvals.json`. Include components, variables and generated-rule impact, palette and semantic-color constraints, risk, tests, rollback, reviewer, scope, and date. Obtain real reviewer approval. Do not treat task generation or this plan as approval.

### Ordered Paint Groups

- [ ] T046 [US4] Reduce gloss in `TestApp/packages/local/theme-classic-modern/sass/var/button/Button.scss`, `TestApp/packages/local/theme-classic-modern/sass/var/panel/Panel.scss`, `TestApp/packages/local/theme-classic-modern/sass/var/grid/header/Container.scss`, and `TestApp/packages/local/theme-classic-modern/sass/var/tab/Tab.scss`. Use verified inherited variables. Cover toolbar, form, menu, and floating surfaces through their verified variables or minimal class-mapped rules under `TestApp/packages/local/theme-classic-modern/sass/src/`. Preserve geometry and color identity. Limit the group to approved surfaces and gradients.
- [ ] T047 [US4] Validate T046 with both build modes, the full browser/DPR matrix, all affected states, clipping checks, computed styles, interactions, and standard rollback. Save evidence and G3 acceptance in `artifacts/compatibility/<run>/gates.json`. Resolve all failures before accepting or starting T048.
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

- [ ] T063 [HIGH] Complete a sufficient Firefox layout-work measurement in `tests/compatibility/capture.spec.js`. Investigate a method that measures layout and style recalculation beyond visible layout shifts. Validate it on the recorded actions and pair it with the same method for the original and candidate. If no sufficient supported method exists, record the limitation and keep affected acceptance blocked. Do not mark SC-006 or the baseline as passed without adequate evidence. Per FR-021, FR-024, and plan: Layout Recalculation Checks (blocked; see [Firefox layout measurement investigation](evidence/firefox-layout-measurement.md)).
- [X] T064 [MEDIUM] Review `TestApp/packages/local/theme-classic` and determine why it declares `theme-classic` with `extend: theme-neptune`. Verify current Sencha Cmd package resolution. Remove or justify this unrequested package without changing the verified `theme-classic` → `theme-neutral` → `theme-base` chain. Record the resolution and build evidence. Per FR-003 and plan: Project Structure (complete; see [package resolution evidence](evidence/package-resolution.md)).
- [X] T065 [MEDIUM] Reconcile the `.sencha` metadata note in `specs/001-modernize-classic-theme/plan.md` with T006 evidence. Record that standard builds pass without this metadata and do not create it unless a reproducible Cmd requirement exists. Per T006 and plan: Project Structure (complete; see [build recovery evidence](evidence/build-recovery.md)).
