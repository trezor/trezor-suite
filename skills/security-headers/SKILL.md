---
name: security-headers
description: Generated code must comply with the Suite web security headers (CSP, Permissions-Policy). Use when code uses eval, WebAssembly, iframes, popups or `navigator` APIs, when changing or deploying the headers (including the connect popup `bootstrap.html` set), or when investigating CSP violations in Sentry.
---

# Web Security headers

## Overview

The security headers are set for develop, staging, and production environments via AWS console. The local configuration reflects the production setup but isn't applied automatically, it's only used for local development and preview purposes.

## Header sets

The headers differ per path. `getSecurityHeadersByPath()` maps the paths that have their own set, and the preview server (`suite-app/web-app/preview.vite.config.mts`) looks the request path up there:

- Suite web, every path not in the map: `getSecurityHeaders()`.
- `connect-popup/bootstrap.html`: `getConnectPopupBootstrapSecurityHeaders()`. Third-party pages embed it in an iframe and connect-web opens it as a popup, so it leaves out `frame-ancestors`, `x-frame-options`, `cross-origin-opener-policy` and `permissions-policy`. Check it by framing both pages from another origin: the Suite page must be blocked, the bootstrap page must load.

To give another path its own headers, add a function for its set and an entry in `getSecurityHeadersByPath()`.

A change to the shared headers changes every set, so test the connect popup flows too and send every set for deployment.

## Process of editing security headers (for any environment)

The goal is to have consistent security headers across all environments.

1. Update the security headers in the `suite-app/web-app/constants/webSecurityHeaders.ts` file.
    - Run `yarn workspace @suite-app/web-app build:preview` with connected Trezor device.
    - Test all relevant user flows locally first.
        - Define relevant user flow scenarios.
        - Those which aren't covered by existing e2e tests, test manually via chrome-devtools MCP (or Playwright MCP) with trezor-user-env MCP.
        - Document in PR what flows have been left for e2e testing and which have been tested and their results.
        - Include the connect popup flows (a third-party page using `@trezor/connect-web`), they run under the `connect-popup/bootstrap.html` header set.
2. Once everything is verified locally, the author asks @vdovhanych (Tali) to deploy the headers to development first. Prepare the message for the author to send:
    - Name the target environment, usually development (staging and production follow the release, see step 3).
    - Paste the whole output of `yarn workspace @suite-app/web-app print-security-headers`: every header set with the paths it applies to (see [Header sets](#header-sets)), as `<header-name>: <header-value>` lines. Never send partial values. The author owns the change, Tali only copies the values to the respective fields and environment.
3. Verify the deployment and the release process
    - Before the deployment, capture the baseline of CSP violation kinds for the target environment (see [Monitoring CSP violations in Sentry](#monitoring-csp-violations-in-sentry)).
    - Set-up watchdog to monitor security headers violations in the development environment via Sentry MCP.
    - Ask author what's the priority of the security header change, i.e. how often you should report it.
        - Low: daily
        - Medium: hourly
        - High: asap (no more often than every 5 minutes, reports reach Sentry with a delay)
    - Report any violations according to the specified priority.
    - Report only violation kinds (directive plus blocked URL) that weren’t there before deploy, or a jump in rate.
    - Before requesting the staging deployment, compare the development violations against the baseline once more and report the result.
    - Track the release (see [Release tracking](#release-tracking)). Once the PR is merged, create a desktop scheduled task running daily, because the release takes weeks and outlives the session. Its prompt must include the PR number, the Sentry queries and the baseline. Each run notifies the author:
        - when QA approves the change (`Status` is `✅ Approved`),
        - when the sprint freezes (the `Release` iteration ends), asking when the headers should be deployed to staging and production.
    - After the staging and production deployments, monitor their violations for the period the author sets, then delete the scheduled task.

## Monitoring CSP violations in Sentry

- Only CSP violations reach Sentry. Browsers send them via `report-uri` / `report-to` to the `trezor-suite` project (organization `satoshilabs`) as `event.type:csp` events. `permissions-policy` has no `report-to` and `reporting-endpoints` defines only `csp-endpoint`, so Permissions-Policy violations are never reported. Cover them by the flow testing in step 1.
- CSP events have no `environment`, because the report URL has no `sentry_environment` parameter. Filter by the page URL instead:
    - development: `event.type:csp url:https://dev.suite.sldev.cz/suite-web/develop/*` (PR previews share the host under their own branch path)
    - production: `event.type:csp url:https://suite.trezor.io/web/*`
    - staging: ask the author for the host
- Baseline: before the deployment, list the environment's violation kinds over the last 7 days, grouped by `effective-directive` and `blocked-uri` with `count()`. Environments have violations before any change (e.g. in 2026-11 development reported a steady `script-src` `eval` violation), so "report any violation" would always fire.
- `connect-popup/bootstrap.html` reports under its own URL (`url:*connect-popup/bootstrap.html*`). In 2026-11 production reported a steady `img-src` violation of `https://suite.trezor.io/favicon.ico` there (TREZOR-SUITE-1D53): the page had no icon link, and `/favicon.ico` redirects to `trezor.io`, which `https://*.trezor.io` doesn't cover. The bootstrap template now links the Suite favicon, so the violation should stop once that is deployed.
- Reports reach Sentry with a delay: browsers batch Reporting API reports for up to about a minute and Sentry needs time to ingest them. Checking more often than every 5 minutes finds nothing extra. Violations appear only after someone uses the affected flow, so low-traffic environments need a longer watch, not a shorter interval.
- Watchdog by priority:
    - High: a Sentry issue alert on new `event.type:csp` issues for the environment's URL (persistent Sentry configuration, so get the author's OK before creating it), or `/loop 5m` while the flows are being tested.
    - Medium: `/loop 1h` in the session.
    - Low: a desktop scheduled task running daily. Each run starts with fresh context, so its prompt must include the query and the baseline.
    - `/loop` and session cron jobs end with the session (cron jobs also expire after 7 days), so watches longer than a working session use a scheduled task or a Sentry alert.

## Release tracking

The release state is on the Suite board (organization project 58), on the PR's item or its linked issue's item:

- `Status`: the merge sets `🤝 Needs QA` (or `✅ Approved` with the `no-QA` label), QA sets `✅ Approved`.
- `Release`: the iteration of the sprint. The freeze is its end (start date plus duration), when `release/<title>` branches from develop, e.g. `release/26.11` branched on 2026-11-05 from the `26.11` iteration that ended on 2026-11-04.

```sh
gh api graphql -F pr=<PR number> -f query='query($pr: Int!) {
  repository(owner: "trezor", name: "trezor-suite") {
    pullRequest(number: $pr) {
      mergedAt
      projectItems(first: 5) { nodes { ...item } }
      closingIssuesReferences(first: 5) { nodes { number projectItems(first: 5) { nodes { ...item } } } }
    }
  }
}
fragment item on ProjectV2Item {
  project { number }
  status: fieldValueByName(name: "Status") { ... on ProjectV2ItemFieldSingleSelectValue { name } }
  release: fieldValueByName(name: "Release") { ... on ProjectV2ItemFieldIterationValue { title startDate duration } }
}'
```

## Commands

- Start local server with production build and applied security headers: `yarn workspace @suite-app/web-app preview`
- Build web app and run the preview command: `yarn workspace @suite-app/web-app build:preview`
- or from root level command: `yarn suite:build:web:preview`
- Print every header set with its paths, ready to send for deployment: `yarn workspace @suite-app/web-app print-security-headers`

## Permissions-Policy Rationale (Enabled Directives)

- `usb=(self)`:
    - `packages/connect/src/index.browser.ts` (`window.navigator.usb.requestDevice(...)`)
    - `packages/transport/src/transports/webusb.browser.ts`
- `camera=(self)`:
    - `packages/suite/src/components/suite/modals/ReduxModal/UserContextModal/QrScannerModal/CameraQRReader.tsx` (`react-zxing` camera scanner used for QR input)
- `clipboard-write=(self)`:
    - `packages/dom-utils/src/copyToClipboard.ts` (`navigator.clipboard.writeText(...)`)
    - `packages/analytics-docs/src/components/AddEventModal/CopyButton.tsx`
    - `packages/analytics-docs/src/components/EventCard.tsx`
- `local-network-access=(self)`:
    - `packages/suite/src/hooks/suite/useLocalNetworkAccessPermission.ts` (`navigator.permissions.query({ name: 'local-network-access' })`)
    - `packages/connect-web/src/impl/core-in-suite-desktop.ts` (permission state check for websocket connectivity error handling)

`clipboard-read` is intentionally not enabled because current direct usage is test-only (`suite/e2e/tests/wallet/receive.test.ts`) rather than Suite Web runtime behavior.

Disabled directives (`=()`) are intentionally blocked because there is no direct web runtime use at this time.

## Direct Code References

- Header values source: `suite-app/web-app/constants/webSecurityHeaders.ts`
- Header type constraints: `suite-app/web-app/types/securityHeaders.ts`
- Per-path headers of the preview server: `suite-app/web-app/preview.vite.config.mts`
- Header sets printed for deployment: `suite-app/web-app/scripts/printSecurityHeaders.ts`
- Connect popup bootstrap page: `packages/connect-web/src/bootstrap/bootstrap.html`

MDN references:

- [Permissions Policy](https://developer.mozilla.org/en-US/docs/Web/HTTP/Guides/Permissions_Policy)
- [HTTP security headers overview](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers)
