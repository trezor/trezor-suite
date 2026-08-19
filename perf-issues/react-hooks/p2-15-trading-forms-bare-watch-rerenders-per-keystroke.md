Extracted from the `skills/performance-react-hooks/SKILL.md` audit — section _"Check which app you are in before adding or removing a memo"_ (the section that names `react-hook-form`'s `watch()` as a hazard). Found by sweep, not named in the doc.

## Where

[`packages/suite/src/views/wallet/trading/common/TradingForm/TradingFormApproval.tsx:63`](https://github.com/trezor/trezor-suite/blob/develop/packages/suite/src/views/wallet/trading/common/TradingForm/TradingFormApproval.tsx#L63)

[`packages/suite/src/views/wallet/trading/common/TradingForm/TradingFormOffer/components/TradingFormOffersWarnings.tsx:24`](https://github.com/trezor/trezor-suite/blob/develop/packages/suite/src/views/wallet/trading/common/TradingForm/TradingFormOffer/components/TradingFormOffersWarnings.tsx#L24)

[`packages/suite/src/views/wallet/trading/common/TradingForm/TradingFormOffer/hooks/useTradingFormOfferCommon.ts:35`](https://github.com/trezor/trezor-suite/blob/develop/packages/suite/src/views/wallet/trading/common/TradingForm/TradingFormOffer/hooks/useTradingFormOfferCommon.ts#L35)

[`packages/suite/src/views/wallet/trading/exchange/TradingFormOfferExchangeActions.tsx:44`](https://github.com/trezor/trezor-suite/blob/develop/packages/suite/src/views/wallet/trading/exchange/TradingFormOfferExchangeActions.tsx#L44)

[`packages/suite/src/views/wallet/trading/sell/TradingFormOfferSellActions.tsx:30`](https://github.com/trezor/trezor-suite/blob/develop/packages/suite/src/views/wallet/trading/sell/TradingFormOfferSellActions.tsx#L30)

## Before

```tsx
// TradingFormApproval.tsx:47-63 — destructures `watch` off the trading-form context, then calls it bare
const {
    watch,
    approveTransaction,
    revokeApproval,
    refreshQuotes,
    confirmApproval,
    isScheduledQuotesRefresh,
    isComposing,
    form: {
        state: { isFormLoading, isFormInvalid },
        helpers,
    },
} = context;
// ...
const { exchangeType, rateType } = watch();
```

```tsx
// TradingFormOffersWarnings.tsx:16-27
const context = useTradingFormContext();
const {
    isAmountEmpty,
    form: { state },
} = context;

const isSubdivisionMissing = (() => {
    if (!isTradingBuyContext(context) && !isTradingSellContext(context)) return false;
    const { countrySelect, countrySubdivisionSelect } = context.watch();

    return isCountrySubdivisionEmpty(countrySelect?.value, countrySubdivisionSelect?.value);
})();
```

```tsx
// useTradingFormOfferCommon.ts:26-35
const context = useTradingFormContext();
const {
    isAmountEmpty,
    watch,
    form: { state },
    type,
} = context;
const account = useSelector(reduxState => selectTradingSendAccount(reduxState, type));

const { amountInCrypto } = watch();
```

```tsx
// TradingFormOfferExchangeActions.tsx:29-44
const context = useTradingFormContext<'exchange'>();
const {
    watch,
    shouldSendInSats,
    tradingReceiveAddress,
    isLoadingQuote,
    setIsLoadingQuote,
    confirmTrade,
    isComposing,
    form: { state, helpers },
} = context;
const account = useSelector(reduxState => selectTradingSendAccount(reduxState, 'exchange'));

const modalControls = useReceiveAddressModalControls();

const { outputs, sendCryptoSelect, receiveCryptoSelect, exchangeType, rateType } = watch();
```

```tsx
// TradingFormOfferSellActions.tsx:19-30
const context = useTradingFormContext<'sell'>();
const {
    watch,
    shouldSendInSats,
    sellInfo,
    form: { state, helpers },
} = context;
const account = useSelector(reduxState => selectTradingSendAccount(reduxState, 'sell'));

const isNetworkFeeMissing = useSelector(selectIsTradingNetworkFeeMissing);

const { outputs } = watch();
```

`useTradingFormOfferCommon` is itself called from inside both `TradingFormOfferExchangeActions` and
the sell/buy equivalents, so its own bare `watch()` compounds with each caller's.

## After

The three files that already pin a concrete form type (`useTradingFormContext<'exchange'>()` /
`useTradingFormContext<'sell'>()` / `useTradingFormContext<TradingExchangeType>()`) get `control`
directly off `context` — `TradingExchangeFormContextProps`/`TradingSellFormContextProps` both extend
react-hook-form's `UseFormReturn<TFieldValues>`, which already includes `control`:

```tsx
// TradingFormApproval.tsx
import { useWatch } from 'react-hook-form';
// ...
const {
    control,
    approveTransaction,
    revokeApproval,
    refreshQuotes,
    confirmApproval,
    isScheduledQuotesRefresh,
    isComposing,
    form: {
        state: { isFormLoading, isFormInvalid },
        helpers,
    },
} = context;
// ...
const [exchangeType, rateType] = useWatch({ control, name: ['exchangeType', 'rateType'] });
```

```tsx
// TradingFormOfferExchangeActions.tsx
const [outputs, sendCryptoSelect, receiveCryptoSelect, exchangeType, rateType] = useWatch({
    control: context.control,
    name: ['outputs', 'sendCryptoSelect', 'receiveCryptoSelect', 'exchangeType', 'rateType'],
});
```

```tsx
// TradingFormOfferSellActions.tsx
const [outputs] = useWatch({ control: context.control, name: ['outputs'] });
```

The two files that call `useTradingFormContext()` with no concrete type parameter
(`TradingFormOffersWarnings.tsx`, `useTradingFormOfferCommon.ts`) get `control` the same way the
already-correct sibling `TradingFormInputCryptoAmount.tsx:179` does — a cast to the union form-props
type:

```tsx
// TradingFormOffersWarnings.tsx
import { type UseFormReturn, useWatch } from 'react-hook-form';
import { type TradingAllFormProps } from 'src/types/trading/tradingForm';
// ...
const context = useTradingFormContext();
const { control } = context as UseFormReturn<TradingAllFormProps>;
const {
    isAmountEmpty,
    form: { state },
} = context;

const [countrySelect, countrySubdivisionSelect] = useWatch({
    control,
    name: ['countrySelect', 'countrySubdivisionSelect'],
});

const isSubdivisionMissing =
    (isTradingBuyContext(context) || isTradingSellContext(context)) &&
    isCountrySubdivisionEmpty(countrySelect?.value, countrySubdivisionSelect?.value);
```

(`useWatch` is a hook and has to be called unconditionally at the top level, so this also moves the
logic out of the IIFE the original `context.watch()` call lived in — `(A || B) && C` here is the same
boolean shape as the original `if (!A && !B) return false;` guard, just without needing an early
return.)

```tsx
// useTradingFormOfferCommon.ts
const context = useTradingFormContext();
const { control } = context as UseFormReturn<TradingAllFormProps>;
const {
    isAmountEmpty,
    form: { state },
    type,
} = context;
// ...
const [amountInCrypto] = useWatch({ control, name: ['amountInCrypto'] });
```

## Why it matters

None of these `watch()` calls scope a field name, so each subscribes its component to _every_ field
change in the active trading form, not just the ones it destructures. Typing an amount, picking a
country, or changing any other field currently re-renders all five of these
components/hooks (`useTradingFormOfferCommon` runs inside both action components, multiplying the
effect) on every keystroke anywhere in the form, including the several `useSelector` calls and derived
booleans each one recomputes as part of that re-render — work whose inputs didn't actually change.

## Notes

- Class caveat, carried over from the sweep's own harvest: the skill's `watch()`/`useWatch()` guidance
  is written for **compiled `suite-native`**, where a bail-out silently drops the whole component's
  React-Compiler auto-memoization. These five files are `packages/suite` (not React-Compiler-covered),
  so there's no compiler bail-out here — the defect is the plainer "unscoped subscription re-renders
  wider than it needs to" problem. It's reported here because it's the closest web analogue and the
  sweep's harvest named it as a distinct category; triage may reasonably re-bucket it rather than treat
  it as a hooks-skill violation in the strict sense the skill describes.
- Correct siblings already in this exact file family prove both `control`-extraction styles compile
  here today: `TradingFormInputFiat.tsx:74-80` (four `useWatch({ control, name: ... })` calls, with
  `control` obtained via a separate `useFormContext<TradingAllFormProps>()` call) and
  `TradingFormInputCryptoAmount.tsx:179-184` (`const { control } = context as UseFormReturn<TradingAllFormProps>;`
  then `useWatch({ control, name: TRADING_FORM_SEND_CRYPTO_CURRENCY_SELECT })`) — the After above
  mirrors the second file's cast style for the two union-typed contexts.
- `sendCryptoSelect` (used successfully in that proven sibling) isn't present on the Buy form's props
  either, so the union cast already has precedent for fields that don't exist on every member of
  `TradingAllFormProps`; `amountInCrypto` (`suite-common/trading/src/types.ts:194,252,302` —
  `TRADING_FORM_AMOUNT_IN_CRYPTO`) is present on all three form types, so it's on firmer ground than
  that. `countrySelect`/`countrySubdivisionSelect` (`types.ts:190-191,300-301`) exist on Buy and Sell
  but not on `MinimalExchangeFormProps`, matching this file's own runtime guard — worth a type-check
  pass when implementing, but not expected to behave differently from the proven `sendCryptoSelect`
  case.
- `useWatch` with an array `name` returns a tuple in the same order, not an object — each `After`
  above switches from `const { field } = watch()` to `const [field] = useWatch({ control, name: ['field'] })`,
  destructuring by position instead of by key.
- None of the five files import `useWatch` today; `react-hook-form` is already a direct dependency used
  throughout this same form tree (see the correct siblings above), so this only adds an import line,
  not a new package dependency.
- `packages/suite` is not React-Compiler-covered, so this is a manual fix regardless of classification
  — there's no compiler to lean on either way.
- Confidence is medium: high that the subscription is unscoped and wider than needed, medium on
  real-world cost per keystroke (not profiled for this sweep) and on the class-6 stretch noted above.

<sub>Verified against `issues/perf-react-hooks` at 9e0d5b6a45. Part of #28886.</sub>
