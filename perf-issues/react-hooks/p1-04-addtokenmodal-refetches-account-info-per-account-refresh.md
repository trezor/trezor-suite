Extracted from the `skills/performance-react-hooks/SKILL.md` audit — section _"Distinguish a wasted
memo from a render loop"_. Found by sweep, not named in the doc.

## Where

[`packages/suite/src/components/suite/modals/ReduxModal/UserContextModal/AddTokenModal.tsx:71`](https://github.com/trezor/trezor-suite/blob/develop/packages/suite/src/components/suite/modals/ReduxModal/UserContextModal/AddTokenModal.tsx#L71)

- Dispatched work: [`AddTokenModal.tsx:34`](https://github.com/trezor/trezor-suite/blob/develop/packages/suite/src/components/suite/modals/ReduxModal/UserContextModal/AddTokenModal.tsx#L34) — `loadTokenInfo`, which calls `TrezorConnect.getAccountInfo`.

## Before

```tsx
const account = useSelector(selectSelectedAccount);
...
const loadTokenInfo = useCallback(
    async (acc: Account, contractAddress: string) => {
        if (!acc) return;
        setIsFetching(true);
        const response = await TrezorConnect.getAccountInfo({
            coin: asCoinSymbol(acc.symbol),
            identity: tryGetAccountIdentity(acc),
            descriptor: acc.descriptor,
            details: 'tokenBalances',
            contractFilter: contractAddress,
            suppressBackupWarning: true,
            protocols: acc.networkType === 'ethereum' ? ['erc4626'] : undefined,
        });

        if (response.success) {
            const isInvalidToken = response.payload.tokens?.find(
                t => t.contract === t.name && t.decimals === 0 && !t.symbol,
            );
            if (!isInvalidToken) {
                setTokenInfo(response.payload.tokens);
            } else {
                // not a valid token
                setError(translationString('TR_ADD_TOKEN_TOKEN_NOT_VALID'));
            }
        } else {
            setTokenInfo(undefined);
            setError(
                translationString('TR_ADD_TOKEN_TOAST_ERROR', {
                    error: response.error.message,
                }),
            );
        }
        setIsFetching(false);
    },
    [translationString],
);

useEffect(() => {
    if (account && !error && contractAddress) {
        loadTokenInfo(account, contractAddress);
    }
}, [account, contractAddress, error, loadTokenInfo]);
```

## After

```tsx
const account = useSelector(selectSelectedAccount);
const accountRef = useFreshRef(account);
...
const loadTokenInfo = useCallback(
    async (acc: Account, contractAddress: string) => {
        if (!acc) return;
        setIsFetching(true);
        const response = await TrezorConnect.getAccountInfo({
            coin: asCoinSymbol(acc.symbol),
            identity: tryGetAccountIdentity(acc),
            descriptor: acc.descriptor,
            details: 'tokenBalances',
            contractFilter: contractAddress,
            suppressBackupWarning: true,
            protocols: acc.networkType === 'ethereum' ? ['erc4626'] : undefined,
        });

        if (response.success) {
            const isInvalidToken = response.payload.tokens?.find(
                t => t.contract === t.name && t.decimals === 0 && !t.symbol,
            );
            if (!isInvalidToken) {
                setTokenInfo(response.payload.tokens);
            } else {
                // not a valid token
                setError(translationString('TR_ADD_TOKEN_TOKEN_NOT_VALID'));
            }
        } else {
            setTokenInfo(undefined);
            setError(
                translationString('TR_ADD_TOKEN_TOAST_ERROR', {
                    error: response.error.message,
                }),
            );
        }
        setIsFetching(false);
    },
    [translationString],
);

useEffect(() => {
    const currentAccount = accountRef.current;

    if (currentAccount && !error && contractAddress) {
        loadTokenInfo(currentAccount, contractAddress);
    }
}, [accountRef, account?.key, contractAddress, error, loadTokenInfo]);
```

## Why it matters

The user types a contract address once; from then on, any Redux update that hands `selectSelectedAccount`
a fresh `account` reference — a new block, a balance or nonce change — re-fires this effect and
re-issues a real `TrezorConnect.getAccountInfo` device/backend round-trip with the same address,
silently, for as long as the modal stays open. Unlike a UI recomputation, this is an actual request
repeated with no new input from the user.

## Notes

- Compile requirement: add `import { useFreshRef } from '@trezor/react-utils';` (already a
  `packages/suite` workspace dependency — see `packages/suite/package.json`; sorts after the
  `@trezor/connect-common` import in the existing block).
- `packages/suite` is web/desktop and not React-Compiler-covered, so this is a manual fix, not
  something the compiler would absorb.
- `account?.key` is read directly off the already-destructured `account` for the dependency array;
  the reducer also exports a ready-made `selectSelectedAccountKey` selector
  (`suite/account/src/selectedAccountReducer.ts:53`) that returns the same primitive straight from
  the store, as an alternative to deriving it locally.
- Mirrors the skill's own worked example (`AdaStakingDashboard.tsx:52`): "When an effect really must
  fetch, depend on the identifier and not the record."
- `error`/`contractAddress` stay as-is in the dependency array; only `account` needed narrowing.

<sub>Verified against `issues/perf-react-hooks` at 9e0d5b6a45. Part of #28886.</sub>
