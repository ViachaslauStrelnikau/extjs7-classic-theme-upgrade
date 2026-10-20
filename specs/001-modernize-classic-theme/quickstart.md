# Validation Quickstart

**Status**: Future validation guide. The package and harness are not implemented.
Commands that use planned npm scripts become runnable only after implementation.
No build or test pass is claimed.

## 1. Check Prerequisites

Use the existing repository and `TestApp`. Do not generate another application.
Use SDK 7.7.0.31 and recorded Cmd 7.7.0.36.
Verify a working Java environment and record exact runtime versions.
Pin Playwright Test during implementation and install its matching Chromium and Firefox binaries.
After the dependency and lockfile exist, install the test environment from the repository root:

```powershell
npm ci
npx --no-install playwright install chromium firefox
```

Obtain actual production CSS, stylesheet order, theme inheritance, and component inputs.
Map them to the cases and verify them with the reviewer.
If these inputs are absent, G0 is BLOCKED.
Provisional preparation may continue. Baseline acceptance and modernization must wait.

## 2. Recover the Standard Build

`TestApp/.sencha` is absent in the inspected repository.
The existing generation log records a Fashion failure.
Investigate the root cause. Recover standard metadata through supported Cmd tools and templates.
Preserve the existing application, component source, legacy CSS, and SDK.
Do not run a new-app generator over this application or introduce a custom build system.
Record the recovery method and changed metadata before G1.

From the repository root, select the installed Cmd executable:

```powershell
$themeRepository = (Get-Location).Path
$themeCmd = Join-Path $themeRepository 'node_modules/@sencha/cmd-windows/dist/sencha.exe'
Set-Location (Join-Path $themeRepository 'TestApp')
& $themeCmd app refresh
& $themeCmd app build development
```

Run these commands after metadata recovery. They are not a claimed recovery procedure.
Stop on nonzero exit. Save full logs. Verify the generated output uses the original theme.
The original demo selection is `"theme": "ext-theme-classic"`.

Serve `TestApp` through the standard Cmd static server in a separate terminal.
Set `$themeRepository` and `$themeCmd` there with the same initialization commands above.
The local Cmd build template documents the `fs web` form:

```powershell
& $themeCmd fs web -port=1841 start -map=.
```

Start it from `TestApp`. Use `http://localhost:1841/` for development capture.
Confirm server syntax with installed Cmd help during implementation.
Do not run a build watcher during captures.

## 3. Capture the Original Twice

Freeze shared demo cases, data, and legacy styles first.
Record source hashes. The later theme selection must not change those files.
From the repository root, use the planned harness interface:

```powershell
Set-Location $themeRepository
$env:COMPAT_RUN = 'baseline-001'
$env:COMPAT_PHASE = 'baseline'
$env:COMPAT_BUILD_MODE = 'development'
$env:COMPAT_BASE_URL = 'http://localhost:1841/'
$env:COMPAT_THEME = 'original'
npm run compat:capture
$env:COMPAT_THEME = 'original-repeat'
npm run compat:capture
```

Expected: Both original captures have stable geometry, styles, interactions, and images.
Use all four projects and both viewport cases from the harness contract.
If the original captures differ, fix the measurement conditions before derived-theme comparison.
Do not round measurements or hide a difference with a tolerance.

## 4. Select the Empty Derived Package

During implementation, generate `theme-classic-modern` with the standard theme generator.
Use the verified parent chain. Initially add no paint rules or replacement assets.
See [theme-package.md](contracts/theme-package.md).

Change only the standard `theme` selection to `theme-classic-modern`.
From `TestApp`, run `app refresh` and `app build development` through `$themeCmd`.
Stop on failure. Verify the loaded manifest and stylesheet hashes.
From the repository root, capture with the same run and environment:

```powershell
$env:COMPAT_THEME = 'derived'
npm run compat:capture
```

Expected: Appearance, geometry, computed styling, CSS fixtures, and behavior match the original.
Do not accept this baseline until G0 is verified and all required comparisons pass.

## 5. Verify Rollback and Compare

Restore the recorded original `theme` value.
Refresh and rebuild through Cmd. Do not edit components, scripts, or legacy CSS.
Then run from the repository root:

```powershell
$env:COMPAT_THEME = 'rollback'
npm run compat:capture
npm run compat:compare
npm run compat:report
```

Expected: Rollback matches the original. Source hashes are unchanged.
All required categories pass. G0 and G1 evidence permit G2 acceptance.
If G0 is missing, the report must remain blocked even when demo comparisons match.

## 6. Validate Modernization and Release

Start only after G2 passes. Define and approve one change group.
Apply groups in FR-026 order. Build with the replacement selected.
Use a new `COMPAT_RUN`, set `COMPAT_PHASE` to `modernization`, and set `COMPAT_THEME` to `modernized`.
Link immutable original references and the approved goal in the run manifest.
Capture, review images, verify rollback, compare, and report.
Do not update the original baseline to make a modernization difference disappear.

Repeat with `app build production` and `COMPAT_BUILD_MODE=production`.
Serve its actual generated page and set `COMPAT_BASE_URL` to that page.
Use an original/replacement/rollback production pair and the full matrix.
Do not compare development evidence to production evidence as one pair.

Expected: Approved paint differences only. No unapproved geometry or CSS contract differences.
No behavior differences, missing required coverage, clipping, or asset failures.
Each accepted group must pass before the next group starts.

The final report must map all 14 acceptance criteria to evidence.
Record test conditions, approvals, risks, production limitations, and rollback results.
Use [compatibility-harness.md](contracts/compatibility-harness.md) for command and evidence details.
Stop this workflow at the first failed or blocked acceptance gate.
