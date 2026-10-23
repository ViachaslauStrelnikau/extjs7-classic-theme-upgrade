# Production Inputs

**Recorded**: 2026-10-20
**G0 status**: `blocked`
**Input status**: `missing`

The repository contains the `TestApp` demo. It does not contain the production application inputs required for G0.
Demo files do not prove production compatibility.

| Required input | Status | Required source or owner | Acceptance evidence |
| --- | --- | --- | --- |
| Production CSS files and content hashes | Missing | Production application maintainer; provide the deployed source files or an approved source archive | File paths and SHA-256 hashes |
| Stylesheet loading order, including inline styles | Missing | Production application maintainer; provide the application entry points and build output | Ordered stylesheet URLs and hashes from the production build |
| Active theme package and complete parent chain | Missing | Production application maintainer; provide the production `app.json`, workspace package paths, and SDK package metadata | Verified package identities and `extend` chain |
| Component and configuration inventory | Missing | Production application maintainer; provide the application source or an approved component inventory | Component types and `xtype`, `ui`, `cls`, and `bodyCls` use |
| State and interaction inventory | Missing | Production application maintainer; provide production workflows and supported state use | Mapped states, actions, and expected outcomes |
| Browser requirements | Missing | Production application owner; provide the supported browser and version matrix | Exact browser versions and supported DPR values |
| Reviewer and input approval | Missing | Production application owner | Reviewer identity, date, and verified input hashes |

Do not replace these inputs with demo evidence.
Do not accept production readiness or adoption while required inputs are missing.
Keep demo work within the scope and approvals recorded for this feature.
Record received files in the run manifest. Verify each file hash and its source before G0 review.

## Current Scope

**Recorded**: 2026-10-21

The project owner directed implementation to focus on the `TestApp` demo.
No production files or inventory were supplied with this direction.
Keep G0 blocked and T033 incomplete.
Use demo evidence only for demo work. Do not claim production compatibility.

## Scope Update

**Recorded**: 2026-10-23

The project owner directed the team to omit production inputs and production validation from this
feature. Carry them to the next independent spec. This direction supersedes the earlier instruction
to keep T033 active in this feature. See [deferred production scope](deferred-production-scope.md).

G0 remains blocked for production readiness. It is not an active input collection task for this
demo feature. Do not use the `TestApp` theme chain as production evidence.
