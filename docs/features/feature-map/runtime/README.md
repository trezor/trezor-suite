# Runtime audit supplement

This supplement adds direct application observations to the original source inventory. The original catalog is preserved by the [baseline manifest](./baseline.json): the verifier checks every original feature's fields and all historical screenshot references. New capabilities and evidence are additions.

The [audit outcome](./report.md) summarizes the current additions, platform evidence and remaining limits. Machine-readable totals are in [summary.json](../summary.json).

The [offline explorer](../explorer.html) shows current captures in each feature's detail. The [observation manifest](../parts/runtime-observations.json) records the navigation, platform, internal device model, firmware, conditions, capture timestamp, and screenshot associations. Later captures, such as the 2026 release-note additions, are kept in the [runtime supplement](../parts/runtime-supplement.json); the builder appends them to the pinned manifest, which stays byte-identical. An observation proves the described screen or interaction only; it does not mean every descendant, transaction, provider, or device variant was exercised. Explicit errata preserve an original evidence record while showing its correction and excluding the superseded claim from coverage totals.

## Environment and fixture interpretation

The web application runs from commit `8d6be9edbf990465176d57b4abc007bac17ca5e6` at `http://localhost:8000`, using the repository's pinned Yarn and development command. Chromium 156 runs in an isolated Playwright profile with English UI and a 1440×1000 viewport. The shared browser could not start because the host lacks its required libraries; the local browser uses existing Nix libraries. Headless-browser compatibility guidance is recorded as an environment condition, not a claim that ordinary Chrome is unsupported.

Trezor User Env runs from a task-only copy with fresh emulator profiles. Existing user profiles are untouched. The controller, bridge, backend fixtures, and emulator UI services bind locally. App captures contain only disposable QA data. Device displays, seed words, entered PINs, passphrases, and wipe codes are excluded.

The browser blocks external account traffic, telemetry, remote WebSockets, and provider execution. Public firmware and static application assets may be fetched without application headers or cookies. Bitcoin, Ethereum, Cardano, Solana, and Tron use local synthetic backends adapted from repository test fixtures. Trading and Yield use local test responses. Balances, history, rates, APYs, eligibility and quoted offers in captures illustrate application UI; they do not represent chain state or current commercial offers. No provider checkout or real-chain transaction is part of this audit.

Fresh-emulator firmware integrity can fail against production firmware metadata. The warning is captured, then the same QA security-check preferences used by E2E tests permit emulator exploration. Captures that show disabled authenticity preferences are explicitly conditioned test states.

The fixture routing above describes the web audit. The [native build](./native-build.json) runs current source on an iOS simulator with no imported account. Its empty-wallet Earn screen may display public opportunity data; it does not use the web route mocks. No account descriptor or address was imported and no account discovery was initiated. Native camera images demonstrate permission and fallback UI, not successful scanning. The original mobile captures come from the iPhone Duo simulator. The same app build was re-captured on iPhone 18 Pro (iOS 27.2) for all 58 of the 58 screens; the [device variants](../parts/runtime-device-variants.json) list these explorer-only re-captures, including the startup storage-recovery alert (`mobile-storage-recovery`), which is reproduced via the entitlement-stripped `keychain-unavailable` start state in [prepare-start-state.sh](./flows/prepare-start-state.sh). An initial simulator-signing storage error is retained as a qualified recovery-screen observation; the corrected, signed build subsequently ran normally.

## Models and coverage

The [model matrix](./model-capabilities.md) and [structured model data](./model-capabilities.json) separate source-derived gates from actual observations. The [observed model comparison](./model-runtime-comparison.md) records the separate emulator passes. T2B1 and T3B1 are separate Safe 3 internal variants; running one does not verify the other's packaging or firmware conditions. A missing emulator capability does not establish that a physical model lacks that capability. Bluetooth, NFC, secure-element authenticity and OS pairing require their corresponding transport or hardware environment.

The [planned journey checklist](../parts/runtime-checklist.json) is a work queue, not completed evidence. Current observed coverage is calculated from the observation manifest by the builder. Features without observations remain in the catalog and are labeled as not captured in the explorer.

The [coverage spreadsheet](../runtime-coverage.csv) gives every feature a separate runtime status for desktop, web and mobile, alongside source availability and current screenshot paths. `not-observed` does not mean unavailable. Corrected screenshot associations and superseded observations are excluded from its current evidence counts; their original records remain accessible in the explorer.

## Evidence quality

The [fixture interpretation](./fixtures.md) records local adapters and their limits. Visual reviews cover the [first web batch](./screenshot-quality.md), [second web batch](./screenshot-quality-second-pass.md), [mobile batch](./screenshot-quality-mobile.md), [desktop batch](./screenshot-quality-desktop.md), [final web batch](./screenshot-quality-final-web.md), and [Cardano batch](./screenshot-quality-cardano.md). Their dated findings are retained even when a later focused capture fills a gap. Corrections are additive and do not remove features or original images.

## Capture flows

Each native mobile capture has a replayable flow in [capture-flows.json](../parts/capture-flows.json): start state, steps that tap exposed testIDs or OCR-located text (Suite Native's `Screen` container exposes each screen to iOS accessibility as one element), and the arrival route with landmarks. `node docs/features/feature-map/capture-flows.ts check` (requires tesseract; set `TESSERACT=` for a non-default binary) OCR-checks that every capture shows its landmarks and writes `flow-checks.json`. `node docs/features/feature-map/capture-flows.ts replay --agent-device <cli> [--device <name>] [--start-state fresh-install|keychain-unavailable|onboarded-empty] [--setup] [--update-captures] [ids…]` replays flows on the simulator bound to that agent-device CLI, updates each flow's status and replays, and with `--update-captures` replaces the device's capture in `screenshots/<device-slug>/` with the arrival screenshot; `fresh-install` and `keychain-unavailable` flows need the simulator prepared first with [prepare-start-state.sh](./flows/prepare-start-state.sh). See [Capture flows and landing check](../README.md#capture-flows-and-landing-check).

## Rebuild

Run `node docs/features/feature-map/build.ts`, format the generated JSON with the repository's Prettier, and run `node docs/features/feature-map/verify.ts`. The verifier checks that all original nodes and fields survive, every capture exists, every observation refers to known features, and corrections refer to retained evidence.
