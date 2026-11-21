# Runtime audit outcome

The current inventory contains **578 feature nodes**. All **569 original feature records** and their historical screenshot references remain preserved. Runtime/source inspection added **9 capabilities**. The [offline explorer](../explorer.html) combines the hierarchy, navigation, platforms, ownership, source roots, conditions, observations and images.

There are **238 current application screenshots**, with **306 feature nodes currently associated with captures**. Active observation records cover **271 feature nodes**. These are different measures: one image may show several controls; a visited entry does not verify its descendants or execution. Screenshot corrections remain visible and original evidence is retained.

## Platform evidence

| Platform | Active observed records | Screenshots | Feature nodes in active observations |
| -------- | ----------------------: | ----------: | -----------------------------------: |
| Web      |                     139 |         167 |                                  223 |
| Desktop  |                      13 |          13 |                                   22 |
| Mobile   |                      54 |          58 |                                   64 |

The [coverage CSV](../runtime-coverage.csv) lists every feature, source availability, per-platform runtime status, model context and effective screenshot paths. `not-observed` is an evidence gap, not an absence claim.

Web emulator observations include T1B1, T2T1, T3B1, T3T1, T3W1. Model One, Model T, Safe 3, Safe 5 and Safe 7 use distinct internal identifiers. T2B1, the older Safe 3 internal variant, has no separate available emulator and remains source-derived. iOS Safe 7 guidance is not a physical-device compatibility test. Read the [source model matrix](./model-capabilities.md) alongside the individual runtime conditions.

## Added capabilities

| ID                                         | Capability                                     | Description                                                                                                                   |
| ------------------------------------------ | ---------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------- |
| `onboarding.mobile-unsupported-setup`      | Continue unsupported native setup in Suite web | Open Suite web from native guidance when a connected uninitialized Trezor model cannot be set up in the mobile app.           |
| `app-settings.error-recovery`              | Recover from an application error              | Recover from an application render or startup-module failure by reloading Suite or clearing its local database and reloading. |
| `network-settings.backends.discard`        | Discard unsaved backend changes                | Choose whether to discard draft backend or explorer edits when leaving native configuration.                                  |
| `device-settings.firmware.low-battery`     | Charge before firmware installation            | Review the charging requirement when a Bluetooth-connected Trezor cannot safely start firmware installation.                  |
| `device-settings.forget.os-pairing`        | Remove operating-system Bluetooth pairing      | Follow the operating-system pairing-removal instructions and open Bluetooth settings where the platform supports it.          |
| `device-settings.forget.on-device-pairing` | Remove the saved host pairing on Trezor        | Follow the device-side pairing cleanup instructions when forgetting a Trezor with saved Bluetooth pairing history.            |
| `mobile.accounts.import.qr.gallery`        | Import a QR code from gallery                  | Choose a photo-library image and decode its QR code as an account import value.                                               |
| `mobile.accounts.import.qr.permission`     | Restore camera permission                      | Review the camera-denied explanation and open phone settings to grant camera permission for QR scanning.                      |
| `mobile.accounts.import.help`              | Find an account key or receive address         | Open illustrated guidance for locating an account public key or receive address in desktop Suite.                             |

## Interpretation and remaining limits

Application UI was explored with disposable QA state. No provider checkout or real-chain payment, swap, stake, wrap, approval or yield transaction was executed. Form, explanation and review-entry observations must not be interpreted as successful financial execution. Web balances, transaction histories, prices, offers and rates come from [local fixtures](./fixtures.md); native empty-wallet public opportunity data has its own recorded conditions.

Physical-device Bluetooth/NFC/battery behavior, production authenticity, operating-system pairing, actual camera scanning and Android runtime behavior are not established by the emulator/iOS captures. Model-specific gates, feature flags, network/provider availability and firmware prerequisites remain part of the inventory. Team attribution retains its explicit evidence/confidence; repository code ownership is not automatically product accountability.

The [runtime method](./README.md), [native build provenance](./native-build.json), visual-quality reviews and [verification record](../verification.json) describe the evidence and limitations. The artifact verifier checks structure, references, exports, evidence associations and preservation of the original records; it does not execute application flows. Automated/manual test references describe inspected scenarios, not a claim that those test suites passed.
