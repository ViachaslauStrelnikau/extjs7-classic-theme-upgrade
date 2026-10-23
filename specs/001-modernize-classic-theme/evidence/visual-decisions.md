# Proposed Demo Paint Goals

**Status**: Proposals for owner review. No approval is recorded.
**Scope**: `TestApp` demo only.

Do not change Sass or assets from this proposal. The project owner must approve each group before
implementation. The current G2 and G3 gates remain blocked. The existing T046 and T084 approvals
do not cover these groups.

## T048: Backgrounds, borders, and separators

The approved T046 group already flattens button, panel header, grid header, tab, and tab bar
backgrounds. T083 preserves the original grid header and tab border colors. Do not change those
borders again without a new approval. The owner must identify any other surface that needs a paint
change before this group can proceed.

## T050: State colors

Proposed goal: make hover, focus, selected, and pressed states easy to distinguish with the existing
blue-gray palette. Keep disabled, invalid, and read-only meanings. Preserve all state classes and
keyboard behavior. Map exact cases and variables before approval.

## T052: Shadows and outlines

No new shadows are proposed. They can clip at container edges. Keep existing focus indicators until
the owner approves a specific paint-only adjustment. Do not change border radius or geometry.

## T054 and T056: Icons and higher-resolution assets

No new icon assets are proposed. T082 supplied the active Classic navigation GIFs without changing
their bytes or dimensions. Keep the current icon technology and paths unless a tested demo case
shows a specific defect.

## T073: Forms, menus, and floating components

| Family | Candidate source variables | Proposed goal | Protected behavior |
| --- | --- | --- | --- |
| Form fields | `form-field-background-image`, `form-field-background-color`, `form-field-focus-border-color`, `form-field-invalid-background-image` | Reduce the field bevel while keeping a clear neutral fill and visible focus. | Preserve the 22 px Classic field height, borders, trigger sizes, invalid indication, disabled and read-only states, and text metrics. |
| Menus | `menu-item-background-gradient`, `menu-item-active-background-color`, `menu-separator-border-color` | Remove the matte row gradient and use a flat blue-gray active fill. | Preserve active text contrast, separators, check and arrow glyphs, scrollers, keyboard navigation, and menu geometry. |
| Floating components | `tip-background-color`, `tip-border-color`, `window-header-background-color`, `window-body-background-color` | Use a calm blue-gray header and neutral surface while keeping semantic message colors. | Preserve error and warning colors, focus, stacking, clipping, border widths, dimensions, and drag/resize behavior. |

The listed variable names exist in the verified Classic inheritance sources. Confirm generated CSS
and affected demo cases before proposing exact values. Keep this group pending until the owner
approves its scope and the baseline rules permit implementation.

## Review status

The owner has not approved T048 through T057 or T073. Do not infer approval from the overall theme
goal. Keep the original Classic captures as the reference. Production compatibility remains deferred
to the next independent spec.
