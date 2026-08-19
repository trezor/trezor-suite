Extracted from the `skills/performance-react-hooks/SKILL.md` audit — section _"Minimal required dependencies"_. Found by sweep, not named in the doc.

## Where

[`packages/suite/src/hooks/wallet/trading/form/common/useTradingComposeTransaction.ts:142-223`](https://github.com/trezor/trezor-suite/blob/develop/packages/suite/src/hooks/wallet/trading/form/common/useTradingComposeTransaction.ts#L142-L223)
(`eslint-disable-next-line react-hooks/exhaustive-deps` at
[line 209](https://github.com/trezor/trezor-suite/blob/develop/packages/suite/src/hooks/wallet/trading/form/common/useTradingComposeTransaction.ts#L209))

## Before

```tsx
useEffect(() => {
    let isMounted = true;

    if (!account || !network) {
        setState(initState);
        setComposedLevels(undefined);

        return;
    }

    const hasAccountChanged = !(
        state.account?.descriptor === initState.account?.descriptor &&
        state.account?.symbol === initState.account?.symbol
    );

    const accountKey =
        initState.account && `${initState.account.symbol}:${initState.account.descriptor}`;
    if (replaceablePlaceholderRef.current.accountKey !== accountKey) {
        replaceablePlaceholderRef.current = {
            accountKey,
            address: getValues('outputs')?.[0]?.address,
        };
    }

    const setStateAsync = async () => {
        const address: string = await getComposeAddressPlaceholder(
            account,
            network,
            device,
            accounts,
            chunkify,
        );

        if (!isMounted) {
            return;
        }

        const currentOutput = getValues('outputs')?.[0];

        if (currentOutput && typeof address === 'string') {
            const isReplaceable =
                currentOutput.address !== address &&
                (!currentOutput.address ||
                    currentOutput.address === replaceablePlaceholderRef.current.address);
            if (isReplaceable) {
                setValue(TRADING_FORM_OUTPUT_ADDRESS, address);
            }
            setState(initState);
        }
    };

    // update fee info only if the block height has increased.
    // note: This approach may not be ideal for Bitcoin, as fees can change within the same block
    const hasFeeInfoChanged = feeInfo.blockHeight - state.feeInfo.blockHeight > 0;

    if (hasAccountChanged || (!outputAddress && account.symbol !== 'ada') || hasFeeInfoChanged) {
        setStateAsync();
    }

    return () => {
        isMounted = false;
    };
    // call effect only when listed dependencies will change
    // eslint-disable-next-line react-hooks/exhaustive-deps
}, [
    account?.symbol,
    account?.descriptor,
    chunkify,
    device,
    network,
    state.account?.descriptor,
    state.account?.symbol,
    initState.account?.descriptor,
    initState.account?.symbol,
    initState.feeInfo,
    outputAddress,
    type,
]);
```

`device` (the whole `TrezorDevice` object) sits in the dependency array, and `accounts` (the whole
accounts array, from `useSelector(selectAccounts)`) is read inside `setStateAsync` without being
listed at all. The `eslint-disable` hides both: the intentional narrowing this comment is meant to
justify, and the accidental omission of `accounts`.

## After

The very first effect in this same file already solves this exact problem for a Tron-specific derive,
by keeping only `device?.state` in its own dependency array and reading the live device/accounts
through refs that are updated on every render:

```tsx
// already present a few lines above, in this same file
const accountsRef = useRef(accounts);
accountsRef.current = accounts;
const deviceRef = useRef(device);
deviceRef.current = device;
```

Reusing those refs in the second effect:

```tsx
const setStateAsync = async () => {
    const address: string = await getComposeAddressPlaceholder(
        account,
        network,
        deviceRef.current,
        accountsRef.current,
        chunkify,
    );
    // ... unchanged
};
...
// call effect only when listed dependencies will change
// eslint-disable-next-line react-hooks/exhaustive-deps
}, [
    account?.symbol,
    account?.descriptor,
    chunkify,
    device?.state,
    network,
    state.account?.descriptor,
    state.account?.symbol,
    initState.account?.descriptor,
    initState.account?.symbol,
    initState.feeInfo,
    outputAddress,
    type,
]);
```

## Why it matters

For Bitcoin-type accounts, `getComposeAddressPlaceholder` calls `TrezorConnect.getAddress` — real
device/bridge I/O — to derive a placeholder receive address for the sell/exchange form's fee-estimate
step. Today that call re-fires on every render in which `device` gets a new reference while
`outputAddress` is still empty — the window between selecting an account/asset and the first
successful address-placeholder compose. Once `outputAddress` is set the `if` guard absorbs further
`device` churn, so this is a real but narrow-window issue rather than a continuous one. Reading
`accounts` outside the dependency array also means the `legacyAccount` lookup inside
`getComposeAddressPlaceholder`'s Bitcoin branch can run against a stale accounts snapshot from
whenever this effect last happened to fire, independent of the `device` issue.

## Notes

- Compile requirement: none beyond what the file already imports — `useRef` is already imported
  (`import { useEffect, useMemo, useRef, useState } from 'react';`), and `deviceRef`/`accountsRef` are
  already declared above this effect for the sibling Tron-derive effect.
- The in-repo correct sibling is the first effect in this same file
  ([`useTradingComposeTransaction.ts:79-106`](https://github.com/trezor/trezor-suite/blob/develop/packages/suite/src/hooks/wallet/trading/form/common/useTradingComposeTransaction.ts#L79-L106)),
  which already depends on `device?.state` instead of `device` and reads the live values through
  these same two refs — this fix makes the second effect consistent with a pattern already proven in
  the file, not a new one.
- `packages/suite` is not React-Compiler-covered, so the ref-based fix is manual, same as the sibling
  effect it mirrors.
- The `eslint-disable-next-line react-hooks/exhaustive-deps` stays after this fix, exactly as it does
  on the sibling effect — `deviceRef`/`accountsRef`/`state`/`initState` fields are read imperatively or
  intentionally excluded, so the suppression continues to be necessary, not incidental.
- Honest sizing: the trigger window is narrow (only while `outputAddress` is still empty), so this is
  real but colder than an unbounded loop — matches its P2 assignment.

<sub>Verified against `issues/perf-react-hooks` at 9e0d5b6a45. Part of #28886.</sub>
