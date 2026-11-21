# Native screenshot visual quality review

Reviewed all **58 PNGs** from the mobile runtime manifest using ten temporary contact sheets, plus seven original-resolution checks covering Home, backend configuration, tracker help/manual input, camera authorization/fallback and Safe 7 instructions. No UI/device actions or original manifest/image edits were made.

[Structured audit](./screenshot-quality-mobile.json) includes image hashes, dimensions and a scope note for every image. [Additive errata](../parts/runtime-mobile-qc-errata.json) contain four narrow corrections.

## Capture scope

The current source is `8d6be9edbf990465176d57b4abc007bac17ca5e6`, product version `26.12.1`, on an isolated iOS 27.2 simulator. The first storage-error image records the initial unsigned QA build configuration; the other images follow the successful Release QA simulator ad-hoc signing rebuild. No physical model, Android flow, wallet import or Bluetooth pairing is established.

Saved images are 466 × 678 pixels and include simulator/status-area overlap. Long lists and below-the-fold controls require separate captures; a visible settings entry does not prove its deeper workflow. The full settings collection spans multiple captures rather than one complete list.

## Corrections

### mobile-empty-home

The no-wallet Home shows the Connect your Trezor Safe 7 card and Connect action, the beginning of a hardware promotion and the bottom navigation. Sync & Track is outside this image; the later mobile-home-tracker-entry capture separately shows it.

- Visible text: Sync & Track — Scroll Home to the tracker card and capture its complete heading, description and Sync & Track action; mobile-home-tracker-entry already supplies this separate state. [Source](../../../../suite-native-app/module-home/src/screens/HomeScreen/components/EmptyPortfolioCrossroads.tsx#L125).

### mobile-settings-preferences

Preferences shows full Language, Currency and Bitcoin units cards. The Theme heading and tops of theme preview cards appear at the lower edge, but their complete labels/options are outside this screenshot; separate theme captures show those choices.

- Visible Theme card; Standard, Dark and System labels — Scroll Theme into view without changing the selected mode; mobile-settings-theme already provides the complete selector. [Source](../../../../suite-native-app/module-settings/src/components/ColorSchemePicker.tsx#L16).

### mobile-settings-bitcoin-backend

Bitcoin backend shows Disconnected, Trezor default server type and Connect. Explorer shows the default Root URL and full Transaction path field; the Address path field starts at the lower edge and is incomplete. No connection or configuration change is demonstrated.

- Explorer card: Root URL, Transaction path, Address path — Scroll the complete Explorer card into view; capture each path and its input without entering or connecting to any account endpoint. [Source](../../../../suite-native-app/module-settings/src/components/NetworkExplorerCard.tsx#L71).

### mobile-empty-yield

The lower portion of the no-wallet Yield list shows USDC, USDT and ETH vault rows, including Ethereum and Base variants, with Morpho attribution. The top row is clipped; this is not a capture of the entire available Yield catalog. No deposit or approval is shown.

- Visible DeFi Yield section and vault-name rows — Capture the top and bottom of the Yield opportunity list separately; do not label either viewport as the complete catalog unless every row is visible. [Source](../../../../suite-native/module-earn/src/components/yield/YieldPromoListItem.tsx#L63).

## Privacy and interaction limits

No sensitive screenshot was identified. The tracker QR is a bundled decorative SVG. The captured XPUB-help video frame contains deliberately blurred illustrative account content and instructional text; no active-wallet key or secret is visible. Only the saved frame was inspected, not every source-video frame. Empty manual forms and deliberately invalid drafts do not establish a completed import; DEV fixture buttons remain QA context.

The system camera dialog and denied-permission fallback clearly expose their controls. No camera authorization success, QR recognition, gallery selection or imported photo is shown. The camera dialog names the QA app with Debug in its display name.

Public no-wallet Earn screens show indicative rates and restriction sheets. They do not prove current provider eligibility or any staking/Yield transaction, and are not assumed to use the separate web-only mock adapters. The Yield restriction sheet actually says Staking is disabled; the report preserves that wording. The FAQ and bundled Safe 7 power-button animation prove user guidance only, not hardware compatibility or pairing.

Verification: all 58 original PNG hashes, known feature/observation references, source locations and documentation links checked; source manifests and screenshots remain untouched.
