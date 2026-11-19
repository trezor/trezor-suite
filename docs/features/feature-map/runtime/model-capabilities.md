# Trezor Suite model capabilities

Source audit at `8d6be9edbf990465176d57b4abc007bac17ca5e6`. Reviewed all 569 baseline feature IDs and their user-facing outcomes. This document records source-derived expectations; runtime UI observations remain separate in the [live manifest](../parts/runtime-observations.json). No application, browser or emulator actions were performed for this audit.

Both `T2B1` and `T3B1` are Safe 3. Keep the internal variant and packaging version in capture metadata: original T2B1 packaging changes the default backup and seal guidance. Do not merge these conditions into a blanket Safe 3 claim.

| Model | Product                                   | Native setup             | Native firmware utility minimum | Linked observed UI states |
| ----- | ----------------------------------------- | ------------------------ | ------------------------------- | ------------------------- |
| T1B1  | Trezor Model One                          | Unsupported; web handoff | 1.12.1                          | 0                         |
| T2T1  | Trezor Model T                            | Supported                | 2.6.3                           | 0                         |
| T2B1  | Trezor Safe 3 (original internal variant) | Supported                | 2.6.3                           | 0                         |
| T3B1  | Trezor Safe 3                             | Supported                | 2.6.3                           | 0                         |
| T3T1  | Trezor Safe 5                             | Supported                | 2.6.3                           | 29                        |
| T3W1  | Trezor Safe 7                             | Supported                | 2.6.3                           | 0                         |

The firmware utility minima are compatibility checks, not claims about firmware release dates. Existing initialized Model One use is separate from its unsupported native setup. All device actions still require a usable transport and authorization.

## Source-derived model differences

Each model cell states the current implementation expectation. “Capability-gated” means the device report controls visibility; fixture omissions cannot establish permanent model exclusion. **High confidence** means an explicit gate; **medium confidence** means some model assignments depend on fixture/manual evidence.

### PIN, passphrase and recovery input surface

Find it: Device onboarding / unlock prompt / Recover wallet. Confidence: **high**. Existing features: `onboarding.pin`, `connection.pin-unlock`, `onboarding.recovery.on-device`, `wallet-access.passphrase.device`.

| Model | Source expectation                                                             |
| ----- | ------------------------------------------------------------------------------ |
| T1B1  | Host PIN matrix; Model One recovery has host-assisted standard/advanced paths. |
| T2T1  | Touchscreen input.                                                             |
| T2B1  | On-device button input.                                                        |
| T3B1  | On-device button input.                                                        |
| T3T1  | Touchscreen input.                                                             |
| T3W1  | Touchscreen input.                                                             |

Prerequisites: PIN entry and recovery depend on requested device workflow; never capture entered values. On-device passphrase entry additionally depends on Capability_PassphraseEntry, not merely touchscreen/button hardware.

- [suite-common/suite-utils/src/device.ts:479](../../../../suite-common/suite-utils/src/device.ts#L479) — Explicit button-only map: T1B1/T2B1/T3B1; touch models are T2T1/T3T1/T3W1. (implementation).
- [packages/suite/src/views/recovery/steps/InitialStep.tsx:11](../../../../packages/suite/src/views/recovery/steps/InitialStep.tsx#L11) — Recovery instructions differ between computer, buttons and touchscreen. (implementation).
- [packages/suite/src/views/onboarding/steps/PinStep.tsx:56](../../../../packages/suite/src/views/onboarding/steps/PinStep.tsx#L56) — Model One emits PIN matrix states; touchscreen device PIN setup stays on hardware. (implementation).
- [suite-common/device/src/deviceSelectors.ts:290](../../../../suite-common/device/src/deviceSelectors.ts#L290) — On-device passphrase selector checks capability. (implementation).

Runtime: runtime-web-t3t1-pin-setup A reached UI state does not verify model exclusions, physical behavior or firmware boundaries.

### Default new-wallet backup

Find it: Device onboarding > Create wallet > Backup type. Confidence: **high**. Existing features: `onboarding.new-wallet.backup-type`, `onboarding.new-wallet.12-words`, `onboarding.new-wallet.24-words`, `onboarding.new-wallet.single-share`.

| Model | Source expectation                                                     |
| ----- | ---------------------------------------------------------------------- |
| T1B1  | 24-word BIP39; backup-type chooser automatically skipped.              |
| T2T1  | 12-word BIP39 by default.                                              |
| T2B1  | 12 words for original unit_packaging=0; otherwise single-share SLIP39. |
| T3B1  | Single-share SLIP39.                                                   |
| T3T1  | Single-share SLIP39.                                                   |
| T3W1  | Single-share SLIP39.                                                   |

Prerequisites: Single-share option requires firmware >=2.7.1 in the desktop/web selector. Default differs from available alternatives; packaging must be recorded for T2B1.

- [suite-common/device/src/deviceSelectors.ts:553](../../../../suite-common/device/src/deviceSelectors.ts#L553) — Model and original Safe 3 packaging determine default. (implementation).
- [packages/suite/src/views/onboarding/steps/BackupTypeStep.tsx:19](../../../../packages/suite/src/views/onboarding/steps/BackupTypeStep.tsx#L19) — Model One cannot choose backup type and auto-continues. (implementation).
- [packages/suite/src/views/onboarding/steps/SelectBackupType/ShamirOptions.tsx:44](../../../../packages/suite/src/views/onboarding/steps/SelectBackupType/ShamirOptions.tsx#L44) — Single-share creation disabled below this version. (implementation).

Runtime: runtime-web-t3t1-backup-type, runtime-web-t3t1-legacy-backup-types A reached UI state does not verify model exclusions, physical behavior or firmware boundaries.

### Additional SLIP39 backup shares

Find it: Settings > Device > Wallet backup > Create additional backup. Confidence: **high**. Existing features: `device-settings.backup.multi-share`.

| Model | Source expectation                                                                            |
| ----- | --------------------------------------------------------------------------------------------- |
| T1B1  | Requires Capability_Shamir and an extendable SLIP39 backup; model name alone is insufficient. |
| T2T1  | Requires Capability_Shamir and an extendable SLIP39 backup; model name alone is insufficient. |
| T2B1  | Requires Capability_Shamir and an extendable SLIP39 backup; model name alone is insufficient. |
| T3B1  | Requires Capability_Shamir and an extendable SLIP39 backup; model name alone is insufficient. |
| T3T1  | Requires Capability_Shamir and an extendable SLIP39 backup; model name alone is insufficient. |
| T3W1  | Requires Capability_Shamir and an extendable SLIP39 backup; model name alone is insufficient. |

Prerequisites: Wallet must have extendable Slip39_Single/Basic/Advanced_Extendable backup type. Non-extendable SLIP39 and BIP39 do not satisfy selector. Model One normal UI does not offer Shamir new-wallet choice.

- [suite-common/backup/src/shamir.ts:15](../../../../suite-common/backup/src/shamir.ts#L15) — Capability and backup-type gates. (implementation).
- [suite-common/backup/src/shamir.test.ts:14](../../../../suite-common/backup/src/shamir.test.ts#L14) — Unit scenarios cover capability absence and non-extendable backups. (automated-test).
- [suite/e2e/tests/backup/t3t1-t2t1-create-additional-share.test.ts:7](../../../../suite/e2e/tests/backup/t3t1-t2t1-create-additional-share.test.ts#L7) — Additional-share scenario for T3T1/T2T1; source inspection only. (automated-test).

Runtime: No matching model-specific observation is recorded in the manifest snapshot. A reached UI state does not verify model exclusions, physical behavior or firmware boundaries.

### Model One recovery mode selection

Find it: Recover wallet or Settings > Device > Check backup. Confidence: **high**. Existing features: `onboarding.recovery.standard`, `onboarding.recovery.advanced`, `onboarding.recovery.word-count`, `device-settings.check-backup`.

| Model | Source expectation                                                         |
| ----- | -------------------------------------------------------------------------- |
| T1B1  | 24 words offers standard/advanced; 12/18 words automatically use advanced. |
| T2T1  | Word count and words entered on device.                                    |
| T2B1  | Word count and words entered using device buttons.                         |
| T3B1  | Word count and words entered using device buttons.                         |
| T3T1  | Word count and words entered on device.                                    |
| T3W1  | Word count and words entered on device.                                    |

Prerequisites: This distinction applies to recovery and backup-check workflows; Shamir recovery additionally requires Capability_Shamir.

- [packages/suite/src/views/recovery/index.tsx:209](../../../../packages/suite/src/views/recovery/index.tsx#L209) — Backup check skips recovery-type selection for smaller Model One backups. (implementation).
- [suite/e2e/tests/onboarding/t1b1/t1b1-recovery-advanced.test.ts:51](../../../../suite/e2e/tests/onboarding/t1b1/t1b1-recovery-advanced.test.ts#L51) — Onboarding test explicitly covers automatic advanced mode for 12 words. (automated-test).

Runtime: No matching model-specific observation is recorded in the manifest snapshot. A reached UI state does not verify model exclusions, physical behavior or firmware boundaries.

### Hardware authenticity verification

Find it: Device onboarding or Settings > Device > Authenticate. Confidence: **high**. Existing features: `onboarding.authenticity`, `device-settings.authenticity-check`.

| Model | Source expectation                                             |
| ----- | -------------------------------------------------------------- |
| T1B1  | Not supported.                                                 |
| T2T1  | Not supported.                                                 |
| T2B1  | Supported; Optiga verification.                                |
| T3B1  | Supported; Optiga verification.                                |
| T3T1  | Supported; firmware >=2.8.0.                                   |
| T3W1  | Supported; Optiga and Tropic; MCU proof is firmware-dependent. |

Prerequisites: Authentication also depends on network/configuration and enabled security checks. T3W1 Tropic gate starts at 2.9.3 (first production firmware); MCU/chunked proof gate is >=2.12.1.

- [suite-common/device-authenticity/src/deviceAuthenticityConstants.ts:3](../../../../suite-common/device-authenticity/src/deviceAuthenticityConstants.ts#L3) — Explicit model support map. (implementation).
- [packages/connect-core/src/data/config.ts:139](../../../../packages/connect-core/src/data/config.ts#L139) — T3T1 authentication requires 2.8.0; T1B1/T2T1 unsupported. (implementation).
- [packages/connect-core/src/data/config.ts:147](../../../../packages/connect-core/src/data/config.ts#L147) — Tropic required for production Safe 7 from 2.9.3. (implementation).
- [packages/connect-core/src/data/config.ts:159](../../../../packages/connect-core/src/data/config.ts#L159) — Executable Safe 7 MCU/chunked proof boundary is 2.12.1. (implementation).
- [suite/e2e/tests/onboarding/authenticity-check.test.ts:6](../../../../suite/e2e/tests/onboarding/authenticity-check.test.ts#L6) — Existing test tags cover Safe 3/Safe 5; comment explicitly leaves Safe 7 expansion outstanding. (automated-test).

Runtime: No matching model-specific observation is recorded in the manifest snapshot. A reached UI state does not verify model exclusions, physical behavior or firmware boundaries.

Note: suite-common/device-authenticity/src/utils.ts contains a stale MCU >=2.11.2 comment; executable Connect config currently uses >=2.12.1. Do not use the comment as the effective boundary.

### On-device controls tutorial

Find it: Device onboarding > Device controls tutorial. Confidence: **high**. Existing features: `onboarding.tutorial`.

| Model | Source expectation            |
| ----- | ----------------------------- |
| T1B1  | Excluded.                     |
| T2T1  | Excluded.                     |
| T2B1  | Included.                     |
| T3B1  | Included.                     |
| T3T1  | Included from firmware 2.8.0. |
| T3W1  | Included.                     |

Prerequisites: Desktop/web explicit supportedModels list; native follows deviceUnavailableCapabilities.tutorial.

- [packages/suite/src/config/onboarding/steps.ts:56](../../../../packages/suite/src/config/onboarding/steps.ts#L56) — Explicit model and Safe 5 minimum firmware list. (implementation).
- [packages/connect-core/src/data/config.ts:130](../../../../packages/connect-core/src/data/config.ts#L130) — Connect excludes Model One/Model T and requires Safe 5 2.8.0. (implementation).
- [suite-native-app/module-device-onboarding/src/hooks/useNavigateToNextScreenAfterFirmwareInstallation.ts:29](../../../../suite-native-app/module-device-onboarding/src/hooks/useNavigateToNextScreenAfterFirmwareInstallation.ts#L29) — Native routes according to unavailable capabilities. (implementation).

Runtime: runtime-web-t3t1-controls-tutorial A reached UI state does not verify model exclusions, physical behavior or firmware boundaries.

### Native create/recover setup and unsupported-device handoff

Find it: Native > Connect device > Device onboarding. Confidence: **high**. Existing features: `onboarding`, `onboarding.recovery`.

| Model | Source expectation                                                                                                                 |
| ----- | ---------------------------------------------------------------------------------------------------------------------------------- |
| T1B1  | Native setup unsupported; initialized-device use is a separate firmware-gated path; uninitialized device offers Suite web handoff. |
| T2T1  | Setup supported.                                                                                                                   |
| T2B1  | Setup supported.                                                                                                                   |
| T3B1  | Setup supported.                                                                                                                   |
| T3T1  | Setup supported.                                                                                                                   |
| T3W1  | Setup supported.                                                                                                                   |

Prerequisites: Native minimum supported firmware utility: Model One 1.12.1; all listed core models 2.6.3. These are utility thresholds, not claims that firmware versions predate a hardware launch. An available transport and OS permissions are still required.

- [suite-native/device/src/utils.ts:23](../../../../suite-native/device/src/utils.ts#L23) — Native baseline firmware utility thresholds. (implementation).
- [suite-native/device/src/utils.ts:50](../../../../suite-native/device/src/utils.ts#L50) — Explicit setup support switch excludes Model One/UNKNOWN. (implementation).
- [suite-native/device/src/hooks/useDetectDeviceError.tsx:181](../../../../suite-native/device/src/hooks/useDetectDeviceError.tsx#L181) — Unsupported uninitialized devices offer Suite web setup guidance. (implementation).

Runtime: runtime-web-t3t1-device-detection, runtime-web-t3t1-device-doubts, runtime-web-t3t1-create-or-recover A reached UI state does not verify model exclusions, physical behavior or firmware boundaries.

### Packaging, seal and branded-wrap guidance

Find it: Device onboarding > Security / packaging check. Confidence: **high**. Existing features: `mobile.device-onboarding.security`, `onboarding.authenticity`.

| Model | Source expectation                                       |
| ----- | -------------------------------------------------------- |
| T1B1  | Dedicated Model One seal animation.                      |
| T2T1  | Model-specific seal instructions.                        |
| T2B1  | Original packaging has extra seal explanation.           |
| T3B1  | Safe 3 current seal instructions.                        |
| T3T1  | Safe 5 seal instructions.                                |
| T3W1  | Safe 7 seal instructions and branded plastic-wrap check. |

Prerequisites: T2B1 packaging distinction is unit_packaging absent/0. Branded plastic-wrap check applies only to T3W1 in current constants.

- [packages/suite/src/components/onboarding/Hologram.tsx:21](../../../../packages/suite/src/components/onboarding/Hologram.tsx#L21) — Old Safe 3 packaging branch and Model One dedicated animation. (implementation).
- [suite-common/device-authenticity/src/deviceAuthenticityConstants.ts:14](../../../../suite-common/device-authenticity/src/deviceAuthenticityConstants.ts#L14) — Only Safe 7 asks for branded plastic wrapping. (implementation).
- [suite-native-app/module-device-onboarding/src/screens/SecurityCheckScreen.tsx:27](../../../../suite-native-app/module-device-onboarding/src/screens/SecurityCheckScreen.tsx#L27) — Native packaging steps consume branded-wrap condition. (implementation).

Runtime: No matching model-specific observation is recorded in the manifest snapshot. A reached UI state does not verify model exclusions, physical behavior or firmware boundaries.

### Display orientation

Find it: Settings > Device > Personalization > Display orientation. Confidence: **high**. Existing features: `device-settings.rotation`.

| Model | Source expectation               |
| ----- | -------------------------------- |
| T1B1  | Hidden.                          |
| T2T1  | North/East/South/West.           |
| T2B1  | Hidden.                          |
| T3B1  | Hidden.                          |
| T3T1  | North/East/South/West.           |
| T3W1  | Hidden in current Suite control. |

Prerequisites: Explicit model gate; display_rotation feature presence does not establish support. Native device settings composition does not expose this desktop/web control.

- [packages/suite/src/views/settings/SettingsDevice/DisplayRotation.tsx:59](../../../../packages/suite/src/views/settings/SettingsDevice/DisplayRotation.tsx#L59) — Only Model T and Safe 5 render the control. (implementation).
- [suite-app/app/src/pages/SettingsDevicePage.tsx:239](../../../../suite-app/app/src/pages/SettingsDevicePage.tsx#L239) — Personalization requires normal mode; auto-lock additionally requires PIN protection; security and backup sections have mode guards. (implementation).

Runtime: No matching model-specific observation is recorded in the manifest snapshot. A reached UI state does not verify model exclusions, physical behavior or firmware boundaries.

### Screen brightness adjustment

Find it: Settings > Device > Personalization > Screen brightness. Confidence: **high**. Existing features: `device-settings.brightness`.

| Model | Source expectation                                                                      |
| ----- | --------------------------------------------------------------------------------------- |
| T1B1  | Visible only when firmware advertises Capability_Brightness; adjustment runs on Trezor. |
| T2T1  | Visible only when firmware advertises Capability_Brightness; adjustment runs on Trezor. |
| T2B1  | Visible only when firmware advertises Capability_Brightness; adjustment runs on Trezor. |
| T3B1  | Visible only when firmware advertises Capability_Brightness; adjustment runs on Trezor. |
| T3T1  | Visible only when firmware advertises Capability_Brightness; adjustment runs on Trezor. |
| T3W1  | Visible only when firmware advertises Capability_Brightness; adjustment runs on Trezor. |

Prerequisites: No hardcoded Suite model allowlist or numerical minimum is present in the control. Source fixtures demonstrate brightness on T3T1 and T3W1, but fixture absence cannot prove exclusion on another firmware/model. Native settings composition does not expose a brightness control.

- [packages/suite/src/views/settings/SettingsDevice/Brightness.tsx:15](../../../../packages/suite/src/views/settings/SettingsDevice/Brightness.tsx#L15) — Capability-driven control calls setBrightness with no explicit value to open device adjustment. (implementation).
- [suite-native-app/app/e2e/fixtures/btcDiscoveryFinishedStateT3T1.ts:216](../../../../suite-native-app/app/e2e/fixtures/btcDiscoveryFinishedStateT3T1.ts#L216) — Safe 5 fixture advertises brightness; fixture evidence only. (automated-test).
- [suite/e2e/fixtures/remembered-wallet-db-lite.json:4348](../../../../suite/e2e/fixtures/remembered-wallet-db-lite.json#L4348) — Safe 7 remembered-device fixture advertises brightness. (automated-test).
- [suite-app/app/src/pages/SettingsDevicePage.tsx:239](../../../../suite-app/app/src/pages/SettingsDevicePage.tsx#L239) — Personalization requires normal mode; auto-lock additionally requires PIN protection; security and backup sections have mode guards. (implementation).

Runtime: No matching model-specific observation is recorded in the manifest snapshot. A reached UI state does not verify model exclusions, physical behavior or firmware boundaries.

Note: Hardware light output has not been verified by this audit.

### Haptic feedback toggle

Find it: Settings > Device > Personalization > Haptic feedback. Confidence: **high**. Existing features: `device-settings.haptics`.

| Model | Source expectation                                       |
| ----- | -------------------------------------------------------- |
| T1B1  | Visible only when firmware advertises Capability_Haptic. |
| T2T1  | Visible only when firmware advertises Capability_Haptic. |
| T2B1  | Visible only when firmware advertises Capability_Haptic. |
| T3B1  | Visible only when firmware advertises Capability_Haptic. |
| T3T1  | Visible only when firmware advertises Capability_Haptic. |
| T3W1  | Visible only when firmware advertises Capability_Haptic. |

Prerequisites: Suite checks the capability; no model allowlist or numerical minimum exists in this control. Safe 7 remembered-device fixture includes Haptic. Some older Safe 5 fixtures omit it; do not infer permanent hardware support or absence from that fixture. Native settings composition does not expose the toggle.

- [packages/suite/src/views/settings/SettingsDevice/HapticFeedback.tsx:19](../../../../packages/suite/src/views/settings/SettingsDevice/HapticFeedback.tsx#L19) — Visibility checks capability and toggle applies haptic_feedback. (implementation).
- [suite/e2e/fixtures/remembered-wallet-db-lite.json:4346](../../../../suite/e2e/fixtures/remembered-wallet-db-lite.json#L4346) — Safe 7 fixture includes Haptic. (automated-test).
- [suite-app/app/src/pages/SettingsDevicePage.tsx:239](../../../../suite-app/app/src/pages/SettingsDevicePage.tsx#L239) — Personalization requires normal mode; auto-lock additionally requires PIN protection; security and backup sections have mode guards. (implementation).

Runtime: No matching model-specific observation is recorded in the manifest snapshot. A reached UI state does not verify model exclusions, physical behavior or firmware boundaries.

Note: Browser screenshots can document the toggle, not physical vibration.

### Homescreen upload dimensions and formats

Find it: Settings > Device > Personalization > Homescreen. Confidence: **high**. Existing features: `device-settings.homescreen.upload`, `device-settings.homescreen.gallery`.

| Model | Source expectation        |
| ----- | ------------------------- |
| T1B1  | 128×64; PNG/JPEG; 16 KiB. |
| T2T1  | 240×240; JPEG; 16 KiB.    |
| T2B1  | 128×64; PNG/JPEG; 16 KiB. |
| T3B1  | 128×64; PNG/JPEG; 16 KiB. |
| T3T1  | 240×240; JPEG; 16 KiB.    |
| T3W1  | 380×520; JPEG; 64 KiB.    |

Prerequisites: These are Suite image-conversion/validation constraints, not a hardware-spec claim. Default gallery path also differs for monochrome, 240×240 and Safe 7 formats; Bitcoin-only firmware changes defaults.

- [packages/suite/src/utils/suite/homescreen.ts:24](../../../../packages/suite/src/utils/suite/homescreen.ts#L24) — Explicit per-model upload constraints. (implementation).
- [packages/suite/src/components/suite/HomescreenGallery.tsx:24](../../../../packages/suite/src/components/suite/HomescreenGallery.tsx#L24) — Per-model gallery directories. (implementation).
- [suite-app/app/src/pages/SettingsDevicePage.tsx:239](../../../../suite-app/app/src/pages/SettingsDevicePage.tsx#L239) — Personalization requires normal mode; auto-lock additionally requires PIN protection; security and backup sections have mode guards. (implementation).

Runtime: No matching model-specific observation is recorded in the manifest snapshot. A reached UI state does not verify model exclusions, physical behavior or firmware boundaries.

### Device language selection

Find it: Settings > Device > Firmware > Language. Confidence: **high**. Existing features: `device-settings.language`.

| Model | Source expectation                                       |
| ----- | -------------------------------------------------------- |
| T1B1  | changeLanguage unsupported by Connect.                   |
| T2T1  | Firmware >=2.7.0 plus translations capability.           |
| T2B1  | Firmware >=2.7.0 plus translations capability.           |
| T3B1  | Translations capability and available language packages. |
| T3T1  | Translations capability and available language packages. |
| T3W1  | Translations capability and available language packages. |

Prerequisites: Selector requires Capability_Translations; UI hides chooser when <=1 supported language. Connect min maps for later models are unspecified here, not a promise to support all older firmware.

- [packages/connect-core/src/data/config.ts:220](../../../../packages/connect-core/src/data/config.ts#L220) — Explicit Model One exclusion and Model T / original Safe 3 minimum 2.7.0. (implementation).
- [suite-common/device/src/deviceSelectors.ts:84](../../../../suite-common/device/src/deviceSelectors.ts#L84) — Device capability gate. (implementation).
- [packages/suite/src/views/settings/SettingsDevice/ChangeLanguage.tsx:40](../../../../packages/suite/src/views/settings/SettingsDevice/ChangeLanguage.tsx#L40) — Control only appears when multiple supported languages exist. (implementation).
- [suite/e2e/tests/manual/settings/device-language.test.ts:8](../../../../suite/e2e/tests/manual/settings/device-language.test.ts#L8) — Manual parent scenario checks updating firmware after installing a translation. (manual-test).

Runtime: No matching model-specific observation is recorded in the manifest snapshot. A reached UI state does not verify model exclusions, physical behavior or firmware boundaries.

### Device auto-lock interval

Find it: Settings > Device > Security > Auto-lock. Confidence: **high**. Existing features: `device-settings.auto-lock`.

| Model | Source expectation                             |
| ----- | ---------------------------------------------- |
| T1B1  | Shown only when auto_lock_delay_ms is numeric. |
| T2T1  | Shown only when auto_lock_delay_ms is numeric. |
| T2B1  | Shown only when auto_lock_delay_ms is numeric. |
| T3B1  | Shown only when auto_lock_delay_ms is numeric. |
| T3T1  | Shown only when auto_lock_delay_ms is numeric. |
| T3W1  | Shown only when auto_lock_delay_ms is numeric. |

Prerequisites: No Suite model allowlist; options are 1 minute, 10 minutes, 1 hour, 1 day and 6 days. Requires connected/unlocked device for modification. Settings page additionally requires PIN protection and normal mode.

- [packages/suite/src/views/settings/SettingsDevice/AutoLock.tsx:39](../../../../packages/suite/src/views/settings/SettingsDevice/AutoLock.tsx#L39) — Visibility determined by reported numeric field; predefined timeout choices. (implementation).
- [suite-app/app/src/pages/SettingsDevicePage.tsx:239](../../../../suite-app/app/src/pages/SettingsDevicePage.tsx#L239) — Personalization requires normal mode; auto-lock additionally requires PIN protection; security and backup sections have mode guards. (implementation).

Runtime: No matching model-specific observation is recorded in the manifest snapshot. A reached UI state does not verify model exclusions, physical behavior or firmware boundaries.

### Bluetooth transport, secure pairing and autoconnect

Find it: Connect Trezor / Settings > Device > Connection. Confidence: **medium**. Existing features: `connection.bluetooth`, `connection.thp`, `device-settings.auto-connect`.

| Model | Source expectation                                                                                          |
| ----- | ----------------------------------------------------------------------------------------------------------- |
| T1B1  | No Bluetooth scenario evidenced for this model; USB authorization path.                                     |
| T2T1  | No Bluetooth scenario evidenced for this model; USB authorization path.                                     |
| T2B1  | No Bluetooth scenario evidenced for this model; USB authorization path.                                     |
| T3B1  | No Bluetooth scenario evidenced for this model; USB authorization path.                                     |
| T3T1  | No Bluetooth scenario evidenced for this model; USB authorization path.                                     |
| T3W1  | Bluetooth-capable model in manual and automated scenarios; THP secure host pairing and trusted autoconnect. |

Prerequisites: Runtime Bluetooth support is gated by Capability_BLE, transport availability and OS permission. THP support is device.thp presence, not a hardcoded product-name check. Autoconnect setting additionally requires credentials property. Web Bluetooth navigation/control availability differs from desktop transport; do not treat desktop native Bluetooth service as browser support.

- [suite-common/device/src/deviceSelectors.ts:89](../../../../suite-common/device/src/deviceSelectors.ts#L89) — Bluetooth selector follows reported capability. (implementation).
- [suite-common/suite-utils/src/device.ts:519](../../../../suite-common/suite-utils/src/device.ts#L519) — THP detection is presence-based. (implementation).
- [packages/suite/src/views/settings/SettingsDevice/ThpAutoconnect.tsx:20](../../../../packages/suite/src/views/settings/SettingsDevice/ThpAutoconnect.tsx#L20) — Autoconnect setting requires THP credentials. (implementation).
- [suite/e2e/tests/manual/connect/bluetooth-pairing.test.ts:15](../../../../suite/e2e/tests/manual/connect/bluetooth-pairing.test.ts#L15) — Manual pairing scenarios identify Safe 7. (manual-test).
- [suite-native/device-authorization/src/screens/DeviceConnectionGuardScreen.tsx:27](../../../../suite-native/device-authorization/src/screens/DeviceConnectionGuardScreen.tsx#L27) — Native reconnect screen checks Bluetooth permission and device support. (implementation).

Runtime: No matching model-specific observation is recorded in the manifest snapshot. A reached UI state does not verify model exclusions, physical behavior or firmware boundaries.

Note: High confidence in gates; medium in negative model assignments because application runtime checks capability/transport rather than an exhaustive model denylist.

### Forget device and clean up pairing

Find it: Settings > Device > Connection > Forget. Confidence: **high**. Existing features: `device-settings.forget`, `connection.bluetooth.repair`.

| Model | Source expectation                                                                                                                           |
| ----- | -------------------------------------------------------------------------------------------------------------------------------------------- |
| T1B1  | Forget remembered device; unplug when connected.                                                                                             |
| T2T1  | Forget remembered device; unplug when connected.                                                                                             |
| T2B1  | Forget remembered device; unplug when connected.                                                                                             |
| T3B1  | Forget remembered device; unplug when connected.                                                                                             |
| T3T1  | Forget remembered device; unplug when connected.                                                                                             |
| T3W1  | THP+Bluetooth connected: unpair device then remove OS pairing. Cable/disconnected with Bluetooth history: OS and on-device cleanup guidance. |

Prerequisites: Flow selection depends on device.thp, current Bluetooth connection and persisted Bluetooth pairing history, not only model. Native guide opens OS Bluetooth settings on Android; iOS displays instructions as text.

- [packages/suite/src/views/settings/SettingsDevice/ForgetDevice/ForgetDeviceModal.tsx:76](../../../../packages/suite/src/views/settings/SettingsDevice/ForgetDevice/ForgetDeviceModal.tsx#L76) — Flow selection considers THP, connection and pairing history. (implementation).
- [packages/suite/src/views/settings/SettingsDevice/ForgetDevice/ForgetDeviceFlows.tsx:79](../../../../packages/suite/src/views/settings/SettingsDevice/ForgetDevice/ForgetDeviceFlows.tsx#L79) — Connected Bluetooth unpair versus USB/disconnected cleanup workflows. (implementation).
- [suite-native-app/module-device-settings/src/screens/ForgetDeviceGuideScreen.tsx:19](../../../../suite-native-app/module-device-settings/src/screens/ForgetDeviceGuideScreen.tsx#L19) — Android OS settings deep link versus iOS text. (implementation).
- [suite/e2e/tests/settings/forget-device.test.ts:6](../../../../suite/e2e/tests/settings/forget-device.test.ts#L6) — Automated Safe 7 state variants; some Bluetooth state is mocked. (automated-test).
- [suite/e2e/tests/manual/settings/forget-device.test.ts:100](../../../../suite/e2e/tests/manual/settings/forget-device.test.ts#L100) — Manual Safe 7 paired USB/disconnected/Bluetooth state matrix. (manual-test).

Runtime: No matching model-specific observation is recorded in the manifest snapshot. A reached UI state does not verify model exclusions, physical behavior or firmware boundaries.

### Charging guidance before firmware installation

Find it: Firmware install/update > Install. Confidence: **high**. Existing features: `onboarding.firmware`, `device-settings.firmware.official-update`.

| Model | Source expectation                                                                                            |
| ----- | ------------------------------------------------------------------------------------------------------------- |
| T1B1  | No Bluetooth battery path evidenced.                                                                          |
| T2T1  | No Bluetooth battery path evidenced.                                                                          |
| T2B1  | No Bluetooth battery path evidenced.                                                                          |
| T3B1  | No Bluetooth battery path evidenced.                                                                          |
| T3T1  | No Bluetooth battery path evidenced.                                                                          |
| T3W1  | Firmware update blocked on Bluetooth when charge is below threshold or unreadable and device is not charging. |

Prerequisites: Bluetooth connection required for gate; USB or wireless charging bypasses it. Threshold is 40%; missing soc counts as low. Both desktop/web firmware flow and native onboarding/settings firmware screens use the shared selector.

- [suite-common/device/src/deviceSelectors.ts:216](../../../../suite-common/device/src/deviceSelectors.ts#L216) — Checks Bluetooth, USB/wireless charging, numeric soc and threshold. (implementation).
- [suite-common/device/src/deviceConstants.ts:14](../../../../suite-common/device/src/deviceConstants.ts#L14) — Threshold = 40. (implementation).
- [suite/firmware-upgrade/src/useFirmwareDesktopUpdate.ts:62](../../../../suite/firmware-upgrade/src/useFirmwareDesktopUpdate.ts#L62) — Desktop/web firmware update returns early and shows modal. (implementation).
- [suite-native-app/module-device-settings/src/screens/ConfirmFirmwareUpdateScreen.tsx:28](../../../../suite-native-app/module-device-settings/src/screens/ConfirmFirmwareUpdateScreen.tsx#L28) — Native update confirmation returns before installation navigation. (implementation).

Runtime: runtime-web-t3t1-onboarding-firmware A reached UI state does not verify model exclusions, physical behavior or firmware boundaries.

### Firmware type switch and wallet-erasure warning

Find it: Settings > Device > Firmware > Switch firmware type. Confidence: **high**. Existing features: `device-settings.firmware-type`.

| Model | Source expectation                                                                             |
| ----- | ---------------------------------------------------------------------------------------------- |
| T1B1  | Type switch does not change vendor header; FW 1.6.1 separately guaranteed to wipe.             |
| T2T1  | Type switch does not change vendor header.                                                     |
| T2B1  | Type switch changes vendor header and triggers wipe warning for initialized/bootloader device. |
| T3B1  | Type switch changes vendor header and triggers wipe warning for initialized/bootloader device. |
| T3T1  | Type switch changes vendor header and triggers wipe warning for initialized/bootloader device. |
| T3W1  | Type switch changes vendor header and triggers wipe warning for initialized/bootloader device. |

Prerequisites: Bitcoin-only hardware editions hide the switch-to-universal action. This is Suite warning computation, not assurance that any other update preserves a wallet.

- [suite-common/firmware/src/hooks/useFirmwareInstallation.ts:37](../../../../suite-common/firmware/src/hooks/useFirmwareInstallation.ts#L37) — Model-specific vendor-header wipe determination. (implementation).
- [packages/suite/src/views/settings/SettingsDevice/FirmwareTypeChange.tsx:72](../../../../packages/suite/src/views/settings/SettingsDevice/FirmwareTypeChange.tsx#L72) — Hardware Bitcoin-only variants do not offer switch action. (implementation).
- [suite/e2e/tests/manual/firmware/firmware-switch.test.ts:8](../../../../suite/e2e/tests/manual/firmware/firmware-switch.test.ts#L8) — Manual firmware-type switching parent scenario. (manual-test).

Runtime: No matching model-specific observation is recorded in the manifest snapshot. A reached UI state does not verify model exclusions, physical behavior or firmware boundaries.

### Manual firmware reboot and exit instructions

Find it: Firmware installation > Reconnect / device in bootloader. Confidence: **high**. Existing features: `connection.bootloader`, `device-settings.firmware.official-update`.

| Model | Source expectation                                                              |
| ----- | ------------------------------------------------------------------------------- |
| T1B1  | Below 1.8.0: hold both buttons; newer: left button; reconnect normally to exit. |
| T2T1  | Swipe touchscreen for bootloader; reconnect without touch to exit.              |
| T2B1  | Hold left button; reconnect without button to exit.                             |
| T3B1  | Hold left button; reconnect without button to exit.                             |
| T3T1  | Swipe touchscreen for bootloader; reconnect without touch to exit.              |
| T3W1  | Swipe touchscreen instructions; exit bootloader by restart from device menu.    |

Prerequisites: Shared flow documentation distinguishes manual below 1.10.0/2.6.0, reboot-and-wait newer versions, reboot-and-upgrade >=2.6.3 (excludes reinstall/downgrade). Actual UI follows emitted reconnect events and installation state.

- [packages/suite/src/components/firmware/ReconnectDevicePrompt.tsx:150](../../../../packages/suite/src/components/firmware/ReconnectDevicePrompt.tsx#L150) — Model and Model One <1.8.0 instruction mapping. (implementation).
- [packages/suite/src/utils/device/bootloader.ts:10](../../../../packages/suite/src/utils/device/bootloader.ts#L10) — Safe 7 exit instruction differs. (implementation).
- [suite-common/firmware/src/hooks/useFirmwareInstallation.ts:30](../../../../suite-common/firmware/src/hooks/useFirmwareInstallation.ts#L30) — Documented firmware update flow thresholds. (implementation).
- [suite/e2e/tests/manual/firmware/bootloader.test.ts:6](../../../../suite/e2e/tests/manual/firmware/bootloader.test.ts#L6) — Manual bootloader parent scenarios; not executed. (manual-test).

Runtime: No matching model-specific observation is recorded in the manifest snapshot. A reached UI state does not verify model exclusions, physical behavior or firmware boundaries.

### NFC backup medium and additional NFC backup

Find it: Device onboarding > Backup medium / Settings > Device > Additional backup. Confidence: **high**. Existing features: `onboarding.new-wallet.nfc`, `device-settings.backup.additional-nfc`.

| Model | Source expectation                                                                                                |
| ----- | ----------------------------------------------------------------------------------------------------------------- |
| T1B1  | Experimental/debug-gated UI; do not infer production availability or hardware support from the visible component. |
| T2T1  | Experimental/debug-gated UI; do not infer production availability or hardware support from the visible component. |
| T2B1  | Experimental/debug-gated UI; do not infer production availability or hardware support from the visible component. |
| T3B1  | Experimental/debug-gated UI; do not infer production availability or hardware support from the visible component. |
| T3T1  | Experimental/debug-gated UI; do not infer production availability or hardware support from the visible component. |
| T3W1  | Experimental/debug-gated UI; do not infer production availability or hardware support from the visible component. |

Prerequisites: selectIsN4w1BackupEnabled reads suiteSettings.debug.isN4w1BackupEnabled. NFC backup creation uses SLIP39; usable hardware and firmware support are additional prerequisites. Safe 7 fixture advertises Capability_NFC; the inspected medium choice does not itself enforce a model allowlist.

- [suite/settings/src/settingsSelectors.ts:59](../../../../suite/settings/src/settingsSelectors.ts#L59) — NFC backup selector comes from debug state. (implementation).
- [packages/suite/src/views/onboarding/steps/BackupTypeStep.tsx:40](../../../../packages/suite/src/views/onboarding/steps/BackupTypeStep.tsx#L40) — NFC medium screen initially follows debug flag. (implementation).
- [packages/suite/src/views/onboarding/steps/SecurityStep.tsx:67](../../../../packages/suite/src/views/onboarding/steps/SecurityStep.tsx#L67) — NFC reset/backup branch is SLIP39-specific. (implementation).
- [suite/e2e/fixtures/remembered-wallet-db-lite.json:4350](../../../../suite/e2e/fixtures/remembered-wallet-db-lite.json#L4350) — Safe 7 fixture reports NFC, not an observation or proof of product rollout. (automated-test).

Runtime: No matching model-specific observation is recorded in the manifest snapshot. A reached UI state does not verify model exclusions, physical behavior or firmware boundaries.

### PIN, safety checks and wipe code visibility

Find it: Settings > Device > Security / Advanced. Confidence: **high**. Existing features: `device-settings.pin`, `device-settings.change-pin`, `device-settings.safety-checks`, `device-settings.wipe-code`.

| Model | Source expectation                                                    |
| ----- | --------------------------------------------------------------------- |
| T1B1  | Mode/feature-field gates; no model allowlist in these Suite controls. |
| T2T1  | Mode/feature-field gates; no model allowlist in these Suite controls. |
| T2B1  | Mode/feature-field gates; no model allowlist in these Suite controls. |
| T3B1  | Mode/feature-field gates; no model allowlist in these Suite controls. |
| T3T1  | Mode/feature-field gates; no model allowlist in these Suite controls. |
| T3W1  | Mode/feature-field gates; no model allowlist in these Suite controls. |

Prerequisites: Normal mode: PIN protection and wipe code are composed; Change PIN requires pin_protection; safety-check button requires truthy safety_checks. Native settings composition exposes PIN management but does not compose desktop advanced safety-check/wipe-code controls. Firmware method availability is separate from a visible button; this audit does not assert old-firmware wipe-code support.

- [suite-app/app/src/pages/SettingsDevicePage.tsx:219](../../../../suite-app/app/src/pages/SettingsDevicePage.tsx#L219) — Security section composition checks features fields. (implementation).
- [suite-app/app/src/pages/SettingsDevicePage.tsx:269](../../../../suite-app/app/src/pages/SettingsDevicePage.tsx#L269) — Wipe code composed only in normal mode. (implementation).
- [suite-native-app/module-device-settings/src/screens/DeviceSettingsScreen.tsx:52](../../../../suite-native-app/module-device-settings/src/screens/DeviceSettingsScreen.tsx#L52) — Native security section composition. (implementation).
- [suite/e2e/tests/manual/settings/pin-and-wipe-code.test.ts:8](../../../../suite/e2e/tests/manual/settings/pin-and-wipe-code.test.ts#L8) — Manual PIN and wipe-code scenarios are intended behavior, not executed results. (manual-test).

Runtime: No matching model-specific observation is recorded in the manifest snapshot. A reached UI state does not verify model exclusions, physical behavior or firmware boundaries.

## Asset and firmware compatibility

The [machine-readable audit](./model-capabilities.json) includes raw BTC/ADA/SOL/XRP/TRX CoinInfo minima and additional Taproot, EIP-1559, EVM-approval and Cardano-signing gates. Model One has no Cardano/Solana/XRP/Tron CoinInfo support in the current data. Effective support combines CoinInfo, firmware capability, method minima, firmware type and the Suite network composition. Raw data minima alone do not prove a usable screen.

The executable MCU-authentication minimum for Safe 7 is **2.12.1** in Connect config. A Suite authenticity utility comment still says **2.11.2**. Treat the executable rule as authoritative and retain the discrepancy as a source-quality issue.

## Proposed missing leaves

The [separate contributor-format proposals](../parts/runtime-model-additions.json) add these user outcomes without editing existing records:

- `device-settings.firmware.low-battery` — **Charge before firmware installation**. Review the charging requirement when a Bluetooth-connected Trezor cannot safely start firmware installation.
- `onboarding.mobile-unsupported-setup` — **Continue unsupported native setup in Suite web**. Open Suite web from native guidance when a connected uninitialized Trezor model cannot be set up in the mobile app.
- `device-settings.forget.os-pairing` — **Remove operating-system Bluetooth pairing**. Follow the operating-system pairing-removal instructions and open Bluetooth settings where the platform supports it.
- `device-settings.forget.on-device-pairing` — **Remove the saved host pairing on Trezor**. Follow the device-side pairing cleanup instructions when forgetting a Trezor with saved Bluetooth pairing history.

The two pairing cleanup leaves expand the existing broad Forget feature. Low-battery update guidance and unsupported native setup handoff were absent as named outcomes. These proposals are source-backed and unobserved; merging them must not imply screenshots or runtime execution.

Already-covered capabilities remain intact: PIN, backup type/defaults, recovery mode, tutorial, authenticity, brightness, haptics, rotation, device language, homescreen, THP/autoconnect, firmware type switching and bootloader flows. Cryptographic proof mechanisms and SDK-only methods do not become separate Suite features without a user-facing action.

## Evidence limits

- Tests and fixtures were read as intended scenarios; no test run is claimed.
- Browser captures cannot verify physical vibration, brightness output, packaging, radio behavior or seed recovery.
- NFC selection currently reads a debug flag. Its components and Safe 7 fixture capability do not prove a released feature for every model.
- This snapshot links only actual model observations already present in the root-maintained runtime manifest. Refresh links when new evidence is appended.
- Artifact validation checks source paths, lines, hashes, IDs and contributor fields. It does not execute firmware boundary or hardware tests.

## Integration update

The root audit has subsequently integrated all four proposed leaves into the live manifest and canonical dataset (573 nodes, including all 569 original nodes). The proposal file records the earlier proposal stage. Integration establishes source-backed inventory coverage; it does not establish that these new UI states have been reached or captured. The runtime links above remain the explicitly dated audit snapshot.
