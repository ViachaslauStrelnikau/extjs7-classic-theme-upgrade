# Theme Package Contract

**Status**: Active implementation contract. The empty package has been generated. Build selection remains unverified.

## Package Identity and Dependencies

Use package name `theme-classic-modern` and toolkit `classic`.
Support only Ext JS 7.7.0.31.
Generate the package through the installed Sencha Cmd theme generator.
Use the metadata shape emitted by the installed Cmd theme generator.
Set root `name` to `theme-classic-modern`.
Set `sencha.type` to `theme`, `sencha.toolkit` to `classic`, and `sencha.sass.namespace` to `Ext`.
Set `sencha.extend` to the verified parent package.
The generated `overrides/init.js` may set the theme identity. Do not add component override classes or application behavior.
Do not use `compatVersion` as a claim of support for other SDK versions.

Location: `TestApp/packages/local/theme-classic-modern`.
Parent candidate for this demo: `theme-classic`.
Record and verify the actual production parent before finalizing `extend`.
If the chains differ, stop baseline acceptance and resolve package scope.
Do not silently substitute another theme architecture.

Keep required generated support metadata and slicing files.
Use `sass/var` for variables and minimal `sass/src` for component rules.
Keep `sass/etc` when required. Use `resources` for incremental asset replacements.
The first derived version has no paint overrides and no replacement assets.

## Selection Interface

The user changes only the standard `theme` value in the application's `app.json`.
For the current demo, the original value is `ext-theme-classic`.
The replacement value is `theme-classic-modern`.
Preserve the recorded original value for rollback.

Refresh package resolution when required, then use standard Cmd application builds.
The application build compiles theme sources. Do not require a separate runtime CSS overlay.
A standalone package build may verify packaging, but does not replace application acceptance tests.
This follows the standard theme selection and application build model.
[Sencha theming guide](https://docs.sencha.com/extjs/7.7.0/guides/core_concepts/theming.html)

## Application Contract

Preserve component configurations, public APIs, DOM hierarchy, `.x-*` classes, and state names.
Preserve `xtype`, `ui`, `cls`, `bodyCls`, and event handlers.
Do not add new theme JavaScript or require application JavaScript changes for selection.
Retain parent-provided framework overrides through normal inheritance.
Do not modify framework files.

Preserve font metrics and all protected geometry properties from FR-009 and FR-010.
Keep application CSS loading order and effective legacy declarations compatible.
Do not add root selectors or specificity that defeat existing overrides.
Any `!important` rule requires prior documented approval.

Shared demo coverage may grow before baseline capture.
Keep identical fixture source, data, and legacy rules under each theme.
Do not add replacement-only patches or new UI configurations to make tests pass.

## Asset Contract

Inherit all assets initially. Change one asset or small asset group at a time after G2.
Preserve rendered dimensions, required paths, sprite regions, background positions, and alignment.
Record intrinsic dimensions separately from rendered dimensions.
Verify DPR 1 and 2, clipping, and network loading.
Keep the existing icon technology. Do not change DPR or zoom through CSS.

## Rollback and Release

Restore the recorded original `theme` value. Refresh when required and rebuild.
Do not edit component code, scripts, or legacy CSS.
Verify original geometry, computed styling, screenshots, and interactions after rollback.
Hash application source and legacy CSS before selection and after rollback.
Build timestamps can differ. Compare semantic results and record generated output identities.

Deliver the package source with required Cmd metadata and resources.
Exclude demo code, test harness code, production input copies, and test evidence from the package.
Keep SDK files external to this deliverable.
Require all 14 acceptance criteria and evidence links before release approval.
