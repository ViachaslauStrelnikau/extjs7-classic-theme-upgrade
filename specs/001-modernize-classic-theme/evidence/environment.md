# Implementation Environment

**Recorded**: 2026-10-20
**Repository commit**: `5fe483e` on branch `master`
**Working tree**: `AGENTS.md` had a user edit before implementation. The implementation did not change it.

## Tool and SDK Versions

| Tool | Version or value | Evidence |
| --- | --- | --- |
| Ext JS SDK | `7.7.0.31` | `TestApp/ext/version.properties` |
| Sencha Cmd | `7.7.0.36` | Installed Cmd output |
| SDK minimum Cmd | `7.7.0.33` | `TestApp/ext/cmd/sencha.cfg` |
| Node.js | `v24.21.0` | `node --version` |
| npm | `11.6.1` | `npm --version` |
| Java | `1.8.0_501` | `java -version` |
| Operating system | Windows 10 Pro, display version `26H2`, build `26300.9711`, x64 | Windows registry and .NET runtime information |
| Host time zone | `Europe/Minsk` | Session environment |
| Browser test dependency | `@playwright/test` 1.64.1 | `package.json`, `package-lock.json`, `npm ls --depth=0` |

The global Playwright Core package is `1.62.0-alpha-1783623505000`.
Its browser cache contains Chromium `151.0.7922.10` and Firefox `152.0.4`.
The global package is not a project dependency and is not used as project test evidence.

## Project Browser Test Environment

`@playwright/test` is pinned to `1.64.1` in `package.json` and `package-lock.json`.
Its installed browser builds are Chromium `156.0.8078.4` and Firefox `157.0`.
The matching Playwright browser revisions are Chromium `1248` and Firefox `1555`.
Playwright downloads a patched Firefox build. It does not verify the unmodified
Mozilla Firefox distribution, enterprise policies, or extensions used by a production client.
Production browser requirements remain missing. This limitation does not satisfy G0.

The initial npm registry request failed because the environment set `offline=true`.
The pinned package and matching browser binaries were installed after registry access was approved.

## Host Fonts

The Windows font inventory contains Arial, Tahoma, Verdana, and Segoe UI.
The application loads Font Awesome 5 Free through its resources.
The host does not list Font Awesome 5 Free as an installed system font.
The browser capture configuration must set the required test time zone and locale.

## Application Configuration

| Item | Verified value |
| --- | --- |
| Toolkit | `classic` |
| Original app theme | `ext-theme-classic` |
| Resolved theme package | `theme-classic` |
| Parent chain | `theme-classic` → `theme-neutral` → `theme-base` |
| SDK location | `TestApp/ext` |
| Local package search order | `TestApp/packages/local`, then `TestApp/packages` |
| Build definition | `TestApp/build.xml` |
| Application config | `TestApp/app.json` |
| Workspace config | `TestApp/workspace.json` |
| Build commands required by this feature | `sencha app refresh`, `sencha app build development` |
| Existing `.sencha` metadata | Absent; `TestApp/.gitignore` excludes it |

The repository had no Playwright Test dependency or compatibility scripts at this check.
The repository root contains a Git worktree. The feature plan now records this fact.

## Source Hashes

These SHA-256 hashes identify the source before compatibility fixtures or the replacement package were added.
The hashes do not identify generated build output.

| SHA-256 | File |
| --- | --- |
| `0756f2178e38b2096e8ad35a715de0e8fafdc6b3a955755c7cd053f41f939876` | `package.json` |
| `ea99b4021dbe07bd94523d37037a25ff666e58d00d9e408870dcc27a49979475` | `package-lock.json` |
| `01245752c41a195290b40eb68673e95c84005f3cfad0f52d443fe727c1971d2a` | `TestApp/app.json` |
| `36893c787b9c946cfac8e8a9a965c6eb5d020907f1a49f62fd1aea26e8976ff8` | `TestApp/workspace.json` |
| `9fd87f9346a9d2760018a51d6c2e242bfbab765165ed34c39405a1f398ecacfa` | `TestApp/build.xml` |
| `b6f59dc89e3b4c1f9782da281f15d6aa33f44021e1661dffd65093fcd3f417b2` | `TestApp/app.js` |
| `07a9c8ae5d7f65d87309ec57ae16a402b50d3529612244b3fb3af1fdfeb65ef8` | `TestApp/app/Application.scss` |
| `dcc63001b13aaf8680ff6c74fc1863529a1d7b95e7c857b1bf669b9c8ef8b2a6` | `TestApp/app/view/main/Main.js` |
| `019b5d6a45c03df45f59f385024f056ff591f67628d56338d10eeda92402a077` | `TestApp/app/view/main/Main.scss` |
| `16025eecfa1c0ce21b8fc083d526ad5568b349554cb364c354ec7e05a626becb` | `TestApp/app/view/main/MainController.js` |
| `971ce8e4518d5e8a18a546c11d61fb07322546bd06af9d01d52645e32721939a` | `TestApp/app/view/main/MainModel.js` |
| `f44b54987bf37c3aa4e58536dd3cbb0a84f51c6c2a46ac2a959f7480fb865987` | `TestApp/app/view/main/List.js` |
| `cc2e7bb2d77cc9849d768589e46da49ef0caeac2d11782dd6f29787d4f2ccdfd` | `TestApp/ext/version.properties` |
| `991ffeb8a5608b8847262aec5650c4af762bf675decbed516278fcf19d7bbe0a` | `TestApp/ext/cmd/sencha.cfg` |
| `f81017720cb074f07f50519585fd3391bd638def39d07cdec6d9ff9d7a4d514d` | `TestApp/ext/classic/theme-classic/package.json` |

`ext-frame/version.properties` has the same SHA-256 as `TestApp/ext/version.properties`.

## Runtime Evidence

The original-theme development capture completed on 2026-10-21.
Run `viewport-matrix-20261021c` contains 336 captures: 42 states for each of eight
browser, DPR, and viewport environments. The four Playwright projects passed at both
1280x900 and 900x1280. The run records separate geometry, styles, DOM, stylesheet,
interaction, and diagnostics files for each case. It also records the full `capture.json`
and `screenshot.png`.

The capture used Playwright Test 1.64.1, Chromium 156.0.8078.4, and Firefox 157.0.
It used Windows 10.0.26300 x64, locale `en-US`, time zone `UTC`, and fonts Arial,
Tahoma, Verdana, and Segoe UI. The requested and actual DPR values were 1 and 2.
The capture checked viewport and screenshot dimensions for each state.
See [the environment records](../../../artifacts/compatibility/viewport-matrix-20261021c/environments.json)
and [the suite results](../../../artifacts/compatibility/viewport-matrix-20261021c/suite-results.json).

Chromium records `Performance.getMetrics` deltas. Firefox records layout-shift entries.
Firefox does not report every layout pass through this method. The comparison must block
the affected acceptance check.

The initial dual-viewport run failed because 48 grid rows did not overflow at the tall viewport.
The run and failure traces remain in `artifacts/compatibility/viewport-matrix-20261021/`.
The shared fixture now has 64 deterministic rows. Standard selection and rollback builds
passed in both modes under `fixture-refresh-20261021f`. The current run uses those outputs.

The capture uses only the original theme in development. It does not contain an original
repeat, derived comparison, or production capture. Production inputs remain missing.
G0 is blocked. G1 and G2 are not accepted. The standard original-theme builds passed;
see [build recovery](build-recovery.md).

A prior probe with the global Playwright package returned `spawn EPERM`. The project-pinned
Playwright later launched and completed the capture. The earlier local browser probe showed
a blank page. Its cause remains unknown. Neither probe changes the current capture results.
