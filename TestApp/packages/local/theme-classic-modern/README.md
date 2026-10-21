# theme-classic-modern

This package targets the Ext JS 7.7.0.31 Classic Toolkit.

The package extends `theme-classic` for the `TestApp` demo. The production theme chain is not verified. Do not claim production compatibility until the production owner verifies the active theme and its parent chain.

## Select the theme

Set the `theme` value in `TestApp/app.json`:

```json
"theme": "theme-classic-modern"
```

Run Sencha Cmd from the application directory:

```powershell
sencha app refresh
sencha app build development
sencha app build production
```

The application must use the standard Sencha Cmd theme package system. Do not add a runtime CSS overlay.

## Restore the original theme

Set the `theme` value in `TestApp/app.json` to the original value:

```json
"theme": "ext-theme-classic"
```

Run `sencha app refresh` and rebuild the application with Sencha Cmd.

The application code and existing CSS do not need a theme-specific change.

## Package scope

This package contains theme files only. It does not contain the demo, test harness, evidence, or Ext JS SDK.

The package adds paint-only Sass variable overrides for button, panel header, grid header, and tab surfaces. It uses muted blue-gray fills and removes glossy gradients. It preserves geometry and state behavior. Demo results do not prove production compatibility.
