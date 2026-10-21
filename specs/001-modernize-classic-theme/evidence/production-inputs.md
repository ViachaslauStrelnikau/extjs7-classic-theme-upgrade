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
Do not accept G0, G1, G2, or modernization while required inputs are missing.
Record received files in the run manifest. Verify each file hash and its source before G0 review.
