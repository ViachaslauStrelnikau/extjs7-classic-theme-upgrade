# Firefox Layout Measurement Investigation

**Date**: 2026-10-21  
**Firefox**: Playwright-managed build `157.0`  
**Playwright Test**: `1.64.1`

## Current Capture

The capture records Firefox `PerformanceObserver` layout-shift entries. These entries show visible
layout shifts. They do not count layout recalculations that leave element positions unchanged. The
capture marks this observation as insufficient.

## Available Firefox Interfaces

The current `nsIDOMWindowUtils` interface can include methods that need elevated privileges. The
current source does not expose an `elementsRestyled` counter. The capture page cannot use this
privileged interface to count style calculations.

Firefox WebDriver BiDi provides `moz:profiler.start` and `moz:profiler.stop`. These commands save a
Firefox profile. Firefox Profiler uses periodic sampling, usually every 1–2 ms. Firefox code can
also add markers for selected events. The profiler documentation does not guarantee a record for
every style calculation or layout pass. Playwright's CDP sessions work only with Chromium. The
current Playwright capture does not open a Firefox BiDi session or validate profiler data as a
complete counter.

The source review on 2026-10-21 found no supported method in the selected capture workflow that
counts every Firefox style calculation and layout pass during the recorded actions.

## WebDriver BiDi Profiler Review

On 2026-10-23, the Firefox documentation confirmed that WebDriver BiDi can start and stop the
Firefox Profiler. The profile is global. The active browsing context only marks the tab; it does
not limit the recording.

The profiler uses statistical samples. Those samples can miss short operations. It also records
deterministic markers for events that Firefox code instruments. The documentation does not
guarantee a marker for every style calculation or layout pass. A profile cannot prove a complete
layout-work count without further source-level validation. Keep Firefox layout acceptance blocked.

Sources: [WebDriver BiDi profiler](https://firefox-source-docs.mozilla.org/remote/webdriver-bidi/Extensions.html),
[Gecko Profiler](https://firefox-source-docs.mozilla.org/tools/profiler/index.html), and
[profiler markers](https://firefox-source-docs.mozilla.org/tools/profiler/markers-guide.html).

## Decision

No complete Firefox layout-work method has been validated in the current capture suite. Keep
SC-006, G1, and baseline acceptance blocked for Firefox. Do not infer a pass from layout-shift
entries or equal final geometry.

Before acceptance, either add a supported privileged counter path or validate a Firefox Profiler
method. Confirm its coverage for style calculations and all layout passes. Apply the same method to
the original and candidate during the recorded actions. Record the method, scope, results, and
limitations in each capture.

## Sources

- [Firefox `nsIDOMWindowUtils` interface](https://searchfox.org/firefox-main/source/dom/interfaces/base/nsIDOMWindowUtils.idl)
- [Firefox WebDriver BiDi extensions](https://firefox-source-docs.mozilla.org/remote/webdriver-bidi/Extensions.html)
- [Firefox Profiler code overview](https://firefox-source-docs.mozilla.org/tools/profiler/code-overview.html)
- [Firefox Profiler markers](https://firefox-source-docs.mozilla.org/tools/profiler/markers-guide.html)
- [Playwright CDP sessions](https://playwright.dev/docs/api/class-browser#browser-new-browser-cdp-session)
