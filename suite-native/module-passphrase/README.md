# @suite-native/module-passphrase

## Overview

This package provides the **navigation flow and UI** for creating new hidden passphrase wallets during the wallet discovery process in Suite Native. It handles the complete user flow from passphrase entry to wallet creation confirmation.

## Purpose

There are two distinct scenarios when `TrezorConnect` might request a passphrase:

1. **During Discovery** (handled by this package): When creating a new hidden passphrase wallet during the wallet discovery process. This is the sole purpose of this package.
2. **Device Authorization** (handled by `@suite-native/module-authorize-device`): When unlocking a device that already has a passphrase-protected wallet and needs authorization to communicate with `TrezorConnect` methods _if the wallet has been reconnected_.

## Relationship with Other Packages

- **Uses**:
    - `@suite-native/passphrase` - Uses shared passphrase UI components and validation logic
    - `@suite-native/navigation` - Uses navigation infrastructure
- **Related to**: `@suite-native/module-authorize-device` - Handles passphrase entry for device authorization (different use case)
- **Purpose**: Provides the complete UI and navigation layer specifically for creating new passphrase wallets during discovery

## Design Philosophy

This package follows a **navigation module** approach - it provides a complete, navigable flow for passphrase wallet creation. It consumes shared UI components from `@suite-native/passphrase` to ensure consistency with other passphrase flows while maintaining its own navigation structure optimized for the wallet creation use case.

The separation from `module-authorize-device` allows each module to:

- Have optimized navigation flows for their specific use cases
- Maintain clear separation of concerns
- Share UI components without coupling navigation logic
