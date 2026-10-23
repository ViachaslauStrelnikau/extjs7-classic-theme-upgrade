# Validation Quickstart

**Status**: The selectable package, evidence checks, and browser capture runner exist.
This quickstart covers the `TestApp` demo. The T046 paint group and T084 toolbar change have
demo-only approvals. Production inputs and validation belong to the next independent spec.
Do not treat demo evidence as production evidence.

## 1. Check Prerequisites

Use the existing repository and `TestApp`. Do not generate another application.
Use SDK 7.7.0.31 and recorded Cmd 7.7.0.36.
Verify a working Java environment and record exact runtime versions.
The repository pins Playwright Test 1.64.1 and its matching Chromium and Firefox binaries.
The browser launch and capture workflow were verified on this host.
Do not use a global Playwright install as a project dependency.
After the exact dependency and lockfile exist, install the test environment from the repository root:

```powershell
npm ci
npx --no-install playwright install chromium firefox
```

Do not obtain or test production inputs in this feature. Record them for the next independent spec.
G0 remains blocked for production readiness. This does not block demo-only implementation work.
The project owner approved the T046 demo-only G2 sequencing exception in
[approved exceptions](evidence/approved-exceptions.md).
The owner also approved the T084 toolbar change for `TestApp`. Use the original Classic theme as
the geometry and behavior reference. These exceptions do not pass G0, G1, G2, or G3.
Do not claim production compatibility or extend either approval to another change group.

## 2. Recover the Standard Build

`TestApp/.sencha` is absent and `TestApp/.gitignore` excludes it.
The standard `sencha app install` command exited with code 0. It created no `.sencha` files.
The standard refresh and development demo build also exited with code 0 without `.sencha`.
This feature requires development mode only. Historical production-mode logs remain in the build evidence.
Do not create replacement metadata unless a reproducible Cmd failure requires it.
The earlier Fashion failure log is absent from this worktree. Its cause is unknown.
See [build recovery evidence](evidence/build-recovery.md).

From the repository root, select the installed Cmd executable:

```powershell
$themeRepository = (Get-Location).Path
$themeCmd = Join-Path $themeRepository 'node_modules/@sencha/cmd-windows/dist/sencha.exe'
Set-Location (Join-Path $themeRepository 'TestApp')
& $themeCmd app refresh
& $themeCmd app build development
```

Run these commands from `TestApp`.
Stop on nonzero exit. Save full logs. Verify the generated output uses the selected theme.
The original demo selection is `"theme": "ext-theme-classic"`.
This command builds the development demo only. It does not test production inputs.

Run the dependency-free evidence checks from the repository root:

```powershell
npm run test:compatibility
```

The current check ran 54 tests. All 54 tests passed.
This suite does not launch a browser or prove theme compatibility.

The root `compat:capture`, `compat:compare`, and `compat:report` commands exist.
The latest [preflight report](../../artifacts/compatibility/preflight-final-20261020/compatibility-report.md) is blocked.

To build the replacement and restore the original theme, run this guarded check from the repository root:

```powershell
pwsh -NoLogo -NoProfile -File tests/compatibility/verify-selection.ps1 -RunId selection-check-001
```

The script runs standard Cmd refresh and build commands.
It records logs, manifests, and hashes under `artifacts/compatibility/selection/selection-check-001/`.
It restores `TestApp/app.json` byte for byte.
It does not capture or compare browser output.

Serve the development build from `TestApp` through the standard Cmd static server.
Set `$themeRepository` and `$themeCmd` there with the same initialization commands above.
The local Cmd build template documents the `fs web` form:

```powershell
& $themeCmd fs web -port=1841 start -map=.
```

Start it from `TestApp`. Use `http://localhost:1841/` for development capture.
The implementation verified this URL with HTTP status `200` and page title `TestApp`.
Do not run a build watcher during captures.

The original-theme development capture passed all four browser and DPR projects.
The `viewport-matrix-20261021c` run recorded 42 states at each of 1280x900 and 900x1280.
It stores separate project and viewport directories under `artifacts/compatibility/`.
Each case has a full `capture.json`, six field JSON files, and a screenshot.
This run proves the demo capture path. It does not prove production compatibility.
Firefox captures do not measure every layout pass. The comparator blocks that acceptance check.
G0 remains blocked for production readiness and is deferred to the next independent spec.
G1 and G2 remain blocked by unstable original layout observations and incomplete Firefox
layout-work evidence. The approved exceptions permit only the specified demo changes. They do not
accept the baseline, either change group, or production compatibility.

## 3. Capture the Original Twice

Freeze shared demo cases, data, and legacy styles first.
Record source hashes. The later theme selection must not change those files.
Use this capture sequence from the repository root:

```powershell
Set-Location $themeRepository
$env:COMPAT_RUN = 'baseline-001'
$env:COMPAT_PHASE = 'baseline'
$env:COMPAT_BUILD_MODE = 'development'
$env:COMPAT_BASE_URL = 'http://localhost:1841/'
$env:COMPAT_SELECTION_RUN = 'selection-check-001'
$env:COMPAT_THEME = 'original'
npm run compat:capture
$env:COMPAT_THEME = 'original-repeat'
npm run compat:capture
```

Expected: Both original captures have stable geometry, styles, interactions, and images.
The runner uses four Playwright projects and both viewport cases.
Each environment directory includes the browser project and viewport, such as
`chromium-dpr1-1280x900` or `firefox-dpr2-900x1280`.
Use the raw environment records to confirm browser version, DPR, fonts, and viewport.
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
Do not accept this baseline until the demo G1 and G2 evidence passes. The current gate model also
requires G0, which remains deferred. Keep G2 blocked until the next independent spec verifies G0.

## 5. Verify Rollback and Compare

Restore the recorded original `theme` value.
Refresh and build development through Cmd. Do not edit components, scripts, or legacy CSS.
Then run from the repository root. Set `COMPAT_SELECTION_RUN` to the selection evidence run ID.

```powershell
$env:COMPAT_THEME = 'rollback'
npm run compat:capture
$env:COMPAT_SELECTION_RUN = 'selection-check-001'
npm run compat:compare
npm run compat:report
```

Expected: Rollback matches the original. Source hashes are unchanged.
All required demo categories and G0 must pass before G2 acceptance. G0 remains deferred to the next
independent spec. Keep G2 blocked until that spec verifies production inputs.

## 6. Validate Modernization and Release

Normally, start after G2 passes. The only approved exception covers the existing T046 group
in `TestApp`. Keep the original `ext-theme-classic` captures as the reference. The exception
does not accept G2 or G3, approve modernized screenshots, or cover production. Do not start a
later group until T046 is accepted.

Define each change group in
`artifacts/compatibility/<run>/approvals.json` before edits. Record its goal, scope, affected cases,
variable and asset changes, risks, tests, rollback, reviewer, and date. Obtain reviewer approval.
Do not treat a planned goal as approval.
Apply groups in FR-026 order. Build with the replacement selected.
Use a new `COMPAT_RUN`, set `COMPAT_PHASE` to `modernization`, and set `COMPAT_THEME` to `modernized`.
Link immutable original references and the approved goal in the run manifest.
Capture, review images, verify rollback, compare, and report.
Do not update the original baseline to make a modernization difference disappear.

Production acceptance is outside this quickstart. The next independent spec will verify production
inputs and set its browser matrix and validation modes. Keep its references separate from
development demo references. Do not run production builds in this feature.

Expected: Approved paint differences only. No unapproved geometry or CSS contract differences.
No behavior differences, missing required coverage, clipping, or asset failures.
Each accepted group must pass before the next group starts.

The final report must map all 14 acceptance criteria to evidence.
Record test conditions, approvals, risks, production limitations, and rollback results.
Use [compatibility-harness.md](contracts/compatibility-harness.md) for command and evidence details.
Stop this workflow at the first failed or blocked acceptance gate.
