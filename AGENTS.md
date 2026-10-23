# Repository Guidelines

## Project Structure & Module Organization

- `TestApp/` contains the Ext JS Classic demo. Application classes are in `app/`, grouped into `view`, `model`, and `store`. View styles sit beside JavaScript files; assets belong in `resources/`.
- `ext-frame/` and `TestApp/ext/` contain the supplied Ext JS SDK. Do not edit framework files.
- `specs/001-modernize-classic-theme/` contains the specification, plan, tasks, and validation contracts. The theme package and compatibility harness are planned, not implemented.
- `.specify/memory/constitution.md` defines compatibility requirements. Read it before theme work.

## Build, Test, and Development Commands

Run `npm ci` from the repository root to install locked dependencies. The root `package.json` has no build, test, or lint scripts.

Use the installed Sencha Cmd executable from PowerShell:

```powershell
$themeCmd = Join-Path (Get-Location) 'node_modules/@sencha/cmd-windows/dist/sencha.exe'
Set-Location TestApp
& $themeCmd app refresh
& $themeCmd app build development
& $themeCmd fs web -port=1841 start -map=.
```

These commands refresh metadata, build the development demo, and serve it. Build recovery is pending because `TestApp/.sencha` is absent. Follow the feature's `quickstart.md`; these commands do not establish a working baseline.

## Coding Style & Naming Conventions

Match existing JavaScript and SCSS: four-space indentation, single-quoted JavaScript strings, and semicolons. Map `Ext.define` names to file paths, such as `TestApp.view.main.Main` to `app/view/main/Main.js`. Use PascalCase class filenames and camelCase members. No formatter or linter is configured.

Use short, direct English in documentation. Prefer theme Sass variables before custom rules. Preserve geometry, font metrics, DOM structure, and `.x-*` selectors. Do not add theme JavaScript overrides.

## Testing Guidelines

No application test framework or numeric coverage threshold is configured. Playwright Test and `compat:*` scripts are planned; do not report them as runnable. Follow the compatibility contract for stable case identifiers and required component coverage. Compare original, replacement, and rollback builds for screenshots, geometry, computed styles, and interactions. Record browser, viewport, and device pixel ratio. Use development and testing builds for this feature. Do not require production builds here.

## Commit & Pull Request Guidelines

There is no commit history yet. Use concise, imperative commit subjects, such as `Add baseline grid fixtures`. Keep changes focused. Pull requests should link the relevant task or issue, describe the visual goal, include comparison screenshots and validation results, and explain risks and rollback. Record blocked checks explicitly.