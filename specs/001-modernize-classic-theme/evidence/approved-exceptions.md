# Approved Exception: Demo-Only Visual Work

**Date**: 2026-10-21
**Constitution**: 2.0.0
**Status**: Approved for the scope below

## Approval

The project owner approved skipping the production check in this conversation on 2026-10-21.
This approval permits visual work for `TestApp` only.

The project owner also approved a demo-only exception to the G2 sequencing rule on 2026-10-21.
This approval permits the team to retain and validate the existing T046 paint overrides while
G2 remains blocked. The approval does not pass G2 or accept the derived baseline.

**Reviewer**: Project owner (user approval in this conversation)
**Scope**: `TestApp` only. Continue the T046 background-color and background-image Sass
variable changes for buttons, panel headers, grid headers, tabs, and tab bars. Use the
original `ext-theme-classic` theme as the immutable reference for every measurement and
behavior comparison. Preserve original geometry, protected styles, selectors, DOM, and
interactions. Do not extend this approval to production, other paint properties, or later
change groups.
**Date**: 2026-10-21
**Evidence ID**: `approved-g2-sequencing-exception-20261021`

The team must capture and compare the retained overrides in the demo. Record incomplete or
unsupported checks as blocked. Keep G0, G1, G2, and G3 acceptance blocked where evidence is
missing or incomplete. Production use remains out of scope.

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

## T084 Toolbar Approval

On 2026-10-21, the project owner approved a demo-only change to the toolbar container.

**Reviewer**: Project owner (user approval in this conversation)
**Scope**: TestApp only. Set $toolbar-background-gradient to dynamic('none') in
TestApp/packages/local/theme-classic-modern/sass/var/toolbar/Toolbar.scss. Keep the inherited
$toolbar-background-color. Change no other toolbar variable or paint property. Do not extend
this approval to production or other components.
**Allowed property**: background-image
**Evidence ID**: approved-t084-toolbar-demo-20261021

Compare toolbar states, geometry, computed styles, existing CSS, interactions, screenshots,
clipping, and rollback against ext-theme-classic. Keep G0, G1, G2, and G3 blocked when required
evidence is missing or incomplete. Production checks remain skipped under the prior approval.

**Rollback**: Remove the toolbar Sass variable file, select ext-theme-classic, then rebuild.
