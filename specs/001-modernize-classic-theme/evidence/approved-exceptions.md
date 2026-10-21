# Approved Exception: Demo-Only Visual Work

**Date**: 2026-10-21
**Constitution**: 2.0.0
**Status**: Approved for the scope below

## Approval

The project owner approved skipping the production check in this conversation on 2026-10-21.
This approval permits visual work for `TestApp` only.

## Scope

Use the verified `TestApp` theme chain:
`theme-classic-modern` → `theme-classic` → `theme-neutral` → `theme-base`.
Do not wait for production CSS, theme inheritance, component inventory, state inventory, or browser requirements.
Keep G0 blocked. Do not treat demo evidence as production evidence.

## Reason

The project owner wants to see the modern theme in the existing demo before production inputs are available.

## Risks

The production application can use different styles, theme inheritance, components, states, and browsers.
Demo results cannot prove production compatibility.
Firefox layout-shift records do not measure every layout pass. Keep affected layout acceptance blocked.

## Required Checks

Build the original and replacement through standard Sencha Cmd commands.
Compare the demo in the configured Chromium and Firefox projects at both viewports and device pixel ratios.
Check geometry, protected computed styles, existing CSS, component states, interactions, clipping, and rollback.
Record unsupported or incomplete checks as blocked. Do not report them as passes.

## Rollback

Set `TestApp/app.json` to `ext-theme-classic` and rebuild the app.
Do not change application JavaScript or existing CSS to roll back.

## Limits

This exception does not amend the constitution or specification.
It does not pass G0, accept a production baseline, approve production use, or permit a production compatibility claim.
