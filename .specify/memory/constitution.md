<!--
Sync Impact Report
Version change: 1.0.0 -> 2.0.0 (incompatible target version change).
Modified principles: I. Build a Replaceable Theme; IV. Use Evidence Before Making Changes.
Added sections: none.
Removed sections: none.
Reason: The project owner requires only the available Ext JS 7.7.0.31 SDK.
The prior Ext JS 7.3 target no longer applies.
Deferred items: Verify build compatibility. Confirm production inheritance, CSS, and component use.
Template changes: none. Dependent commands read this constitution at runtime.
Remove this review comment before commit.
-->

# Ext JS 7.7.0.31 Classic Theme Modernization Constitution

## Core Principles

### I. Build a Replaceable Theme

The project MUST deliver a standard Sencha Cmd theme package for Ext JS 7.7.0.31 Classic Toolkit.
This is the only supported software development kit (SDK) version.
Support for other SDK versions is not required.
The package MUST extend the existing active theme.
Classic Toolkit and the `theme-classic` package are different technical terms.
The team MUST verify the active package and its inheritance for each target application.
The team MUST NOT assume that the demo and production themes are the same.
Neptune, Triton, Crisp, Material, and Modern Toolkit MUST NOT replace the current architecture.

Users MUST select the package through standard theme configuration and rebuild the application.
Users MUST restore the original theme through the same mechanism.
Both operations MUST preserve application source code and existing styles.
The package MUST preserve standard commands and build processes.
It MUST remain independent of application business logic.
It MUST NOT require JavaScript overrides or framework file changes.
It MUST NOT require changes to `xtype`, `ui`, `cls`, or event handlers.
It MUST NOT require application changes solely to support the theme.

Use `package.json` for package metadata.
Use `sass/var` for variables and `sass/src` for necessary rules.
Use `sass/etc` when the supported Sass pipeline requires it.
Use `resources` for compatible assets.
The team SHOULD use existing Sass variables before adding rules.
Custom rules MUST remain minimal.

### II. Preserve Geometry and CSS Contracts

Change paint properties. Preserve layout properties.
Cascading Style Sheets (CSS) pixel dimensions MUST remain unchanged.
Geometry variables MUST be immutable by default.
The following properties MUST remain unchanged unless an approved exception applies:

- Width, height, and minimum and maximum dimensions.
- Padding, margins, and border widths.
- Component, grid row, header, and toolbar dimensions.
- Trigger and icon dimensions.
- Font family, size, weight, line height, and letter spacing.
- Box sizing, display, positioning, overflow, and layout transforms.

Changes MUST NOT cause unintended clipping, text overflow, scrolling changes, or layout recalculation.
Font metric changes are prohibited in the initial release.

The package MUST preserve standard `.x-*` classes and component state classes.
It MUST preserve the Document Object Model (DOM) hierarchy.
Existing application CSS MUST continue to work without a rewrite.
Rules MUST NOT add unnecessary specificity.
Rules MUST NOT use global root selectors that override application styles.
Use of `!important` requires a documented and approved reason.
Compatibility checks MUST inspect specificity and stylesheet loading order.
Checks MUST cover nested selectors and state selectors.
Checks MUST compare computed styles, not only source CSS.
These rules protect the application's existing CSS contracts.

### III. Modernize Paint in Controlled Steps

The theme MUST improve appearance while preserving the recognizable color scheme and semantic colors.
It MUST NOT introduce an unrelated palette.
The team SHOULD reduce glossy gradients through subtle gradients or flat surfaces.
The team SHOULD refine background colors, border colors, and consistency between components.
The team SHOULD improve hover, focus, selected, pressed, and disabled states.
Focus indicators MUST preserve layout.

Each technique MUST have a compatibility risk assessment.
Border radius, shadows, outlines, and new images require visual validation.
Shadows require clipping checks.
Sharper icons and higher resolution or Scalable Vector Graphics (SVG) assets are permitted.
Replacement assets MUST preserve original rendered CSS dimensions.
Asset checks MUST cover intrinsic dimensions, rendered dimensions, paths, and background positions.
Checks MUST also cover sprites, alignment, clipping, and different device pixel ratios (DPRs).
CSS MUST NOT attempt to change DPR.
Replace assets incrementally.
The initial release MUST NOT change the global icon technology.
A complete icon system replacement requires a separate specification and compatibility review.

### IV. Use Evidence Before Making Changes

Prefer official Ext JS 7.7 documentation and verified repository evidence for SDK 7.7.0.31.
Use standard Ext JS and Sencha Cmd mechanisms.
Distinguish verified facts, supported technical assumptions, and unverified hypotheses.
Document missing information.
Do not invent configuration details, test results, or compatibility guarantees.
Prefer the solution with the fewest changes when quality and compatibility are equivalent.
Avoid unnecessary frameworks, dependencies, custom build processes, and workarounds.

Before implementation, the team MUST record exact framework and Sencha Cmd versions.
It MUST inspect theme inheritance, Sass files, CSS files, package configuration, and the build process.
The demo MUST serve as a compatibility test environment.
A completed demo MUST NOT serve as proof of production compatibility.
Production adoption requires validation against actual production CSS, inheritance, and component use.

### V. Use Simplified Technical English

All project documentation MUST follow ASD-STE100 Simplified Technical English principles.
This rule applies to this constitution, specifications, plans, tasks, reports, and test documentation.
It also applies to migration instructions, rollback instructions, and developer documentation.
Use short, direct sentences and active voice.
Use one instruction or main idea per sentence.
Use consistent technical terms and imperative verbs for instructions.
Avoid ambiguous words, unnecessary adjectives, and complex phrases.
Define abbreviations and project terms at first use.
An application programming interface (API) is a public framework interface in this project.
Preserve exact API names, CSS selectors, file paths, commands, and code identifiers.
MUST states a requirement. MUST NOT states a prohibition. SHOULD states a recommendation.
Review documentation against these rules before completion.
Apply these principles pragmatically.
Do not claim formal certification without a formal controlled-language check.

## Repository Evidence and Open Items

The following facts were verified from repository files on 2026-10-20:

- `ext-frame/version.properties` and `TestApp/ext/version.properties` record Ext JS `7.7.0.31`.
- `node_modules/@sencha/cmd-windows/dist/sencha.cfg` records Sencha Cmd `7.7.0.36`.
- `TestApp/app.json` selects toolkit `classic` and theme `ext-theme-classic`.
- `TestApp/ext/classic/theme-classic/package.json` defines that alias for `theme-classic`.
  This package extends `theme-neutral`, which extends `theme-base`.
- The demo uses `TestApp/app/Application.scss` and `TestApp/app/view/main/Main.scss`.
  The latter includes nested state selectors and custom component styles.
- Theme package metadata declares `sass/var`, `sass/src`, and `sass/etc/all.scss`.
- `TestApp/build.xml` loads the Sencha Cmd build process.
  `TestApp/workspace.json` defines the framework and package paths.
  `TestApp/bootstrap.css` imports generated development CSS.

The project owner confirmed Ext JS 7.7.0.31 as the sole target on 2026-10-20.
Use the existing SDK. Build compatibility with the recorded Sencha Cmd version remains unverified.
The production theme, inheritance, CSS, and component use remain unknown.
The team MUST resolve these items before accepting the target baseline.
Source configuration and generated files do not prove a successful build or runtime compatibility.

## Development Gates

**Original baseline:** Before visual changes, record environment and build versions.
Record screenshots, geometry, computed styles, stylesheet loading order, and representative interactions.

**Derived baseline:** First create a derived package without visual customizations.
In a controlled environment, prove equivalent appearance, geometry, computed styling, and behavior.
Identify and resolve every difference.
Modernization MUST NOT start until this gate passes.

**Change validation:** Make small, isolated changes.
Each change MUST state its visual goal, affected components, risks, test method, and rollback method.
Validate each change before starting the next change.
Every visual change MUST pass relevant regression tests.
Tests MUST cover component states and user interactions.
Coverage MUST include buttons, toolbars, panels, headers, grids, trees, forms, and validation.
It MUST also include tabs, menus, floating elements, windows, dialogs, and scrollable containers.
Control browser version, viewport, fonts, and DPR.
Screenshots SHOULD be reproducible.
Compare geometry and computed styles between the original and replacement themes.
Record results separately:

1. Visual differences MUST be expected and approved.
2. Geometry differences are prohibited by default.
3. Behavior differences are prohibited. Public APIs MUST remain unchanged.
4. CSS compatibility differences require explicit approval.

A visual improvement MUST NOT justify an ignored test failure.

**Completion:** A theme change is complete only when the existing Sencha Cmd workflow builds it.
It MUST meet its approved visual goal and pass relevant automated tests.
It MUST satisfy the geometry, CSS, behavior, and API rules above.
Test evidence MUST be recorded.
Rollback through standard theme selection and rebuild MUST be verified.

## Governance

This constitution governs all later Spec Kit work.
Apply it to `/speckit.specify`, `/speckit.plan`, `/speckit.tasks`, and implementation.
Compatibility requirements take priority over visual improvements.
Review each specification, plan, task set, and change for compliance before acceptance.

Exceptions require documented approval before use.
Each proposal MUST state its scope, reason, risks, tests, and rollback procedure.
An exception MUST NOT silently change this constitution.
Amendments require a recorded reason, impact assessment, approval, and compliance review.
Record the version and amendment date.
Use semantic versioning: MAJOR for incompatible rule changes or removals.
Use MINOR for new principles or material additions.
Use PATCH for wording changes that preserve meaning.

**Version**: 2.0.0 | **Ratified**: 2026-10-20 | **Last Amended**: 2026-10-20
