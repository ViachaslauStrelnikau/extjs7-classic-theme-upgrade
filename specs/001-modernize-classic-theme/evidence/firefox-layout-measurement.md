# Firefox Layout Measurement Investigation

**Date**: 2026-10-21  
**Firefox**: Playwright-managed build `157.0`  
**Playwright Test**: `1.64.1`

## Current Capture

The capture records Firefox `PerformanceObserver` layout-shift entries. These entries show visible
layout shifts. They do not count layout recalculations that leave element positions unchanged. The
capture marks this observation as insufficient.

## Available Firefox Interfaces

Firefox documents `nsIDOMWindowUtils.elementsRestyled` as a count of style calculations. It also
documents `nsIReflowObserver` as an interface that detects interruptible and uninterruptible
reflows. These interfaces are privileged browser APIs. The current page script cannot call them.

Firefox WebDriver BiDi provides the `moz:profiler.start` and `moz:profiler.stop` commands. These
commands save a Firefox profile. The documentation does not define the profile as a complete count
of all style calculations and layout passes. The current Playwright capture does not open a BiDi
session. Playwright documents CDP sessions for the Chrome DevTools Protocol, and supports CDP only
for Chromium.

## Decision

No complete Firefox layout-work method has been validated in the current capture suite. Keep
SC-006, G1, and baseline acceptance blocked for Firefox. Do not infer a pass from layout-shift
entries or equal final geometry.

Before acceptance, either add a supported privileged counter path or validate a Firefox Profiler
method. Confirm its coverage for style calculations and all layout passes. Apply the same method to
the original and candidate during the recorded actions. Record the method, scope, results, and
limitations in each capture.

## Sources

- [Firefox performance measurement guidance](https://firefox-source-docs.mozilla.org/performance/bestpractices.html)
- [Firefox WebDriver BiDi extensions](https://firefox-source-docs.mozilla.org/remote/webdriver-bidi/Extensions.html)
- [Playwright CDPSession API](https://playwright.dev/docs/api/class-cdpsession)
