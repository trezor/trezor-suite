# @suite-native/passphrase

## Overview

This package provides **reusable UI components and business logic** for passphrase-related functionality across the Suite Native application. It contains the building blocks for passphrase entry, validation, and flow management, but does not include navigation logic or complete screen implementations.

This package provides the shared components and logic needed for passphrase entry flows in different contexts.

## Responsibilities

- **Passphrase Entry Forms**: Provides form components for entering and confirming passphrases with validation. Handles both single entry and confirmation flows where users must enter the passphrase twice to prevent typos.
- **Validation Logic**: Validates passphrase input, detects mismatches between initial entry and confirmation, and checks for duplicate passphrase wallets.
- **Error Handling**: Displays appropriate error messages and alerts for common scenarios:
    - Passphrase mismatch (when confirmation doesn't match initial entry)
    - Duplicate passphrase wallets (when the passphrase already exists)
    - Empty wallet scenarios (when a passphrase results in a wallet with no transactions)
- **Device Interaction**: Provides UI for passphrase entry directly on the device (for devices that support on-device passphrase entry), including guidance and confirmation flows.
- **Flow Completion**: Handles redirects and navigation when passphrase flows complete, coordinating with navigation modules to return to appropriate screens.
- **Screen Content**: Provides reusable screen content components that navigation modules can wrap with their own navigation structure.

## Use Cases

This package is used in two main scenarios:

1. **Wallet Creation** (`@suite-native/module-passphrase`): When creating a new hidden passphrase wallet during discovery. The passphrase is entered, validated, and then used to create a new wallet.
2. **Device Authorization** (`@suite-native/module-authorize-device`): When unlocking a device that has a passphrase-protected wallet. The passphrase is entered to authorize access to an existing wallet's features (e.g., receive, sign transaction, etc.)

Both scenarios share the same UI components and validation logic, but have different navigation flows and completion handlers.

## Relationship with Other Packages

- **Used by**:
    - `@suite-native/module-passphrase` - Uses these components for wallet creation flow
    - `@suite-native/module-authorize-device` - Uses these components for device authorization flow
- **Purpose**: Provides shared, reusable passphrase UI and logic to avoid duplication across different navigation modules

### Dependency Constraints

- **Should not import**: `@suite-native/device-authorization` - This package should remain independent of device authorization state management
- **Can be imported by**: `@suite-native/device-authorization` may import this package if necessary, but the reverse dependency should never exist
