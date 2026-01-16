# @suite-native/device-authorization

## Overview

This package provides **shared state management and utilities** for device authorization flows within the Suite Native application. It handles the Redux state and business logic for unlocking Trezor device communication with `TrezorConnect`, but does not include navigation or UI flow-specific code.

## Authorization Behavior

The package automatically tracks and manages the following authorization states:

- **Idle**: Default state when no authorization is required
- **PIN Requested**: Device is locked and requires PIN entry to unlock
- **Passphrase Requested**: Device has a passphrase-protected wallet and requires passphrase entry
- **Continue On Trezor Requested**: User needs to perform an action directly on the Trezor device

The package automatically transitions between these states based on TrezorConnect UI events. When authorization is requested, it updates the state accordingly. When authorization flows complete (detected through flow-ending button requests or UI window close events), it resets to the Idle state.

## Relationship with Other Packages

- **Used by**: `@suite-native/module-authorize-device` - Consumes the authorization state and hooks to coordinate navigation
- **Purpose**: Provides the state management layer that navigation modules use to coordinate authorization flows

### Dependency Constraints

- **Should not import**: `@suite-native/passphrase` - Ideally, these packages should remain independent to maintain clear separation of concerns
- **If necessary**: This package (`@suite-native/device-authorization`) may import `@suite-native/passphrase` if needed, but **never** the other way around. This ensures that `passphrase` remains a lower-level, reusable component package without dependencies on authorization state management
