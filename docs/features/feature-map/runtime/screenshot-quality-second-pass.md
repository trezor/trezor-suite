# Screenshot quality: second visual pass

Reviewed 45 actual PNGs, numbered 66–110 in the captured manifest snapshot: 44 newer images and screenshot 66 rechecked from the first pass. Eight temporary contact sheets covered every image; captures 70, 85, 107 and 109 were also inspected at original size. No browser, device, original image or main observation record was changed.

The structured [audit](./screenshot-quality-second-pass.json) records every image hash and scope limit. [Proposed additive errata](../parts/runtime-second-pass-errata.json) preserve the original records and narrow screenshot evidence only.

## Findings

### web-t3t1-portfolio-assets-visible

Dashboard total, empty history axes/range controls and a promotion are visible. The My assets heading, Add networks and layout controls appear at the lower edge; no asset rows/cards are visible.

- `page.getByTestId('@dashboard/assets')` — Scroll the asset container fully into view and capture at least one complete row/card with prices/actions; include layout controls in a second capture if necessary. [Source](../../../../packages/suite/src/views/dashboard/AssetsView/AssetsView.tsx#L223).

### web-t3t1-ethereum-stake-form

Stake ETH shows an empty amount field, crypto/fiat input toggle, fractions/Max, a Maximum fee row reading To be calculated, activation timeline and a collapsed Estimated rewards section.

- `page.getByTestId('@staking/form')` — Enter a harmless QA amount without submitting; expand fee details and estimated rewards, wait for local calculation, then capture the form. If the mock cannot calculate them, keep the state explicitly uncalculated. [Source](../../../../packages/suite/src/components/earn/modals/StakeModal/StakeForm/StakeInputs.tsx#L168).

### web-t3t1-ethereum-unstake-form

Unstake ETH shows a populated amount, fractions/Max and Rewards quick-select, a calculated maximum fee, deactivation timing and a later claim step. No separate estimated reward result is visible.

### web-t3t1-solana-stake-form

Stake SOL shows an empty amount, fractions/Max, Network fee (including rent) reading To be calculated, activation/reward timeline and a collapsed Estimated rewards section; Continue is disabled.

- `page.getByTestId('@staking/form')` — Enter a harmless QA amount without submitting; expand fee details and estimated rewards, wait for local calculation, then capture the form. If the mock cannot calculate them, keep the state explicitly uncalculated. [Source](../../../../packages/suite/src/components/earn/modals/StakeModal/StakeForm/StakeInputs.tsx#L168).

### web-t3t1-tron-provider-consent

Tron provider consent explains representative voting, retained ownership, provider terms and transaction-ID processing, followed by an unchecked acknowledgement and disabled Confirm. This image does not show allocation or a completed vote.

- `page.getByTestId('@staking/tron-vote/continue-button')` — Reach the separate Vote step using a suitable local frozen-resource fixture; capture representative allocation without submitting. [Source](../../../../packages/suite/src/components/earn/staking/tron/vote/TronVoteSubmitButton.tsx#L90).

### web-t3t1-yield-vault-opportunities

Earn shows staking opportunities and the beginning of DeFi Yield: the ETH vault row is complete, the USDC row is clipped, and the USDT vault row is not visible. The three-vault catalog is established separately by the initial opportunity capture and fixture source.

- `page.getByTestId('@earn/dashboard/row/steakusdt-prime-eth')` — Scroll the USDT opportunity row fully into view and capture the complete Yield table, using more than one viewport if required. [Source](../../../../packages/suite/src/components/earn/dashboard/yield/EarnYieldAccountOpportunity.tsx#L321).

### web-t3t1-trade-country-picker

Buy opens a Country of residence modal with a search field and a scrollable country subset. This capture is from Buy and does not directly demonstrate the same control in Sell.

- `page.getByTestId('@trading/form/country-select')` — Open Sell, then its residence selector, and record a separate capture if Sell-specific visual evidence is wanted. [Source](../../../../suite/trading/src/ui/Country/TradingCountryInput.tsx#L55).

### web-t3t1-sell-form

Sell shows source asset/account, crypto/fiat amount inputs, source balance, payout currency and residence. The fraction/Max controls are not visible in this idle screenshot.

- `page.getByTestId('@trading/form/fraction-buttons')` — Hover the source amount section or focus its fraction button before capture: source CSS intentionally sets opacity to zero until section hover/focus. Capture 25%, 50% and Max without submitting. [Source](../../../../packages/suite/src/views/wallet/trading/common/TradingForm/TradingFractionButtons.tsx#L41).

### web-t3t1-swap-form

Swap shows source/destination selectors, reverse-direction control, amounts and fiat references, source balance and receive account. Fraction/Max controls are not visible in this idle screenshot.

- `page.getByTestId('@trading/form/fraction-buttons')` — Hover the source amount section or focus its fraction button before capture: source CSS intentionally sets opacity to zero until section hover/focus. Capture 25%, 50% and Max without submitting. [Source](../../../../packages/suite/src/views/wallet/trading/common/TradingForm/TradingFractionButtons.tsx#L41).

### web-t3t1-application-maintenance-visible

Application settings show auto-eject, localization and labeling. The Color scheme row appears at the bottom; analytics, Show log, Reset app and app version are outside this viewport.

- `page.getByTestId('@analytics/toggle-switch')` — Scroll the Application section into view and capture the full analytics row. [Source](../../../../packages/suite/src/views/settings/SettingsGeneral/Analytics.tsx#L33).
- `page.getByTestId('@settings/show-log-button')` — Capture the Show log entry without opening account-containing logs. [Source](../../../../packages/suite/src/views/settings/SettingsGeneral/ShowApplicationLog.tsx#L26).
- `page.getByTestId('@settings/reset-app-button')` — Capture the reset entry and app version without executing another reset. [Source](../../../../packages/suite/src/views/settings/SettingsGeneral/ClearStorage.tsx#L29).

### web-t3t1-device-security-visible

Device settings show backup checking, passphrase-wallet toggle, firmware version/type/language and the complete PIN toggle. Only the Safety checks label and upper edge of its Change button are visible; Check device is below the viewport.

- `page.getByTestId('@settings/device/safety-checks-button')` — Scroll the full Security block into view and capture Safety checks plus its action. [Source](../../../../packages/suite/src/views/settings/SettingsDevice/SafetyChecks.tsx#L30).
- `page.getByRole('button', {name:'Check device',exact:true})` — Scroll the authenticity entry fully into view and capture without initiating a hardware authenticity claim. [Source](../../../../packages/suite/src/views/settings/SettingsDevice/AuthenticateDevice.tsx#L38).

## Scope limits

Screenshots demonstrate rendered entries, explanatory text and fixture states. They do not prove successful stake, wrap, approval, deposit, payout, provider checkout, hardware confirmation or real-chain transactions. The provider comparison contains one local centralized floating-rate offer; fixed-rate offers are empty. The initial country picker is a Buy observation and is not linked as direct Sell visual evidence.

Fractions in Sell/Swap are intentionally hidden by CSS until amount-section hover or focus; absence from the idle PNG does not indicate an implementation defect. Cardano remains unfunded in this QA fixture, and Solana reward-history endpoints are not implemented locally. Read [fixture provenance](./fixtures.md) before interpreting balances, quotes, APYs or portfolio totals.
