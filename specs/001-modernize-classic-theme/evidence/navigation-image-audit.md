# Navigation Image Audit

**Status**: Demo-only asset repair complete. Keep visual acceptance blocked.

## Build Evidence

Before this repair, the original and replacement builds reported the same 20 missing-image warnings across 11 unique paths. The historical production logs are `artifacts/compatibility/selection/revalidation-final/rollback-build-production.log`, `artifacts/compatibility/selection/revalidation-final/replacement-build-production.log`, and `artifacts/compatibility/implement-build-20261021/production-build.log`.

The development build on 2026-10-21 merged the 9 active images into `theme-classic-modern`. It passed. It now reports only the 2 unused `navigation-more` image warnings. See [development build log](../../artifacts/compatibility/t082-navigation-assets-demo-20261021/development-build.log). Production checks were skipped under the approved demo-only scope.

The original `theme-classic` package does not contain the `navigation-*` files. It contains files with `default-*` names. Their sprite layout has not been checked against the navigation rules. Do not copy them without asset review.

| Missing path | Classic file | Size | Runtime result | Impact in the probe |
| --- | --- | --- | --- | --- |
| `images/tab/tab-navigation-close.gif` | `images/tab/tab-default-close.gif` | 11 × 11 | HTTP 200 after repair | The closable navigation-tab image loads. A close action removes one tab. |
| `images/tab-bar/navigation-more.gif` | `images/tab-bar/default-more.gif` | 12 × 16 | Not requested | The active `Scroller` handler does not render a more button. |
| `images/tab-bar/navigation-more-left.gif` | `images/tab-bar/default-more-left.gif` | 12 × 16 | Not requested | The active `Scroller` handler does not render a more button. |
| `images/tab-bar/navigation-scroll-left-top.gif` | `images/tab-bar/default-scroll-left-top.gif` | 36 × 42 | HTTP 200 after repair | The top tab bar's left scroller image loads. |
| `images/tab-bar/navigation-scroll-right-top.gif` | `images/tab-bar/default-scroll-right-top.gif` | 36 × 42 | HTTP 200 after repair | The top tab bar's right scroller image loads. A click advances the strip by 20 CSS pixels. |
| `images/tab-bar/navigation-scroll-left-bottom.gif` | `images/tab-bar/default-scroll-left-bottom.gif` | 36 × 42 | HTTP 200 after repair | The bottom tab bar's left scroller image loads. |
| `images/tab-bar/navigation-scroll-right-bottom.gif` | `images/tab-bar/default-scroll-right-bottom.gif` | 36 × 42 | HTTP 200 after repair | The bottom tab bar's right scroller image loads. A click advances the strip by 20 CSS pixels. |
| `images/tab-bar/navigation-scroll-top-left.gif` | `images/tab-bar/default-scroll-top-left.gif` | 42 × 36 | HTTP 200 after repair | The left tab bar's top scroller image loads. |
| `images/tab-bar/navigation-scroll-bottom-left.gif` | `images/tab-bar/default-scroll-bottom-left.gif` | 42 × 36 | HTTP 200 after repair | The left tab bar's bottom scroller image loads. A click advances the strip by 20 CSS pixels. |
| `images/tab-bar/navigation-scroll-top-right.gif` | `images/tab-bar/default-scroll-top-right.gif` | 42 × 36 | HTTP 200 after repair | The right tab bar's top scroller image loads. |
| `images/tab-bar/navigation-scroll-bottom-right.gif` | `images/tab-bar/default-scroll-bottom-right.gif` | 42 × 36 | HTTP 200 after repair | The right tab bar's bottom scroller image loads. A click advances the strip by 20 CSS pixels. |

## Runtime Evidence

The focused probe used Playwright Test 1.64.1 with Chromium 156.0.8078.4. It used the local `theme-classic-modern` development build, a 900 × 900 CSS pixel viewport, and device pixel ratio 1. The locale was `en-US`, and the time zone was `UTC`. Font checks for Arial, Tahoma, Verdana, and Segoe UI passed. The probe created temporary navigation tab panels. It did not change application files or shared fixtures.

The probe tested top, bottom, left, and right tab bars with 14 closable tabs. All nine active image paths returned HTTP 200. A pointer click on each scroller advanced the tab strip by 20 CSS pixels. A close action reduced the tab count from 14 to 13. The probe recorded no page errors. These checks cover the image repair. They do not pass the full behavior or visual acceptance gates.

The four screenshots show the tested tab positions: [top](../../artifacts/compatibility/t082-navigation-assets-demo-20261021/top-navigation.png), [bottom](../../artifacts/compatibility/t082-navigation-assets-demo-20261021/bottom-navigation.png), [left](../../artifacts/compatibility/t082-navigation-assets-demo-20261021/left-navigation.png), and [right](../../artifacts/compatibility/t082-navigation-assets-demo-20261021/right-navigation.png). The [runtime results](../../artifacts/compatibility/t082-navigation-assets-demo-20261021/navigation-runtime-probe.json) record each request and interaction.

The two `navigation-more` images were not requested. The tab bar uses the `Scroller` overflow handler, including when the probe sets `overflowHandler: 'menu'`. It did not render a more button. The existing 336 development captures also report no missing loaded assets, but they do not include navigation overflow states.

## Disposition

The 9 active images are exact byte copies of the Classic source images. Their SHA-256 hashes match, and their intrinsic dimensions remain unchanged. The two `navigation-more` images were not requested by the configured `Scroller` handler. Their two build warnings remain documented. The original theme reported the same missing paths before this repair.

T082 is complete for this demo-only repair. G0, G1, G2, and G3 remain blocked. This repair does not accept visual changes or production compatibility.

## Demo-Only Exception

On 2026-10-21, the project owner directed work to focus on `TestApp` and asked to resolve the demo issues recorded here. This approves a narrow exception to add resources for the 9 paths that the demo requests while G2 is blocked. Keep the original Classic GIF format, dimensions, and sprite positions. Copy only the matching assets from the verified demo parent. Do not modify framework files or application code.

This exception covers the demo only. It does not pass G0, G1, G2, or G3. It does not approve production use or change the production input status. The table above records each asset, its source, and its validation.

The two `navigation-more` paths were not requested by the active `Scroller` handler. Do not add them unless a later demo state requests them. Keep their build warnings documented as unused paths.
