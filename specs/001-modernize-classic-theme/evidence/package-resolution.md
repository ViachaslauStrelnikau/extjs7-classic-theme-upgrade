# Theme Package Resolution Evidence

**Date**: 2026-10-21  
**SDK**: Ext JS `7.7.0.31`  
**Sencha Cmd**: `7.7.0.36`

## Finding

`TestApp/packages/local/theme-classic` is untracked. Its `package.json` sets the package name to
`theme-classic` and the parent to `theme-neptune`. The repository does not record who created this
package or why.

The package remains in the workspace to preserve untracked user files. The selection builds do not
resolve the theme through this package. The generated Cmd build manifest lists the SDK package
`theme-classic` with parent `theme-neutral`. The SDK package maps the alias `ext-theme-classic` to
`theme-classic`.

The selection verifier now reads the generated build `app.json` package graph. It records the chain
from each included package's `extend` value. It fails if a package or parent is missing, if the graph
has a cycle, or if the demo chain changes.

## Build Evidence

Run `package-resolution-20261021` completed replacement and rollback builds in development and
production mode. All four builds exited with code `0`.

| Role | Mode | Resolved chain |
| --- | --- | --- |
| Derived | Development | `theme-classic-modern` → `theme-classic` → `theme-neutral` → `theme-base` |
| Rollback | Development | `theme-classic` → `theme-neutral` → `theme-base` |
| Derived | Production | `theme-classic-modern` → `theme-classic` → `theme-neutral` → `theme-base` |
| Rollback | Production | `theme-classic` → `theme-neutral` → `theme-base` |

The run restored `TestApp/app.json` byte for byte. Its final theme is `ext-theme-classic`. Source
hashes did not change.

See `artifacts/compatibility/selection/package-resolution-20261021/results.json` and its role
manifests and build logs for the local run records. These generated artifacts are ignored by Git.
The records verify package selection and rollback builds. They do not verify browser rendering or
production application compatibility. Production inputs remain missing.

## Evidence Limitation

The earlier `revalidation-final` manifests listed hard-coded parent chains. They did not prove Cmd
package resolution. The revised verifier derives each chain from the generated build manifest.
