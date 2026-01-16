# @suite-native/module-authorize-device

## Overview

This package provides the **complete navigation flow and UI** for device authorization within the Suite Native mobile application. It handles all scenarios where a Trezor device requires authentication or authorization before communicating with `TrezorConnect`.

When the mobile app communicates with a Trezor device through `TrezorConnect`, the device may require various forms of authentication or user interaction to proceed. This module provides the full user experience for these authorization flows.

The module handles the complete flow from initial connection through all authorization steps until the device is ready for use. It provides visual feedback, error handling, and recovery flows for connection issues.

## Overlap with Other Modules

There is a separate `@suite-native/module-passphrase` package which handles passphrase wallet creation during discovery. While these modules have similar screens and functionality, they serve different purposes:

- **This module** (`module-authorize-device`): Handles passphrase entry when a device needs to be authorized/unlocked for communication with `TrezorConnect`
- **`@suite-native/module-passphrase`**: Handles passphrase entry when creating a new hidden wallet during discovery

Both modules use the same shared components from `@suite-native/passphrase` to reduce duplication and maintain consistency. The key difference is that they use separate stack navigators and handle different user flows.
