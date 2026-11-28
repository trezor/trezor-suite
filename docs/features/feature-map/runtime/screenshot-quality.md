# Screenshot quality review

Audit `screenshot-qc-20261115T081243Z`: inspected all **66 PNGs** in the manifest snapshot, using 11 local contact sheets plus original-size checks. Original images and runtime records remain unchanged. Later captures are outside this review.

No wholly blank or loading-only capture was found. There are **9 open findings**, **1 already-corrected mismatch**, and **5 proposed screenshot-scope errata** in [runtime-screenshot-errata.json](../parts/runtime-screenshot-errata.json). Legitimate empty states and empty graph series are qualified separately.

## Concrete capture corrections

### Dashboard asset list is below the captured viewport

Screenshot: [web-t3t1-funded-dashboard](./screenshots/web-t3t1-funded-dashboard.png). Status: **open**. Severity: medium.

Visible: Dashboard total, chart axes and range selectors, promotional card, and global asset actions are visible; no populated history series is rendered.

- My assets list and Add networks control are below the image.
- Graph container is visible but no historical series is plotted; this is not a populated-history screenshot.

Proposed visible associations: `wallet.portfolio`, `wallet.portfolio.total`, `wallet.portfolio.history`, `wallet.portfolio.history.range`, `wallet.portfolio.promotions`.

Recapture: `page.getByTestId('@dashboard/assets')` — Capture My assets list/card and its actions. scrollIntoViewIfNeeded(); inspect the resulting viewport before capture; move the pointer away from tooltips. [Source](../../../../packages/suite/src/views/dashboard/AssetsView/AssetsView.tsx#L223).

Recapture: `page.getByTestId('@dashboard/assets/enable-more-coins')` — Capture Add networks entry with surrounding assets context. scrollIntoViewIfNeeded(); inspect the resulting viewport before capture; move the pointer away from tooltips. [Source](../../../../packages/suite/src/views/dashboard/AssetsView/AssetsView.tsx#L240).

### Preset cards are cut off and Customize fee/Clear all are absent

Screenshot: [web-t3t1-bitcoin-fee-presets](./screenshots/web-t3t1-bitcoin-fee-presets.png). Status: **open**. Severity: medium.

Visible: Expanded Bitcoin fee section shows only the upper parts of Low, Normal and High preset cards; the populated form and Coin control search are visible.

- Preset amounts/rates are clipped at the bottom.
- Customize fee is below the image.
- Clear all is above the scrolled viewport.

Proposed visible associations: `wallet.send.fees`, `wallet.send.fees.preset`, `wallet.send.coin-control.search`.

Recapture: `page.getByTestId('@wallet/fee-details')` — Capture all preset cards, confirmation estimates and fee amounts/rates. scrollIntoViewIfNeeded(); inspect the resulting viewport before capture; move the pointer away from tooltips. [Source](../../../../packages/suite/src/components/wallet/Fees/CollapsibleFees/StandardFee/BitcoinFeeCards.tsx#L51).

Recapture: `page.getByTestId('@wallet/fees/select-custom-fee')` — Capture Customize fee together with fee cards. scrollIntoViewIfNeeded(); inspect the resulting viewport before capture; move the pointer away from tooltips. [Source](../../../../packages/suite/src/components/wallet/Fees/CollapsibleFees/FeeLevels/StandardFeePicker.tsx#L21).

Recapture: `page.getByTestId('clear-form')` — Take a separate send-header capture of Clear all; do not assume it fits with the fee section. scrollIntoViewIfNeeded(); inspect the resulting viewport before capture; move the pointer away from tooltips. [Source](../../../../packages/suite/src/views/wallet/send/SendHeader.tsx#L171).

### Application settings overview is mapped to off-screen controls

Screenshot: [web-t3t1-application-settings](./screenshots/web-t3t1-application-settings.png). Status: **open**. Severity: medium.

Visible: The Application tab shows Auto-eject wallets, Language, Currency, Bitcoin units and the Labeling selector.

- Theme, analytics, application log/reset/version, security, advanced and experimental controls are outside this PNG viewport.
- Later security/advanced/experimental screenshots cover some controls; this overview itself does not.

Proposed visible associations: `app-settings.auto-eject`, `app-settings.language`, `app-settings.fiat-currency`, `app-settings.bitcoin-unit`, `labeling.mode`.

Recapture: `page.getByTestId('@theme/color-scheme-select')` — Capture appearance selector and choices. scrollIntoViewIfNeeded(); inspect the resulting viewport before capture; move the pointer away from tooltips. [Source](../../../../packages/suite/src/views/settings/SettingsGeneral/Theme.tsx#L107).

Recapture: `page.getByTestId('@analytics/toggle-switch')` — Capture analytics opt-in switch and explanatory text. scrollIntoViewIfNeeded(); inspect the resulting viewport before capture; move the pointer away from tooltips. [Source](../../../../packages/suite/src/views/settings/SettingsGeneral/Analytics.tsx#L33).

Recapture: `page.getByTestId('@settings/show-log-button')` — Capture Show log entry; any opened logs must be reviewed for fixture-only safe content. scrollIntoViewIfNeeded(); inspect the resulting viewport before capture; move the pointer away from tooltips. [Source](../../../../packages/suite/src/views/settings/SettingsGeneral/ShowApplicationLog.tsx#L26).

Recapture: `page.getByTestId('@settings/reset-app-button')` — Capture reset entry without executing reset. scrollIntoViewIfNeeded(); inspect the resulting viewport before capture; move the pointer away from tooltips. [Source](../../../../packages/suite/src/views/settings/SettingsGeneral/ClearStorage.tsx#L29).

### PIN, Safety checks and authenticity controls are outside the viewport

Screenshot: [web-t3t1-device-settings](./screenshots/web-t3t1-device-settings.png). Status: **open**. Severity: medium.

Visible: Device settings show Wallet backup, Passphrase wallets, firmware Version/Type and Language; only the start of the Security/PIN section appears at the lower edge.

- PIN toggle is not visibly usable in this image.
- Safety checks and Check device are below the image.
- Check device is visibly present at the top of the later customization screenshot, but that does not make it visible in this PNG.

Proposed visible associations: `device-settings.backup`, `device-settings.passphrase`, `device-settings.firmware-version`, `device-settings.firmware-type`, `device-settings.language`.

Recapture: `page.getByTestId('@settings/device/pin-switch')` — Capture full PIN section; no PIN values or entry screens. scrollIntoViewIfNeeded(); inspect the resulting viewport before capture; move the pointer away from tooltips. [Source](../../../../packages/suite/src/views/settings/SettingsDevice/PinProtection.tsx#L52).

Recapture: `page.getByTestId('@settings/device/safety-checks-button')` — Capture safety-check entry, optionally its current-value modal without making a change. scrollIntoViewIfNeeded(); inspect the resulting viewport before capture; move the pointer away from tooltips. [Source](../../../../packages/suite/src/views/settings/SettingsDevice/SafetyChecks.tsx#L30).

Recapture: `page.getByRole('button', { name: 'Check device', exact: true })` — Capture device authenticity entry. scrollIntoViewIfNeeded(); capture Check device and its surrounding explanatory text. [Source](../../../../packages/suite/src/views/settings/SettingsDevice/AuthenticateDevice.tsx#L38).

### Account overview does not show the transaction toolbar or list

Screenshot: [web-t3t1-account-overview](./screenshots/web-t3t1-account-overview.png). Status: **open**. Severity: medium.

Visible: Account Overview shows crypto/fiat balance, graph axes/range selectors, zero-valued summary cards in the selected range, and the asset action row.

- Transaction list, search, suspicious-filter and export controls are below the captured viewport.
- No historical graph series is visible; this does not establish a populated balance-history graph.
- The later export-menu screenshot shows a transaction and search/export controls, but its menu/tooltips cover part of the filter area.

Proposed visible associations: `wallet.accounts.overview`, `wallet.accounts.overview.balance`, `wallet.accounts.overview.history-graph`, `wallet.accounts.overview.summary`.

Recapture: `page.getByTestId('@wallet/accounts/search-icon')` — Scroll the transaction toolbar into view, clear hover tooltips, and capture toolbar plus at least one synthetic transaction row. scrollIntoViewIfNeeded(); inspect the resulting viewport before capture; move the pointer away from tooltips. [Source](../../../../packages/suite/src/views/wallet/transactions/TransactionList/TransactionListActions/TransactionListActions.tsx#L64).

Recapture: `page.getByTestId('@wallet/accounts/hide-scam-transactions/dropdown')` — Capture suspicious-filter entry or its menu unobscured. scrollIntoViewIfNeeded(); inspect the resulting viewport before capture; move the pointer away from tooltips. [Source](../../../../packages/suite/src/views/wallet/transactions/TransactionList/TransactionListActions/FilterAction.tsx#L87).

Recapture: `page.getByTestId('@wallet/accounts/export-transactions/dropdown')` — Capture export entry without covering the other toolbar controls. scrollIntoViewIfNeeded(); inspect the resulting viewport before capture; move the pointer away from tooltips. [Source](../../../../packages/suite/src/views/wallet/transactions/TransactionList/TransactionListActions/ExportAction.tsx#L92).

### Known caption mismatch is already corrected

Screenshot: [web-t3t1-receive-device-verification](./screenshots/web-t3t1-receive-device-verification.png). Status: **already-corrected**. Severity: high.

Visible: The modal is a missing-wallet-backup warning with Continue anyway and Create wallet backup; it is not device address approval.

- Original caption described receive-address approval.

### Language dropdown shows a scrollable subset, not every shipped language

Screenshot: [web-t3t1-language-menu](./screenshots/web-t3t1-language-menu.png). Status: **open**. Severity: low.

Visible: System and several language options are visible; lower choices continue beyond the captured dropdown area.

- Caption says all shipped language choices, which are not all visible.

Recapture: `page.getByRole('combobox').filter(...) or the Language section selector; inspect actual DOM locator first` — Document remaining language options without claiming an unseen complete list. Take a second capture after scrolling the dropdown list, or narrow the description to the visible subset. [Source](../../../../packages/suite/src/views/settings/SettingsGeneral/Language.tsx#L64).

### Currency options are visible but search interaction is not demonstrated

Screenshot: [web-t3t1-fiat-currency-menu](./screenshots/web-t3t1-fiat-currency-menu.png). Status: **open**. Severity: low.

Visible: An opened Currency menu displays fiat codes and full names; no entered search query or filtered result is visible.

- Caption calls selection searchable; the screenshot alone does not establish successful search interaction.

Recapture: `Currency selector in Settings > Application > Localization` — Show search behavior separately from opening choices. Focus the selector, enter a harmless currency-code query and capture the filtered list; preserve the original menu screenshot. [Source](../../../../packages/suite/src/views/settings/SettingsGeneral/BaseCurrency.tsx#L20).

### Full changelog link is below the captured notes

Screenshot: [web-t3t1-release-notes](./screenshots/web-t3t1-release-notes.png). Status: **open**. Severity: low.

Visible: Current-version release notes show New features, Improvements and the upper Bug fixes list.

- The link to the full changelog is below the screenshot.

Recapture: `page.getByRole('link', { name: 'Open the changelog on GitHub', exact: true })` — Document actual changelog link. scrollIntoViewIfNeeded(); capture the release-notes footer without opening the external link. [Source](../../../../packages/suite/src/components/suite/notifications/ReleaseNotes/ReleaseNotes.tsx#L28).

### General and keyboard-focus shortcuts continue below the image

Screenshot: [web-t3t1-keyboard-shortcuts](./screenshots/web-t3t1-keyboard-shortcuts.png). Status: **open**. Severity: low.

Visible: Shortcut sidebar shows Security, Wallets & accounts, Navigation and the beginning of General.

- Keyboard focus controls are not visible; most General rows extend below the viewport.

Recapture: `page.getByText('Focus next element', { exact: true })` — Document remaining shortcut groups. scrollIntoViewIfNeeded() inside the help drawer; capture the lower General and focus-control sections. [Source](../../../../packages/suite/src/components/guide/GuideShortcuts.tsx#L164).

## Remaining useful journeys

The snapshot has 160 non-superseded observed feature-ID links, all on web and with Safe 5 as the only model-linked device. This is not a completeness measure. After narrowing only the five incorrect screenshot scopes, use the machine-readable report for conservative visual linkage and the full 32-journey comparison.

| Area                                       | Baseline leaves | Not linked to an observation |
| ------------------------------------------ | --------------: | ---------------------------: |
| Earn                                       |              58 |                           58 |
| Trade                                      |              57 |                           57 |
| Send                                       |              53 |                           30 |
| Portfolio and asset overview               |              25 |                           23 |
| Connected applications                     |              17 |                           16 |
| Application settings                       |              33 |                           16 |
| Account management                         |              27 |                           15 |
| Labeling and secure synchronization        |              16 |                           15 |
| Device connection and authorization        |              16 |                           14 |
| Token management                           |              14 |                           14 |
| Device settings                            |              31 |                           14 |
| Device onboarding                          |              23 |                           12 |
| Wallet and device access                   |              11 |                           11 |
| Transaction history                        |              19 |                            9 |
| Application navigation and window controls |               9 |                            9 |
| Coinjoin privacy account                   |               9 |                            9 |
| Receive                                    |              16 |                            7 |
| NFT viewing and visibility                 |               7 |                            7 |
| Sign and verify messages                   |               7 |                            7 |
| Help and activity                          |              17 |                            7 |
| Application onboarding                     |               4 |                            3 |
| Network settings                           |               9 |                            2 |

1. **app-preferences, device-settings-compare, portfolio-overview, transaction-history, send-fees** — Finish the five concrete capture-scope gaps first; the relevant web Safe 5 state is already available. Focused recaptures described in findings; preserve originals and append corrections.

2. **trade-buy, trade-sell, trade-swap** — Trade has the largest untouched commercial-journey branch: 57 baseline leaves lack linked observations at this snapshot. Open Buy/Sell/Swap entry and safe forms, asset/account selectors, amount/currency, country/residence, fee/provider/offers and detail/history states; stop before purchase/payment/sign/broadcast. Record provider/region/network blocks honestly.

3. **earn-staking, earn-yield** — Earn entry is captured, but all 58 baseline leaf records remain unlinked; the opportunity table is not a staking or vault flow. Enable only QA networks where available; inspect staking stake/unstake/claim preflights and vault selection/deposit/withdraw/approval states without submitting.

4. **wallet-selector, message-signing, tokens, nft-visibility** — Wallet access, message signing, tokens and NFTs have no linked leaf observations in the snapshot. Wallet/device switcher and hidden-wallet entry without secrets; sign/verify empty forms; token visibility/manage dialogs; NFT disabled/enabled and collection empty states using QA fixture data.

5. **device-recovery, backup-format-variants, device-settings-compare, firmware-modes** — Only Safe 5 is model-observed. Model One host-matrix recovery, original Safe 3 packaging defaults and Safe 7 wireless/THP differences remain untested visually. Use isolated model fixtures; capture recovery entry/word-count/mode guidance without seed words, model-specific settings, bootloader guidance, Bluetooth/THP and charging preflights. Keep all secret input off screenshots.

6. **external-apps, label-storage** — Only connection/labeling entries and empty states are captured. Permission/session operations and label synchronization are not covered. Local QA dApp permission/proposal and session review if available; Suite Sync setup/status, label edit and sync conflict states; external provider authorization only within preauthorized safe QA context.

7. **desktop-shell, app-first-run, portfolio-overview** — No Electron desktop or native mobile screenshots exist in this snapshot; web screenshots do not prove native parity. Desktop native menu/auto-update/OS integrations and mobile onboarding, asset-first Home, account import, camera, biometric app lock and device-connect states if a prepared simulator/build is available.

## Interpretation and evidence limits

- A containing page, mode selector or empty state does not verify controls below the fold, successful actions or deeper journeys.
- The 573-node canonical map remains intact; the checklist refers to the original 569-node baseline. Its planned screenshot states remain planned until individually reached.
- App-side device prompts cannot verify physical display brightness, vibration, address comparison, recovery or firmware installation.
- Original screenshot/observation descriptions are preserved. Proposed errata narrow visual association scope; they do not claim that the earlier DOM inspection never happened.
- Read [screenshot-quality.json](./screenshot-quality.json) for per-image hashes, dimensions, individual limits, source-backed recapture locators and exact snapshot coverage.

## Exact locator follow-up

The source-backed language selector is `page.getByTestId('@settings/language-select')`; the currency selector is `page.getByTestId('@settings/fiat-select')`. These exact test IDs supplement the earlier generic focus instructions. Scroll the relevant selector and then its open menu; capture only the visible option subset or an actual harmless filtered result.
