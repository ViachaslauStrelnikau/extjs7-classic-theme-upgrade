# Feature Specification: Drop-in Classic Theme Modernization

**Feature Branch**: No branch created. This workspace has no Git repository or branch hook.

**Created**: 2026-10-20

**Status**: Draft

**Input**: User request, as clarified: Create a replaceable Ext JS 7.7.0.31 Classic theme. Modernize paint.
Preserve geometry, existing styles, component behavior, and standard build integration.

## Clarifications

### Session 2026-10-20

- Q: Must the first release support one exact Ext JS 7.3 build or all Ext JS 7.3 builds?
  → A: Support only the available Ext JS 7.7.0.31 software development kit (SDK).
  Support for other SDK versions is not required.
- Q: Can modernization start after the demo passes its baseline tests, while production validation remains a later adoption gate?
  → A (2026-10-23 scope update): This feature covers `TestApp` only. Production CSS, theme
  inheritance, component inputs, and production browser validation belong to the next independent
  production compatibility spec. Demo results do not prove production compatibility.

### Session 2026-10-21

- The project owner approved skipping the production check for demo-only visual work.
  The production check is now deferred to the next independent spec. Keep G0 blocked for
  production readiness. Demo results do not prove production compatibility. See the
  [scope decision](evidence/approved-exceptions.md).

### Session 2026-10-23

- The project owner directed the team to omit production inputs from this feature and test them
  in the next independent spec. This feature covers the existing `TestApp` demo only.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Select and Restore the Theme (Priority: P1)

An application maintainer selects the replacement through standard theme configuration.
The maintainer rebuilds the existing application and can restore the original theme.

**Why this priority**: Replacement and rollback define the product's main value.

**Independent Test**: Build the existing demo with each theme in sequence.
Compare application components, scripts, and legacy styles before and after selection.

**Acceptance Scenarios**:

1. **Given** the original application and an installed replacement package,
   **When** the maintainer selects the replacement and rebuilds,
   **Then** the application uses the package without component, script, or legacy style changes.
2. **Given** the replacement is selected,
   **When** the maintainer selects the original theme and rebuilds,
   **Then** the original appearance and behavior return without manual application patches.
3. **Given** the package is available separately from the demo,
   **When** a maintainer uses the documented installation procedure in a supported application,
   **Then** the package does not require demo code, business logic, or a separate runtime style overlay.

---

### User Story 2 - Prove the Initial Replacement Matches (Priority: P1)

A compatibility reviewer compares the original theme with a derived theme that has no visual changes.
The reviewer uses the existing demo and the same component configurations and data.

**Why this priority**: A matching baseline separates package integration errors from visual changes.

**Independent Test**: Compare both themes before any modernization.
Inspect screenshots, measured geometry, computed styles, selector effects, and interactions.

**Acceptance Scenarios**:

1. **Given** a verified target environment and an original baseline,
   **When** the reviewer tests the initial derived package,
   **Then** appearance, geometry, computed styling, and behavior match the original.
2. **Given** a baseline difference,
   **When** the comparison report is reviewed,
   **Then** the cause must be identified and resolved before modernization starts.
3. **Given** results from the verified Ext JS 7.7.0.31 environment,
   **When** target compatibility is reviewed,
   **Then** only this SDK version is within the required support scope.
   Results from other SDK versions do not satisfy its baseline gate.
4. **Given** production CSS, theme inheritance, or component inputs are missing,
   **When** the team completes this demo feature,
   **Then** record production validation as deferred to the next independent spec and make no
   production compatibility claim.

---

### User Story 3 - Keep Existing Styles and Interactions (Priority: P1)

An application user uses the same controls after theme replacement.
An application maintainer keeps existing component configurations and Cascading Style Sheets (CSS).

**Why this priority**: Existing applications depend on these contracts for correct use and layout.

**Independent Test**: Run the component and legacy style cases under both themes.
Compare computed styles, geometry, state changes, and interaction results.

**Acceptance Scenarios**:

1. **Given** legacy standard, nested, and state selectors,
   **When** either theme is built and the relevant states are active,
   **Then** the same application declarations take effect with the same computed values.
2. **Given** unchanged component configurations and data,
   **When** a user completes each required interaction,
   **Then** the result and public interface behavior match the original theme.
3. **Given** long text, scrolling content, or a viewport resize,
   **When** layout completes under each theme,
   **Then** dimensions, positions, overflow, and clipping match under the same conditions.

---

### User Story 4 - Review and Accept Visual Improvements (Priority: P2)

A visual reviewer compares small groups of appearance changes in the existing demo.
The reviewer approves improvements only when compatibility evidence is complete.

**Why this priority**: The product must improve appearance after the compatibility gate passes.

**Independent Test**: Review one change group against its visual goal and regression evidence.
A group must pass independently before the next group starts.

**Acceptance Scenarios**:

1. **Given** a passed baseline gate and a defined visual goal,
   **When** the reviewer compares both themes,
   **Then** the change improves the intended surfaces or states and keeps the existing color identity.
2. **Given** an attractive change with a geometry, style contract, or behavior failure,
   **When** the reviewer evaluates the evidence,
   **Then** the group is rejected until the failure is resolved.
3. **Given** the final comparison report,
   **When** the reviewer accepts the feature,
   **Then** approved differences, regression results, rollback evidence, and limitations are recorded.

### Edge Cases

- The installed framework differs from the target. Record the mismatch and withhold target acceptance.
- Production inheritance, styles, or component inputs are unavailable.
  Record the gap. Defer production acceptance to the next independent spec. Withhold production claims.
- A supported component has a custom `ui`, `cls`, or `bodyCls`. Preserve it under both themes.
- A legacy declaration competes with a theme state rule. Verify the cascade in the active state.
- Text is long or a grid has many rows and columns. Compare clipping and scroll dimensions.
- A menu or shadow meets a container edge. Verify clipping, stacking, alignment, and overlap.
- A field is invalid, disabled, or read-only. Preserve state behavior and test each applicable state.
- An asset has different intrinsic dimensions. Preserve its rendered dimensions and sprite alignment.
- A browser cannot provide a requested pixel ratio. Record the missing case without marking it passed.
- Rollback follows several visual changes. Restore the original with configuration and rebuild only.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The product MUST be a standard Sencha Cmd theme package for Ext JS 7.7.0.31 Classic Toolkit.
  This is the only supported SDK version. Support for other versions is not required.
  It MUST remain separate from demo code and application business logic.
- **FR-002**: Users MUST select either theme through standard application theme configuration.
  Both themes MUST build through the existing Sencha Cmd workflow.
  A separate runtime style overlay MUST NOT be required.
- **FR-003**: The replacement MUST extend the verified active theme and preserve its styling contracts.
  Inspection MUST distinguish Classic Toolkit from `theme-classic`.
  Demo inheritance MUST NOT be assumed to match production inheritance.
- **FR-004**: Theme selection and rollback MUST preserve application JavaScript and existing custom styles.
  They MUST preserve `xtype`, `ui`, `cls`, `bodyCls`, event handlers, and public application programming
  interfaces (APIs). New component classes MUST NOT be required.
  New application user interface (UI) configurations MUST NOT be required.
- **FR-005**: The original theme MUST remain available.
  Rollback MUST restore its appearance and behavior through standard configuration and rebuild.
  Rollback MUST NOT require removal of theme-specific application patches.
- **FR-006**: Before baseline acceptance, record exact framework and Sencha Cmd versions.
  For this feature, verify the `TestApp` theme, parent chain, style sources, package configuration,
  and build workflow. Use the available Ext JS 7.7.0.31 SDK.
  Verify actual production CSS, theme inheritance, component inputs, and browser requirements in
  the next independent production compatibility spec. Demo results MUST NOT establish production
  compatibility.
- **FR-007**: Record the original baseline before visual changes.
  Include screenshots, geometry, layout-sensitive computed styles, selector effects,
  stylesheet loading order, environment details, and representative interactions.
- **FR-008**: The first derived theme MUST have no visual customizations.
  It MUST match original appearance, geometry, computed styling, and behavior in the controlled environment.
  Investigate and resolve every difference before modernization starts.
- **FR-009**: The replacement MUST preserve component dimensions and positions.
  Preserve minimum and maximum dimensions, padding, margins, and border widths.
  Preserve grid row and column dimensions, headers, toolbars, fields, triggers, tabs, and icons.
- **FR-010**: Preserve font family, size, weight, line height, and letter spacing in the first release.
  Preserve box sizing, display, positioning, layout transforms, and overflow behavior.
  Visual changes MUST NOT cause unintended clipping, scrolling changes, or layout recalculations.
- **FR-011**: The replacement MUST preserve standard `.x-*` classes and state class names.
  It MUST preserve the Document Object Model (DOM) hierarchy and existing component states.
- **FR-012**: Existing CSS MUST retain their effect without a rewrite.
  The package MUST NOT add unnecessary selector specificity or broad root rules that defeat overrides.
  Each `!important` rule requires a documented and approved reason.
- **FR-013**: The existing demo MUST include representative legacy CSS cases using standard selectors.
  Cases MUST cover nested selectors, state selectors, competing specificity, and stylesheet order.
  Verify the same intended declarations and computed results with both themes.
- **FR-014**: Modernization MUST reduce glossy appearance through approved flat surfaces or subtle gradients.
  Cover buttons, toolbars, panel headers, grid headers, tabs, form controls, and menus.
  Include floating components. Preserve recognizable colors and semantic color meanings.
- **FR-015**: Refine border colors and separators without changing border widths.
  Shadows, border radius, outlines, and new images require visual and clipping validation.
  Shadows MUST NOT introduce overlap problems. Focus indicators MUST remain visible without layout changes.
- **FR-016**: Review normal, hover, focused, pressed, selected, disabled, read-only, and invalid states
  for each component that supports them. Preserve state classes, transitions, and behavior.
- **FR-017**: Evaluate individual higher resolution raster and Scalable Vector Graphics (SVG) assets.
  Adopt an asset only when it improves sharpness and passes compatibility checks.
  Verify intrinsic and rendered dimensions, paths, background position, sprites, alignment, and clipping.
  Preserve rendered CSS dimensions and existing paths where application compatibility requires them.
  The first release MUST NOT replace the complete icon system or global icon technology.
- **FR-018**: The theme MUST NOT change device pixel ratio (DPR) or browser zoom.
  Typography changes MUST NOT alter the font metrics protected by FR-010.
- **FR-019**: Extend `TestApp` as the comparison environment. Do not create another application.
  Both themes MUST use the same demo component configurations, data, and legacy CSS fixtures.
  Fixtures MAY extend coverage but MUST NOT compensate for replacement theme defects.
  Theme selection at build time is sufficient. A custom runtime switching system is not required.
- **FR-020**: The demo MUST cover all component and interaction cases in the coverage table below.
  Include each applicable state from FR-016. Compare each case under both themes.
- **FR-021**: Provide automated geometry and computed-style comparisons.
  Measure bounding boxes, positions, spacing, border widths, font metrics, and scroll dimensions.
  Compare the original and replacement under identical conditions. Flag every unexpected difference.
- **FR-022**: Classify computed-style differences using the property rules below.
  A permitted paint property change still requires an approved visual goal.
  A prohibited property change MUST fail compatibility checks.
- **FR-023**: Provide reproducible screenshot comparisons and automated interaction regression checks.
  Review intended visual differences. Detect unexpected clipping, alignment, and rendering differences.
- **FR-024**: Test Chromium and Firefox with DPR 1 and 2 where supported.
  Record exact browser versions, viewport, zoom, fonts, DPR, and comparison conditions.
  Use identical conditions for each theme pair.
  Record unsupported cases. Add production-required browsers when that environment is known.
- **FR-025**: Keep visual, geometry, behavior, and CSS compatibility results separate.
  Visual differences MUST be expected and approved.
  Geometry and CSS contract exceptions require prior approval under the constitution.
  Behavior differences are prohibited. No test failure may be ignored to accept a visual improvement.
- **FR-026**: Validate small change groups in this order: surfaces and gradients; background and border
  colors; hover, focus, and selection states; shadows and outlines; individual icons; HiDPI assets;
  then other reviewed visual changes. HiDPI means display rendering at a high pixel density.
  Each group MUST define a goal, affected components, risks, tests, and rollback.
  Each group MUST pass regression review before the next group starts.
- **FR-027**: Deliver installation, comparison, test, and rollback instructions.
  Deliver a compatibility report with evidence references, approved differences, known risks,
  unsupported cases, and unverified production assumptions.
  Do not state that a check passed without evidence.
- **FR-028**: All generated documentation MUST follow ASD-STE100 Simplified Technical English principles.
  Use short, active sentences and consistent terms. Preserve exact technical identifiers.
  Do not claim formal controlled-language certification without a formal check.
- **FR-029**: The feature MUST NOT migrate toolkits or switch to Neptune, Triton, Crisp, or Material.
  It MUST NOT rewrite components, replace application CSS, or change business logic or color identity.
  It MUST NOT introduce another JavaScript framework, modify framework files, or use JavaScript overrides
  to support visual changes.
- **FR-030**: Production adoption MUST require checks against actual production inheritance, CSS,
  component use, and browser requirements. Demo results MUST NOT establish production compatibility.

#### Required Demo Coverage

| Components | Required interactions and conditions |
| --- | --- |
| Buttons, split buttons, toolbars | Click, toggle, split menu, hover, focus, disabled state |
| Panels and headers | Collapse, expand, title and icon alignment |
| Grids | Select, edit, validate edits, sort, scroll rows and columns |
| Trees | Expand, collapse, select, navigate with the keyboard |
| Form fields, combo boxes, checkboxes, radio buttons | Input, select, toggle, validate, read-only and invalid states |
| Tabs | Select tabs and navigate with the keyboard |
| Menus and submenus | Open, select, dismiss, navigate with the keyboard |
| Windows and dialogs | Open, close, drag, resize, keyboard focus |
| Tooltips and floating components | Show, hide, edge positioning, clipping and stacking |
| Scrollable containers and resized layouts | Scroll, resize the viewport, compare layout updates |

#### Computed Style Difference Rules

| Group | Properties and acceptance rule |
| --- | --- |
| Permitted paint changes | Colors, backgrounds, gradients, and border colors within the approved palette |
| Paint changes that need specific approval | Shadows, focus outlines, border radius, and asset changes |
| Prohibited changes | Dimensions, spacing, border widths, font metrics, box sizing, display, layout, positioning, overflow, and layout transforms |

Approved exceptions MUST identify scope, reason, risks, tests, and rollback before use.
A permitted paint change MUST also satisfy every geometry and behavior requirement.

### Key Entities *(include if feature involves data)*

- **Theme pair**: The original theme and its derived replacement for one verified target environment.
- **Comparison case**: A component configuration, data set, state, interaction, and legacy style fixture.
  Both themes use the same case.
- **Baseline evidence**: Environment details and original measurements linked to comparison cases.
- **Change group**: An isolated visual goal with affected cases, risks, approval, tests, and rollback.
- **Compatibility result**: Expected and actual results for one theme pair and environment.
  It includes evidence, difference category, status, and limitations.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A maintainer completes original-to-replacement-to-original selection and rebuild.
  This requires zero changes to application components, scripts, or legacy styles.
- **SC-002**: Before modernization, 100% of required baseline cases match in appearance, measured geometry,
  computed styling, and interaction results. There are zero unresolved baseline differences.
- **SC-003**: After modernization, 100% of required geometry and protected style comparisons pass.
  There are zero unapproved geometry or CSS contract differences.
- **SC-004**: A visual reviewer accepts the documented improvement in each required surface family.
  Every accepted visual difference has an approved goal and evidence.
  The reviewer confirms the original color identity and semantic meanings remain recognizable.
- **SC-005**: All required interaction cases pass under both themes in every supported test environment.
  There are zero behavior regressions.
- **SC-006**: Every required environment has paired screenshots, measurements, style results,
  and interaction results. Every unsupported combination has an explicit limitation.
- **SC-007**: A maintainer can install the package and reproduce comparison and rollback results
  from the delivered instructions. No demo dependency or manual application patch is required.
- **SC-008**: The final report accounts for all 14 acceptance criteria below.
  Every passed criterion links to evidence. All known risks and unverified assumptions are listed.

### Acceptance Criteria Traceability

| Criterion | Required outcome | Requirements | Success criteria |
| --- | --- | --- | --- |
| AC-001 | Valid standard theme package | FR-001, FR-003 | SC-001, SC-007 |
| AC-002 | Standard selection of either theme | FR-002, FR-005 | SC-001 |
| AC-003 | Equivalent initial replacement | FR-006 through FR-008 | SC-002 |
| AC-004 | Approved visual improvements | FR-014 through FR-017, FR-026 | SC-004 |
| AC-005 | Recognizable existing colors | FR-014 | SC-004 |
| AC-006 | Unchanged geometry and layout styles | FR-009, FR-010, FR-018, FR-021, FR-022 | SC-003 |
| AC-007 | Compatible tested standard selectors | FR-011 through FR-013 | SC-003 |
| AC-008 | Unchanged component configurations | FR-004, FR-019 | SC-001, SC-003 |
| AC-009 | Passing component interactions | FR-016, FR-020, FR-023 | SC-005 |
| AC-010 | Available visual and geometry evidence | FR-021 through FR-025, FR-027 | SC-006 |
| AC-011 | Existing build workflow works | FR-002 | SC-001 |
| AC-012 | Rollback without application changes | FR-004, FR-005 | SC-001, SC-007 |
| AC-013 | Package separate from demo code | FR-001, FR-019 | SC-007 |
| AC-014 | Report states limits and production gaps | FR-027, FR-030 | SC-008 |

## Assumptions

### Verified Repository Facts

The following facts were checked on 2026-10-20. They do not establish runtime compatibility.

- `ext-frame/version.properties` and `TestApp/ext/version.properties` record Ext JS `7.7.0.31`.
- `node_modules/@sencha/cmd-windows/dist/sencha.cfg` records Sencha Cmd `7.7.0.36`.
- `TestApp/app.json` selects toolkit `classic` and theme `ext-theme-classic`.
- `TestApp/ext/classic/theme-classic/package.json` declares the alias `ext-theme-classic`.
  Its package name is `theme-classic`. It extends `theme-neutral`, which extends `theme-base`.
- `TestApp/workspace.json` selects the local `ext` framework and declares package locations.
  `TestApp/build.xml` loads the Sencha Cmd build process.
  These files do not prove a successful build.
- `TestApp/app/Application.scss` and `TestApp/app/view/main/Main.scss` contain application styles.
  The latter defines a custom navigation UI and nested state selectors.
- The existing demo includes tabs and a personnel grid.
  Full coverage in FR-020 is a requirement, not an existing verified capability.

### Scope Assumptions and Dependencies

- Ext JS 7.7.0.31 is the sole target, as confirmed by the project owner.
  Use the existing SDK. Do not add a requirement to obtain or support another SDK version.
  Sencha Cmd 7.7.0.36 is recorded in the repository. Build compatibility still requires evidence.
  This feature covers `TestApp`. Production inputs and validation belong to the next independent spec.
- Production configuration, CSS, and component inventory are not available in the inspected project.
  The demo's active theme is not evidence of production inheritance.
  Keep production acceptance blocked until the next spec verifies these inputs. Do not infer the
  production theme chain from `TestApp`.
- The existing demo may receive shared test fixtures and representative components during implementation.
  These additions are test coverage. They must be identical for both themes.
  Existing application code must not need edits when selecting or restoring a theme.
- The project owner or designated reviewer approves visual goals, palette refinements, and exceptions.
  Record approval before accepting a change. No visual approval or test pass is claimed here.
- Compare each theme pair in the same environment after the same interaction and layout conditions.
  The target is zero unintended geometry differences. Do not assume a tolerance that hides differences.
  Planning must define repeatable measurement conditions and account for rendering noise.
- Production-required browsers are additional dependencies when the production environment is supplied.
  An unsupported environment is a recorded coverage gap, not a passed test.
- Detailed package structure, Sass variable choices, implementation steps, and test tool selection
  belong to `/speckit.plan`. This specification does not select them.
- The required deliverables are the independent theme package, the extended existing demo,
  original and replacement comparisons, automated compatibility tests, visual and interaction evidence,
  installation and rollback instructions, and the compatibility report.
