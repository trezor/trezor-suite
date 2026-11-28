# Runtime model comparison

This pass added **25 inspected web captures** across Model One, Model T, Safe 3 and Safe 7. Earlier Safe 5 evidence remains intact. No distinct T2B1 emulator was available; original Safe 3 packaging/defaults remain source-only.

The local app used English at 1440×1000, synthetic QA fixtures and USB/node-bridge emulation. Model and firmware were read independently from actual Features. Safe 7 required local THP confirmation/pairing before fresh metadata was trusted; its ephemeral code was never printed, saved or captured in populated inputs.

| Model | Firmware | Language                        | Rotation                        | Brightness                      | Haptics                         | Check device                    | Auto-connect                    |
| ----- | -------- | ------------------------------- | ------------------------------- | ------------------------------- | ------------------------------- | ------------------------------- | ------------------------------- |
| T1B1  | 1.14.1   | Absent in inspected composition | Absent in inspected composition | Absent in inspected composition | Absent in inspected composition | Absent in inspected composition | Absent in inspected composition |
| T2T1  | 2.12.5   | Visible                         | Visible                         | Visible                         | Absent in inspected composition | Absent in inspected composition | Absent in inspected composition |
| T3B1  | 2.12.5   | Visible                         | Absent in inspected composition | Absent in inspected composition | Absent in inspected composition | Visible                         | Absent in inspected composition |
| T3W1  | 2.12.5   | Visible                         | Absent in inspected composition | Visible                         | Visible                         | Visible                         | Visible                         |
| T3T1  | 2.12.5   | Visible                         | Visible                         | Visible                         | Visible                         | Visible                         | Absent in inspected composition |
| T2B1  | Not run  | Source-only                     | Source-only                     | Source-only                     | Source-only                     | Source-only                     | Source-only                     |

“Visible” means the app control exists in the inspected fixture state. It does not prove a completed setting change, hardware authenticity or physical output. Safe 5 rows reuse the earlier root captures.

## Reached differences

- **Model One 1.14.1:** 128×64 monochrome wallpaper; host-assisted Check backup with 12/18/24-word choices and Standard/Advanced options after selecting 24. Empty 3×3 host PIN matrix reached, then canceled; PIN stayed disabled.
- **Model T 2.12.5:** 240×240 wallpaper, language, rotation and brightness. Backup-check instructions use the touchscreen. PIN setup gives app-side device instructions without a host matrix; canceled with PIN still disabled.
- **Safe 3 T3B1 2.12.5:** 128×64 monochrome wallpaper, language and Check device. Full customization card has no rotation/brightness/haptics. Backup-check guidance uses the two-button pad.
- **Safe 7 T3W1 2.12.5:** 380×520 wallpaper, brightness, haptics, Check device and THP Auto-connect; no rotation. Backup-check guidance uses touchscreen input. Only USB THP was actually connected; BLE/NFC flags are not physical coverage.

## Wallet access

Safe 7 captures show the connected wallet switcher, Standard wallet entries, hidden-wallet New/Open previously used choices, an empty host passphrase form and app-side device-entry guidance. Passphrase protection was enabled only on the disposable QA emulator to reveal these forms. No passphrase was typed; no hidden-wallet discovery or successful hidden-wallet access is claimed. Duplicate remembered QA instances in the selector reflect reuse of the emulator path.

## Context correction

The backup selectors were reached through **Settings → Device → Check wallet backup**, not onboarding or actual wallet recovery. Four original shared-component associations are retained with explicit errata limiting their screenshot mapping to `device-settings.check-backup`. Merge the side manifest’s `errata` array alongside its observations and screenshots.

## Artifacts and limits

- [Side manifest](../parts/runtime-model-observations.json): 25 observations, 25 screenshots, four context errata; main manifest was not modified by this agent.
- [Detailed comparison](./model-runtime-comparison.json): per-model state, retained Safe 5 capture IDs, source expectations, capture hashes and exact limits.
- Fresh create/recover onboarding and default backup choices were not rerun. No seed/PIN/passphrase was entered, no device screenshot was saved, and no firmware/erase action completed.
- No new feature node is needed for the reached surfaces; they enrich existing capabilities.
- At handoff the browser was confirmed `about:blank`, the task bridge and emulator were stopped successfully, and runtime control was released to the root audit.
