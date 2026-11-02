---
name: analytics-and-sentry-privacy
description: Rules for keeping confidential data out of analytics events and Sentry reports (incl. `console.error`, tags, extras and breadcrumbs). Use when adding or changing an analytics event or its payload, or any code that reports to Sentry.
---

# Analytics and Sentry privacy

Analytics and Sentry are external services, so everything reported to them leaves the device. Trace the actual
value that reaches the sink at the call site, not just the field name or type.

## Sensitive data

Never send:

- **Wallet data:** addresses, xpubs/descriptors/public keys, txids, UTXOs, and any monetary values: exact
  amounts, balances, fees, quotes or rates, in fiat or crypto.
- **Device data:** device id, label and state, static session id, `session_id`, serial number.
- **User data:** account and other labels, free-form user text, passphrase, seed, PIN, wipe code.
- **Free-form text from errors or backends:** error messages and response bodies can echo any of the above.

Not sensitive: the random analytics instance id (also the Sentry `user.id`), network symbol, coingeckoId,
derivation type, account type and index, firmware version and revision, device model, counts, booleans
and enums.

See `redactAccount` and `redactDevice` in `suite-common/logger/src/utils.ts` for the canonical lists.

## Analytics

### Honor the exact event shape

The event definition is the contract: send exactly its attributes, with the documented values. Do not add
keys without documenting them in the definition (with a `changelog` entry). Do not send a value that does
not match its description, e.g. a raw error message in an attribute documented as an error code.

### Never spread objects in a type-unsafe way

TypeScript checks excess keys only on an object literal assigned directly to the event payload type. A spread
or a pass-through of a value built elsewhere can carry keys that are not in the definition, without any type
error.

```ts
// bad - state can hold keys outside the event definition, e.g. a start timestamp
analytics.report({
    type: events.deviceSetupCompletedEvent.name,
    payload: { ...onboardingAnalytics, duration },
});

// good - list the documented fields explicitly
analytics.report({
    type: events.deviceSetupCompletedEvent.name,
    payload: {
        seed: onboardingAnalytics.seed,
        firmware: onboardingAnalytics.firmware,
        duration,
    },
});
```

- Spreading an object literal built on the spot is fine: `...(apyBreakdown && { apyBreakdown })`.
- A helper that builds a payload or part of one must declare its return type from the event definition, so
  its literal is checked:

```ts
// good
const getCryptoInfo = (): Pick<
    EventInstance<typeof events.tradeApprovalEvent>['payload'],
    'sendCryptoLabel' | 'exchangeName'
> => ({
    sendCryptoLabel: sendCryptoSelect?.displaySymbol,
    exchangeName: quoteProviderName,
});
```

- Never pass redux state, atoms, form values or other wider-typed objects as a payload or spread them into
  one.

## Sentry

Every `console.error` in app code is sent to Sentry with all its arguments (`captureConsoleIntegration`).
The same applies to messages, tags, extras, contexts and breadcrumbs. Tags may be sent even before the user's
consent is known.

- **Prefer generic error codes over full payloads.** Report an error code or a fixed reason when the message,
  response body or object could contain sensitive data, e.g. a backend error echoing an address or balance.
- **Never send exact amounts or values,** not even in error or `NaN` diagnostics.
- **Do not log whole objects** (account, device, form state, Connect responses). Pick the non-sensitive fields
  you need.
- **Keep sensitive values out of URLs.** Redaction exists in the shared Sentry configs (`suite/sentry`,
  `suite-common/sentry`, `suite-native/sentry`), but do not rely on it to catch new cases.

```ts
// bad - the amount and fee go to Sentry
console.error('calculateTotal: Amount is not a number', amount, fee);

// good
console.error('calculateTotal: Amount is not a number');
```
