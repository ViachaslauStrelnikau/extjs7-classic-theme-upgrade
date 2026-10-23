# Proposed Demo Paint Goals

**Status**: T073 has a scoped demo-only approval. Other proposals remain pending.
**Scope**: `TestApp` demo only.

The project owner approved T073 on 2026-10-23 under
`approved-g2-sequencing-exception-t073-20261023`. This exception permits only the exact T073
variables below while G2 remains blocked. It does not pass G2 or G3. The existing T046 and T084
approvals do not cover these changes. Other groups still require separate approval.

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

| Family | Approved variable changes | Approved goal | Protected behavior |
| --- | --- | --- | --- |
| Form fields | `form-field-background-image: dynamic('none')` | Remove the bevel image. Keep the inherited white field fill and existing focus color. | Preserve the 22 px Classic field height, borders, trigger sizes, invalid image, disabled and read-only states, and text metrics. |
| Menus | `menu-item-background-gradient: dynamic('none')`; `menu-item-active-background-color: dynamic(#e5edf7)` | Remove the matte row gradient and use the existing flat blue-gray hover fill. | Preserve active text contrast, separator color, check and arrow glyphs, scrollers, keyboard navigation, and menu geometry. |
| Tooltips | `tip-background-color: dynamic(#f3f6fa)`; `tip-border-color: dynamic(#c7d2df)` | Use the existing quiet neutral surface with a blue-gray border. | Preserve error and warning colors, focus, stacking, clipping, border widths, and dimensions. |
| Windows and dialogs | `window-header-background-color: dynamic(#e7eef7)`; `window-body-background-color: dynamic(#fff)` | Use the existing blue-gray header and a neutral white body. | Preserve focus, stacking, clipping, border widths, dimensions, and drag/resize behavior. |

The exact Classic and neutral source files and affected fixture files are hashed in
`../../artifacts/compatibility/t087-t073-demo-20261023/approvals.json`. The affected cases are
`forms-and-validation`, `menus-and-submenus`, `windows-and-dialogs`, and
`tooltips-and-floating-elements`. These cases cover the 22 px text and combo fields,
invalid/disabled/read-only states, menu and submenu active rows, tooltip, window, and message
dialog. No form fill, focus color, invalid image, separator color, semantic message color,
dimensions, Sass rules, or assets are changed. See [T073 demo validation](t073-demo-paint-20261023.md).
G2 and G3 remain blocked until their full evidence requirements pass.

## Review status

The owner has not approved T048 through T057. Do not infer approval from the overall theme
goal. Keep the original Classic captures as the reference. Production compatibility remains deferred
to the next independent spec.
