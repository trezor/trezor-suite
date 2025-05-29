# Firmware Release Configuration

## Overview

The Firmware Release Configuration system provides a flexible way to manage and distribute firmware updates to devices. It is designed to:

- **Decouple Firmware and Suite Releases:** Enable the release of new firmware versions independently of new Suite releases.
- **Facilitate Gradual Rollouts:** Allow firmware updates to be released progressively based on a configurable probability and target environment (e.g., specific Suite versions).
- **Support Multiple Firmware Types:** Manage distinct release schedules for different firmware types (e.g., "regular," "bitcoin-only") for the same device model.

## Core Components

The system relies on several key components:

- **Configuration File:** A central JSON file (`releases.v1.json`) that defines available firmware versions, their rollout conditions, and other metadata.
- **JSON Schema:** A schema (`releases.schema.vX.json`) that defines the structure and validation rules for the configuration file.
- **Digital Signatures (JWS):** JSON Web Signatures (JWS) using the ES256 algorithm (elliptic curves) ensure the authenticity and integrity of the configuration file. The file is signed with a private key, and clients verify it using the corresponding public key.

## Configuration File (`releases.v1.json`)

### Location

The primary configuration file is located at:
`packages/firmware-release-config/releases/releases.v1.json`

This file must be updated manually. The information for updates is typically sourced from:
`packages/connect-common/files/firmware/<firmwareType>/releases.json`

### Schema and Validation

- **Schema Location:** `packages/firmware-release-config/schema/releases.schema.vX.json`
- **Purpose:** Ensures the `releases.v1.json` file adheres to the defined structure and data types.

### Structure and Fields

The configuration file is a JSON object with the following top-level properties:

- `version` (Integer, Required): Specifies the version of the firmware release configuration system itself. Increment this if a new configuration structure is introduced that is not backward compatible.
- `timestamp` (String, Required): An ISO 8601 formatted datetime string indicating when the configuration file was generated or last updated (e.g., `"2025-04-25T13:42:57.723Z"`).
- `sequence` (Integer, Required): A monotonically increasing number. Clients will only accept a new configuration if its `sequence` number is higher than the one they currently have. This prevents downgrade attacks or stale configurations.
- `releases` (Object, Required): Contains the firmware release information, keyed by device internal model names (e.g., `T1B1`, `T2B1`, `T2T1`).
- `intermediaries` (Object, Optional): Defines intermediary firmware update steps required for devices with significantly outdated firmware.

#### `releases` Object Structure

For each device model (e.g., `"T1B1"`), the value is an array of release definitions. This allows for multiple firmware versions or types to be available for a single device model.

Each element in the array is an object with:

- `firmware_type` (String, Required): Specifies the type of firmware. Examples: `"regular"`, `"bitcoin-only"`.
- `conditions` (Object, Required): Defines the criteria under which this firmware release will be offered.
    - `environment` (Object, Required):
        - `min_suite_version` (String, Required): The minimum Suite application version required for this firmware to be offered (e.g., `"25.2.1"`).
    - `rollout_probability` (Integer, Required): A percentage (0-100) representing the chance that a Suite client meeting other conditions will be offered this update. `100` means it's offered to all eligible users.
- `release` (Object, Required): Contains details about the specific firmware binary.
    - `required` (Boolean, Required): If `true`, this update is mandatory for eligible devices.
    - `version` (Array of Integers, Required): The firmware version numbers (e.g., `[1, 13, 0]` for 1.13.0).
    - `min_bootloader_version` (Array of Integers, Required): Minimum bootloader version required on the device to install this firmware.
    - `min_firmware_version` (Array of Integers, Required): Minimum firmware version required on the device.
    - `bootloader_version` (Array of Integers, Optional): If this firmware update also includes a bootloader update, this specifies the new bootloader version.
    - `translations` (Array, Required): List of language translation files or identifiers.
    - `firmware_revision` (String, Required): The Git commit hash or revision ID of the firmware build (e.g., `"592590cf66a9b62dfeee7e4d2afb6e01005e5b2c"`).
    - `fingerprint` (String, Required): A cryptographic hash (fingerprint) of the firmware binary, used for verification (e.g., `"253042fb209c78e02482c645b16cc9894c19124e9c9c0c1051b3c68b6e7c700b"`).
    - `changelog` (String, Required): A textual description of changes in this firmware version. Can be multi-line using `\n`.

#### `intermediaries` Object Structure

This object is keyed by device internal model names (e.g., `"T1B1"`). Each value is an array defining firmware versions that must be installed sequentially if a device's current firmware is older than the specified `min_firmware_version` of a target release. This ensures a safe upgrade path from very old versions.

Each element in the array is an object with:

- `min_firmware_version` (String, Required): If the device firmware is older than this version, the corresponding intermediary `version` (see below) must be applied. This is often the version _after which_ this intermediary is no longer needed.
- `version` (Integer, Required): An identifier or version number for the intermediary firmware package itself. This refers to an intermediary firmware build specifically designed for stepping up.

### Example Configuration

```json
{
    "version": 1,
    "timestamp": "2025-04-25T13:42:57.723Z",
    "sequence": 1,
    "releases": {
        "T1B1": [
            {
                "firmware_type": "regular",
                "conditions": {
                    "environment": {
                        "min_suite_version": "25.2.1"
                    },
                    "rollout_probability": 100
                },
                "release": {
                    "required": false,
                    "version": [1, 13, 0],
                    "min_bootloader_version": [1, 12, 0],
                    "min_firmware_version": [1, 12, 0],
                    "bootloader_version": [1, 12, 1],
                    "translations": [],
                    "firmware_revision": "592590cf66a9b62dfeee7e4d2afb6e01005e5b2c",
                    "fingerprint": "253042fb209c78e02482c645b16cc9894c19124e9c9c0c1051b3c68b6e7c700b",
                    "changelog": "* Multisig-related changes.\n* Reworked PIN processing.\n* Fixed the ability to display the XPUB using a QR code."
                }
            }
        ],
        "T2T1": [
            // Example for another device model.
            // ... release definitions for T2T1
        ]
    },
    "intermediaries": {
        "T1B1": [
            {
                // If device firmware is older than 1.6.2, intermediary '1' is needed.
                "min_firmware_version": "1.6.2",
                "version": 1
            },
            {
                // If device firmware is older than 1.12.0 (but >= 1.6.2), intermediary '2' is needed.
                "min_firmware_version": "1.12.0",
                "version": 2
            }
        ]
    }
}
```

## Signing and Authenticity

To ensure that the firmware release configuration originates from a trusted source and has not been tampered with, it is signed using JSON Web Signatures (JWS) with the ES256 (ECDSA using P-256 curve and SHA-256 hash) algorithm.

- Signing: The releases.v1.json file is signed using a private key. The resulting signature is typically distributed alongside the configuration file or embedded within a meta-file.
- Verification: Client applications (like Suite) use the corresponding public key to verify the signature before parsing and using the configuration.

### Local Development Signing

For development and testing purposes, you can sign the configuration file locally:

```Bash
yarn workspace @trezor/firmware-release-config sign-release-config
```

This command will use a development-specific key pair.

## How to Update Firmware Releases

### Gather Firmware Information:

- Obtain the details for the new firmware version (version numbers, changelog, binary fingerprint, revision, etc.). This information is often consolidated in: `packages/connect-common/files/firmware/<firmwareType>/releases.json`
- Identify the target device model(s) (e.g., T1B1, T2T1).
- Determine the firmware_type (e.g., regular, bitcoin-only).

### Edit releases.v1.json:

Run script to automatically take latest version data from

```Bash
yarn workspace @trezor/firmware-release-config generate-release-config
```

After updating the config with the script some manual updates can be done, in particular for fields in conditions.

### Update intermediaries (if necessary)

The `intermediary` firmwares are not included in the normal release process. If it has to be modified it will have to be done manually.

### Validate

Run the command below to make sure the manually updated release config meets the JSON schema requirements:

```Bash
yarn workspace @trezor/firmware-release-config validate-release-config
```

<!-- TODO -->

## CI

<!-- TODO -->
