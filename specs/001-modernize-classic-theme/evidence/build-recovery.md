# Standard Build Recovery Evidence

**Recorded**: 2026-10-20
**SDK**: Ext JS `7.7.0.31`
**Sencha Cmd**: `7.7.0.36`
**Application**: Existing `TestApp`

## Initial State

`TestApp/.sencha` was absent. `TestApp/.gitignore` excludes `.sencha`.
The workspace root did not contain `sencha-error-20261020.log`.
No Sencha log file was present under `TestApp` when recovery started.
The previously reported Fashion failure therefore has no available log evidence in this worktree.
Its original cause is unknown.

## Recovery Commands and Results

Run the supported Cmd install command from `TestApp`:

```powershell
& $themeCmd app install
```

The command exited with code 0. It reported that it used the existing workspace.
It created no `.sencha` files. It did not change `app.json`, application Sass, workspace configuration, or the build definition.
See `artifacts/compatibility/preflight/app-install.log`.

Run the standard refresh and development build from `TestApp`:

```powershell
& $themeCmd app refresh
& $themeCmd app build development
```

| Command | Exit code | Log |
| --- | ---: | --- |
| `sencha app refresh` | 0 | `artifacts/compatibility/preflight/app-refresh.log` |
| `sencha app build development` | 0 | `artifacts/compatibility/preflight/build-development.log` |

The development build completed Fashion compilation and wrote output to `TestApp/build/development/TestApp`.
The historical production build also exited with code 0 and wrote output to `TestApp/build/production/TestApp`.
See `artifacts/compatibility/preflight/build-production.log`. This feature does not require production mode.
Cmd reported missing theme image paths during Fashion compilation. Review these warnings before screenshot acceptance.

## Finding and Limit

The existing application refreshes and builds without `.sencha` metadata.
No required `.sencha` file was identified. Do not create replacement metadata without evidence that Cmd requires it.
The earlier Fashion exit code 1 did not recur. The available repository does not establish why it occurred.
Keep the historical cause unresolved until its original log or a reproducible failure is available.

The required standard workflow now works for the original theme in development mode.
The historical production build is informational and is not part of this feature's required workflow.
This result does not prove browser loading, visual equivalence, G0, G1, or G2.
