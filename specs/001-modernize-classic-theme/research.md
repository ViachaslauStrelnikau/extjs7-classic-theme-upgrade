# Research: Drop-in Classic Theme Modernization

**Date**: 2026-10-20
**Target**: Ext JS 7.7.0.31 only
**Status**: Design decisions complete. Runtime checks have not run.

## Evidence Rules

Verified facts come from repository files or linked official documentation.
Design decisions describe future work. They are not test results.
Context7 tools were unavailable. Research used the local SDK and official documentation.

## 1. Framework and Build Environment

**Decision**: Keep the existing SDK and Cmd. Verify the original build first.

**Verified evidence**:

- `TestApp/ext/version.properties` and `ext-frame/version.properties` record `7.7.0.31`.
- `node_modules/@sencha/cmd-windows/dist/sencha.cfg` records Cmd `7.7.0.36`.
- `TestApp/ext/cmd/sencha.cfg` records minimum Cmd `7.7.0.33` and dynamic Sass defaults.
- `TestApp/workspace.json` points to local `ext` and lists `packages/local` first.
- `TestApp/build.xml` loads standard Cmd build support.
- `TestApp/.sencha` is absent. Generated output exists, but does not prove repeatability.
- `sencha-error-20261020.log` records an application-generation failure.
  The chain reports a Fashion build exit code of 1. It does not establish the root cause.

**Rationale**: The owner selected this SDK. The recorded Cmd version exceeds the SDK minimum.
That comparison does not prove a successful build.
Recover standard metadata and identify the compiler failure during implementation preflight.
Inspect supported Cmd restoration tools and local templates. Preserve the existing application.
Do not assume that `app refresh` alone restores all missing metadata.

**Alternatives considered**: A new application, another SDK, or a custom compiler pipeline.
Reject these options because they change the product or build contract.

## 2. Parent Theme and Package Format

**Decision**: Plan `theme-classic-modern` under `TestApp/packages/local`.
Use `theme-classic` as the demo parent candidate.
Finalize inheritance after production inputs are verified.

**Verified evidence**: `TestApp/app.json` selects toolkit `classic` and `ext-theme-classic`.
The SDK maps this alias to `theme-classic`.
Its chain is `theme-classic` → `theme-neutral` → `theme-base`.
Classic Toolkit is not a theme package name.
The installed Cmd theme generator emits a root `name` field and Cmd fields inside `sencha`.
The SDK `theme-classic` and `theme-neutral` packages use this same structure.
The generated `overrides/init.js` sets the theme identity. It does not override a component class.

**Rationale**: A generated theme preserves package discovery and theme selection.
The official guide describes theme generation, inheritance, selection, and inherited assets.
[Sencha theming guide](https://docs.sencha.com/extjs/7.7.0/guides/core_concepts/theming.html)

**Alternatives considered**: Manually reformat generated metadata, extend an abstract base directly, or add an overlay.
Reject these options. Use generated metadata and the verified active parent.
If production uses another parent, resolve the package scope before G2.

## 3. Sass and Paint Changes

**Decision**: Keep Fashion. Use class-mapped `sass/var` files and Sass namespace `Ext`.
Use `sass/src` only when variables cannot meet an approved goal.
Keep required `sass/etc` utilities and generated support files.
The initial package has no visual overrides or replacement assets.

**Verified paint candidates**:

| SDK path below `TestApp/ext/classic` | Candidate |
| --- | --- |
| `theme-neutral/sass/var/button/Button.scss` | `$button-default-background-gradient` and state variants |
| `theme-neutral/sass/var/tab/Tab.scss` | `$tab-background-gradient` and state variants |
| `theme-neutral/sass/var/grid/header/Container.scss` | `$grid-header-background-gradient` |
| `theme-classic/sass/var/panel/Panel.scss` | `$panel-header-background-gradient` |

`theme-classic/sass/var/Component.scss` sets `$base-color` to `#C0D4ED` and font size to `12px`.
Keep these values initially. Inspect dependent variables and generated rules for each candidate.
A variable name does not prove geometry safety.

**Rationale**: Variables reuse inherited selectors and states.
They can still affect generated frames or assets. Compare computed styles and images.

**Alternatives considered**: Global overrides, new UI names, new icon fonts, and another Sass compiler.
Reject these options because they add contracts or change protected behavior and geometry.

## 4. Application CSS and Parent Overrides

**Decision**: Preserve navigation styles and Font Awesome as shared comparison fixtures.
Do not add theme JavaScript. Preserve inherited parent overrides.

**Verified evidence**: `TestApp/app/view/main/Main.scss` defines navigation mixins, geometry,
nested state selectors, and a pseudo-element rule.
`TestApp/app/Application.scss` enables Font Awesome.
`TestApp/bootstrap.json` lists five inherited `theme-classic/overrides` scripts.
It lists two generated development CSS files in order.
Browser loading order still requires runtime capture.

**Rationale**: Removing inherited overrides can change the original contract.
Adding new overrides violates the feature constraints.

**Alternatives considered**: Remove legacy CSS or rewrite it for the new theme.
Reject both options. Shared cases must retain their effect under both themes.

## 5. Browser Test Tool

**Decision**: Add Playwright Test as the only browser test dependency.
Pin an exact supported release during implementation. Lock matching browser binaries.
Use Chromium and Playwright Firefox at device pixel ratio (DPR) 1 and 2.
Playwright Firefox is a patched build. Do not describe it as arbitrary installed Firefox coverage.
[Playwright browser documentation](https://playwright.dev/docs/browsers)

**Verified evidence**: Root `package.json` has no browser test dependency or test scripts.
Existing browser caches do not establish compatibility with a future package pin.

**Rationale**: One runner supplies browser actions, measurements, screenshots, and traces.
Projects and device settings support the planned matrix.
[Playwright emulation documentation](https://playwright.dev/docs/emulation)

**Alternatives considered**: Selenium, manual-only checks, or a visual-only service.
These need more integration or cannot prove all required contracts.

## 6. Measurements and Reproducibility

**Decision**: Capture immutable JSON and PNG evidence for each theme, case, state, and environment.
Use sequential standard builds at one stable URL. Start fresh browser contexts after each build.
Verify the loaded build and theme before capture. Do not capture during watcher rebuilds.

Wait for application readiness, fonts, assets, and stable layout over consecutive frames.
Capture exact bounding boxes, computed styles, DOM structure, pseudo-elements, and scroll metrics.
First repeat the unchanged original capture. Reject unstable measurement conditions.
Do not round values, mask components, or add a geometry tolerance.

Keep screenshot references per browser and environment.
Host-dependent variation requires stable capture conditions.
[Playwright visual comparison documentation](https://playwright.dev/docs/test-snapshots)

**Rationale**: Images alone cannot distinguish paint, layout, and cascade regressions.
Keep separate result categories and preserve all raw failures.

**Alternatives considered**: Global pixel thresholds, automatic reference updates, or retry-until-pass.
Reject these options because they can conceal unexplained regressions.

## 7. Production Input Gate

**Decision**: Keep G0 blocked until production CSS, inheritance, and component inputs are verified.
Require file identities, loading order, state usage, and browser requirements where available.
Record production and demo parent chains separately.

**Rationale**: The owner explicitly selected this gate during clarification.
Planning can finish. Baseline acceptance and modernization cannot proceed on demo evidence alone.

**Alternatives considered**: Accept the demo baseline and defer production inputs to adoption.
The owner rejected this option. Do not reintroduce it.

## Research Outcome

No unresolved design choice prevents Phase 1 documentation.
Production inputs and successful build execution remain unverified external prerequisites.
No dependency was installed. No application, theme, build, or test code changed.
