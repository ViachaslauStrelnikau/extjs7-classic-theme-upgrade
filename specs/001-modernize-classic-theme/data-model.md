# Evidence Data Model

**Purpose**: Define test evidence. Application database models are not required.

Use JavaScript Object Notation (JSON) for machine-readable records.
Use stable string identifiers. Do not use generated element IDs as case identifiers.
Use ISO 8601 timestamps and SHA-256 file hashes.
Version records with `schemaVersion`.

## ProductionInputSet

Fields: `inputSetId`, `sdkVersion`, `activeTheme`, `parentChain`, `cssFiles`, `stylesheetOrder`,
`componentInventory`, `stateInventory`, `browserRequirements`, `sourceHashes`, `reviewer`, `status`.

CSS entries identify paths and content hashes. Inventory entries map to comparison cases.
Status values: `missing`, `received`, `verified`, `rejected`.
Only `verified` can satisfy G0. Record missing browser requirements as a coverage dependency.
Changed input hashes invalidate dependent approval.

## Environment

Fields: `environmentId`, `sdkVersion`, `cmdVersion`, `nodeVersion`, `playwrightVersion`,
`browserEngine`, `browserVersion`, `browserMode`, `osVersion`, `fonts`, `viewport`, `zoom`,
`requestedDpr`, `actualDpr`, `locale`, `timezone`, `buildMode`.

Require SDK `7.7.0.31`. Record actual DPR and screenshot pixel dimensions.
Pair only equivalent environments. Different browsers and build modes need separate references.

## ThemeBuild

Fields: `buildId`, `themeRole`, `packageName`, `packageVersion`, `parentChain`, `sourceHashes`,
`fixtureHash`, `inputSetId`, `buildMode`, `command`, `exitCode`, `logPath`, `outputHashes`.

Theme roles: `original`, `derived`, `modernized`, `rollback`.
The derived baseline has no authored paint rules or replacement assets.
Require a successful exit and verified output identity before capture.
Shared fixture hashes must match within each pair.

## ComparisonCase

Fields: `caseId`, `componentFamily`, `fixtureReference`, `dataHash`, `states`, `targetElements`,
`actions`, `expectedOutcomes`, `legacySelectors`, `protectedProperties`, `pseudoElements`.

Identify roots and layout-sensitive children through stable case mappings.
Do not add theme-specific application configurations.
Map every required component family and applicable state to cases.
Production inputs add cases without removing required demo coverage.

## Capture

Fields: `captureId`, `runId`, `buildId`, `environmentId`, `caseId`, `state`, `timestamp`,
`geometry`, `computedStyles`, `dom`, `stylesheets`, `interactions`, `screenshotPath`, `diagnostics`.

Geometry includes unrounded bounding rectangles and client, offset, and scroll dimensions.
Styles include protected values, paint values, and applicable `::before` and `::after` values.
DOM records retain hierarchy and standard classes. Normalize only generated instance identity.
Record stylesheet URLs, hashes, and inline order.
Record expected and actual interaction outcomes, missing assets, and page errors.

## ChangeGroup

Fields: `changeId`, `sequence`, `visualGoal`, `affectedCases`, `variableChanges`, `ruleChanges`,
`assetChanges`, `riskAssessment`, `testMethod`, `rollbackMethod`, `approval`, `evidenceIds`, `status`.

Status sequence: `proposed` → `approved` → `implemented` → `validated` → `accepted`.
A failure moves the group to `rejected`. Preserve failed evidence.
Do not implement paint before G2. Do not start the next group before acceptance.
Approval identifies reviewer, scope, and date. Goal approval does not approve failing tests.

## ComparisonResult

Fields: `resultId`, `originalCaptureId`, `candidateCaptureId`, `changeId`, `geometry`, `css`,
`behavior`, `visual`, `unexpectedDifferences`, `coverageGaps`, `approvalIds`, `evidencePaths`.

Category status values: `pass`, `fail`, `blocked`, `not-run`.
Unsupported required coverage is blocked or failed coverage. It is never a pass.
Paint changes require a matching approved goal.
Geometry and CSS exceptions require prior scoped approval. Behavior differences cannot pass.
Allowed paint differences do not suppress protected-property failures.

## GateRecord and Relationships

Fields: `gateId`, `status`, `inputSetId`, `buildIds`, `resultIds`, `reviewer`, `timestamp`, `reason`.

One input set has many cases and builds. Each build has many captures.
Each result links two captures of the same case and environment.
Each gate links evidence rather than copied pass summaries.

G0 requires verified production inputs.
G1 requires the original build and stable original captures.
G2 requires G0, G1, and complete equivalent derived results.
G3 requires G2 and accepted results for one approved change group.
G4 requires accepted groups, acceptance traceability, and rollback evidence.
Gate status values: `not-run`, `blocked`, `failed`, `passed`.
Changed dependencies invalidate later approvals until affected checks pass again.
