---
name: security-headers
description: Generated code must be aligned with security headers (e.g. no unsave JS eval). The permissions policy is especially relevant when changing any code related with the `navigator` object.
---

# Security headers

## Preview

Start local server with production build and applied security headers:

```
yarn workspace @trezor/suite-web preview
```

## Build & Preview

Build web app and run the preview command:

```
yarn workspace @trezor/suite-web build:preview
```

or

root level command:

```
yarn suite:build:web:preview
```

## Security Headers

### Permissions-Policy Rationale (Enabled Directives)

- `usb=(self)`:
    - `packages/connect/src/index-browser.ts` (`window.navigator.usb.requestDevice(...)`)
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

### Direct Code References

- Header values source: `packages/suite-web/constants/webSecurityHeaders.ts`
- Header type constraints: `packages/suite-web/types/securityHeaders.ts`

MDN references:

- [Permissions Policy](https://developer.mozilla.org/en-US/docs/Web/HTTP/Guides/Permissions_Policy)
- [HTTP security headers overview](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers)
