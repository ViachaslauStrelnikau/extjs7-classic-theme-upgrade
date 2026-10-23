# Repository Guidelines

## Project Overview and Goal

Develop a modern, interchangeable replacement for the original Ext JS Classic theme. Deliver a reusable Sencha Cmd theme package. Users must select either theme through standard configuration and rebuild. Replacement and rollback must require no changes to application JavaScript, component configurations, or existing custom CSS. Use the demo to verify compatibility.

Repository: [extjs7-classic-theme-upgrade](https://github.com/ViachaslauStrelnikau/extjs7-classic-theme-upgrade.git). This URL is configured as `origin`.

## Verified Target and Configuration

Use Ext JS **7.7.0.31** Classic Toolkit and installed Sencha Cmd **7.7.0.36**. The constitution and specification supersede the earlier 7.3 target. Do not claim 7.3 support.

`TestApp/app.json` selects toolkit `classic` and theme `ext-theme-classic`. This alias identifies `theme-classic`, which extends `theme-neutral`, then `theme-base`. Verify the actual original theme and inheritance for each target application. Classic Toolkit does not identify a theme package.

## Non-negotiable Constraints

- Preserve original CSS and component contracts. Preserve standard `.x-*` selectors, state classes, and Document Object Model (DOM) structures. Keep existing custom CSS effective. Preserve stylesheet order and compatible specificity.
- Preserve dimensions, spacing, positioning, text metrics, scrolling, and layout behavior. Do not introduce additional unintended layout recalculation.
- Preserve public application programming interfaces (APIs), events, interactions, and keyboard behavior.
- Preserve the existing color scheme and semantic color roles. Prevent unintended clipping, overlap, misalignment, broken icons, inconsistent states, and rendering artifacts.
- Use a standard theme package that extends the verified original theme. Prefer existing Sass variables and small, scoped styling changes. Do not deliver a separate CSS overlay or modified application.
- Do not modify framework source, add theme JavaScript overrides, switch theme families, or replace Classic Toolkit. Do not use application-specific workarounds to hide defects.
- Keep replacement and rollback independent of application code. Preserve asset dimensions and existing icon technology.

## Development and Acceptance

Read `.specify/memory/constitution.md` and the relevant specification before changes. Inspect theme inheritance, Sass, CSS, and build configuration. Verify the demo inputs before baseline acceptance or modernization. Production inputs belong to the next independent spec.

Capture the original theme. Establish an equivalent derived theme with no visual changes. Resolve all baseline differences before modernization. Make incremental improvements. Test each change against the original.

Compare screenshots, geometry, computed styles, and behavior under identical conditions. Record browser versions, viewport, fonts, and device pixel ratio. Use development and testing builds for this feature. Do not require production builds here. Distinguish approved visual improvements from unintended defects. Unresolved regressions are defects. Do not accept modernization that fails compatibility checks.

Success requires a standalone, selectable package with a modern, consistent appearance. Required regression tests must pass. Validated scenarios must have no unintended geometry differences, visual defects, CSS incompatibilities, or behavior changes. Verify standard rollback and reuse in compatible Classic applications. Do not claim production compatibility from demo results.

## Repository Structure and Commands

`TestApp/app/` contains views, models, stores, and adjacent SCSS. Assets belong in `TestApp/resources/`. `ext-frame/` and `TestApp/ext/` contain the SDK. Feature details belong in `specs/001-modernize-classic-theme/`.

Run `npm ci` at the root. Use installed Cmd from PowerShell:

```powershell
$themeCmd = Join-Path (Get-Location) 'node_modules/@sencha/cmd-windows/dist/sencha.exe'
Set-Location TestApp
& $themeCmd app refresh
& $themeCmd app build development
& $themeCmd fs web -port=1841 start -map=.
```

Run these commands from `TestApp` to build for testing and start watch mode:

```powershell
..\node_modules\@sencha\cmd-windows\dist\sencha.exe app build testing
..\node_modules\@sencha\cmd-windows\dist\sencha.exe app watch
```

`app watch` serves the development application at `http://localhost:1841/`. The testing build is available at `http://localhost:1841/build/testing/TestApp/`. Use one server on port `1841`. Stop the watcher before controlled compatibility captures.

Historical records show development, production, and testing builds passed without `TestApp/.sencha`. This feature requires development and testing builds only. Do not create replacement metadata without a reproducible need. The earlier Fashion failure did not recur. Its cause remains unknown because its log is absent. Builds report missing navigation theme images. Review these warnings before visual acceptance.

The empty theme package exists at `TestApp/packages/local/theme-classic-modern/`. It extends the verified demo theme and has no visual changes. Historical replacement and rollback records include development and production modes. This feature requires development builds only. Component and legacy CSS source hashes remained unchanged during theme selection and rollback.

Run `npm run test:compatibility` from the repository root for the Node.js evidence checks. The root also provides `compat:compare` and `compat:report`. Set their inputs as described in `specs/001-modernize-classic-theme/quickstart.md`. No root build or lint script is configured.

Playwright Test is not installed as a project dependency. The browser capture suite and `compat:capture` command are incomplete. Browser rendering remains unverified. Production inputs are missing. Baseline acceptance and modernization remain blocked. See `specs/001-modernize-classic-theme/tasks.md` for current task status. Do not claim unverified passes.

## Contribution and Documentation Rules

Use four-space indentation, single-quoted JavaScript strings, and semicolons. Map `Ext.define` names to file paths. Use PascalCase class filenames and camelCase members. No formatter is configured.

Use concise, imperative commit subjects. Pull requests must identify the task, visual goal, comparison screenshots, validation results, risks, and rollback. State blocked checks.

Create a separate Git commit for each completed task before starting the next task. Complete the required checks before the commit. Include the task ID in the commit subject when one exists. Commit only changes for that task. Preserve unrelated user changes.

All new documentation must follow ASD-STE100 principles. Use short sentences, active voice, and consistent terms. Preserve exact identifiers, paths, commands, and API names. Keep detailed implementation plans in feature documents. Record constitutional exceptions and obtain approval before use.
