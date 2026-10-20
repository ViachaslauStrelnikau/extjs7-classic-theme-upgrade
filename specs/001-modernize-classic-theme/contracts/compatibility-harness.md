# Compatibility Harness Contract

**Status**: Proposed commands and evidence formats. No harness script exists yet.
Use this contract during implementation. Do not report these commands as tested.

## Commands

Add these root npm scripts during implementation:

| Script | Planned implementation | Result |
| --- | --- | --- |
| `compat:capture` | Playwright with `tests/compatibility/playwright.config.js`; required suites as defined below | Raw evidence and compatibility assertions |
| `compat:compare` | Node.js `tests/compatibility/compare.mjs` | Categorized comparison results |
| `compat:report` | Node.js `tests/compatibility/report.mjs` | Acceptance and limitation report |

Helpers operate on evidence. They MUST NOT replace Cmd builds or modify theme configuration.

During US2, `compat:capture` MUST run `capture.spec.js`.
After US3 integration, it MUST also run `css-contract.spec.js` and `interactions.spec.js`.
Use test discovery or explicit inclusion through the same configuration.
Record each suite's identity, completion status, and evidence in the selected run.
Missing required suite results MUST fail comparison.
US3 acceptance and all modernization checks require all three suites.
Test command discovery and missing-suite rejection before US3 acceptance.

| Environment variable | Required value |
| --- | --- |
| `COMPAT_RUN` | Unique safe run identifier; reject path separators and traversal |
| `COMPAT_THEME` | Capture role: `original`, `original-repeat`, `derived`, `modernized`, or `rollback` |
| `COMPAT_PHASE` | `baseline` or `modernization` |
| `COMPAT_BUILD_MODE` | `development` or `production` |
| `COMPAT_BASE_URL` | URL for the selected standard build; no query-based theme switch |

`original-repeat` uses the original package and tests measurement repeatability.
Comparison uses all relevant role directories in the selected run and build mode.
For baseline, require original, original-repeat, derived, and rollback evidence.
For modernization, require immutable original references, modernized captures, and rollback evidence.
Each change group references its approved goal and exact build identity.
Reject missing or mismatched manifests. Never silently overwrite an existing capture role.

Use exit code 0 for complete passing comparisons.
Use a nonzero code for failures, invalid input, blocked gates, or missing required evidence.
Report generation may still produce a diagnostic report for a failed run.
It MUST preserve the run's failing status.

## Environment and Readiness

Use projects `chromium-dpr1`, `chromium-dpr2`, `firefox-dpr1`, and `firefox-dpr2`.
Add verified production-required browser environments to this minimum matrix.
Record exact browser versions, supported DPR settings, and separate references.
Block affected acceptance when required browser coverage is unavailable.
Fix host, fonts, browser versions, browser mode, viewport, zoom, locale, and time zone.
Verify actual DPR and PNG pixel dimensions.
Keep references separate by browser, build mode, and environment.
Record unsupported combinations as coverage gaps. Never turn a gap into a pass.

Build sequentially. Run captures only after the build exits successfully.
Serve output without a watcher. Start a fresh browser context for each capture.
Check the loaded manifest, theme, generated CSS hashes, and source hashes.
Reject stale output or unexpected asset responses.

Wait for framework and application readiness, loaded fonts, loaded images, and the required state.
Require stable measurements across consecutive animation frames.
Do not use arbitrary sleep durations as proof of readiness.
Do not inject test CSS or monkey-patch layout to suppress failures.

## Measurement and Comparison Rules

Measure component roots and sensitive children: headers, cells, text, triggers, icons, and floats.
Capture exact `getBoundingClientRect()` values and client, offset, and scroll metrics.
Compare protected computed properties from FR-009 and FR-010 exactly within an environment pair.
Record the full computed property map to detect unclassified changes.
Compare visible `::before` and `::after` properties where applicable.
Flag new or unclassified differences for review. Do not silently allow them.

Record layout observations in `diagnostics.json` through the method defined in `plan.md`.
Compare repeated originals and the replacement during identical recorded actions.
Keep initial rendering separate from interaction measurements.
Unresolved additional layout work or missing required observations MUST block acceptance.
Report layout observations separately from final geometry equality.

Preserve DOM hierarchy, standard classes, state classes, and interaction outcomes.
Normalize generated instance IDs only. Record normalization rules with the evidence.
Do not strip semantic attributes or all classes to simplify a comparison.
Theme package identity and generated URLs may differ. Record those changes separately.
Do not normalize away changes to legacy selector behavior or stylesheet order.

Assert expected effective values for standard, nested, and state CSS fixtures.
Record ordered stylesheet URLs, content hashes, and inline stylesheets.
Check keyboard focus, validation results, grid data and selection, open menus, scrolling,
collapse state, drag positions, window size, and post-resize layout.
Map every required component family and applicable state from the specification to a case.

Use zero geometry tolerance. Reject an unstable original setup rather than rounding it.
Preserve failures across reruns. A rerun does not erase the original failure.
Initial screenshots require zero unexplained differences.
Modernized screenshots require approved references and per-case visual goals.
Keep original, actual, and difference images. Do not auto-approve reference updates.

## Evidence Layout

Use `artifacts/compatibility/<run>/<build-mode>/<role>/<project>/<case>/<state>/`.
Angle-bracket names identify path fields. They are not literal directory names.

Run-level files: `production-inputs.json`, `cases.json`, `approvals.json`, `gates.json`.
Role-level files: `manifest.json`, `build.log`.
Case files: `geometry.json`, `styles.json`, `dom.json`, `stylesheets.json`,
`interactions.json`, `diagnostics.json`, and `screenshot.png`.
Comparison files: `results.json`, difference images, failure traces, and `report.html`.
Final document: `compatibility-report.md` with AC-001 through AC-014 evidence links.
See [data-model.md](../data-model.md) for record fields and validation.

Keep separate statuses for visual, geometry, behavior, and CSS compatibility.
G0 failure blocks baseline acceptance even if provisional demo measurements pass.
G2 failure blocks every modernization group.
No approved screenshot can override another failing result category.
