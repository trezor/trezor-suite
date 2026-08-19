# Data fetching — prefer TanStack Query

Replacing imperative effect/thunk-driven fetching with `useQuery`/`useMutation`, exposing `queryOptions` on shared hooks, and picking the narrowest query hook.

**7 review-thread-group(s)** · [← back to index](../README.md)

Tags: `less-code` ×2, `use-query` ×2, `declarative`, `narrower-query-hook`, `nit`, `over-fetching`, `query-options`, `replace-thunk`, `shared-hook`, `suite-vs-native`, `tech-debt`, `use-mutation`, `use-query-select`

| # | PR | File | Tags |
| --- | --- | --- | --- |
| [G08](#g08--suite-nativemodule-earnsrchooksusecomposeearnfeests164) | [#27621](https://github.com/trezor/trezor-suite/pull/27621) | `useComposeEarnFees.ts:164` | use-mutation, less-code |
| [G21](#g21--suite-commonearn-staking-apisrcstakinghooksuseethereumvalidatorsqueuets19) | [#27829](https://github.com/trezor/trezor-suite/pull/27829) | `useEthereumValidatorsQueue.ts:19` | query-options, shared-hook, suite-vs-native |
| [G72](#g72--packagessuitesrcactionswalletgraphactionsts171) | [#29445](https://github.com/trezor/trezor-suite/pull/29445) | `graphActions.ts:171` | replace-thunk, tech-debt |
| [G56](#g56--packagessuitesrchookswalletuseethereumcanceltxcomposets66) | [#29622](https://github.com/trezor/trezor-suite/pull/29622) | `useEthereumCancelTxCompose.ts:66` | use-query, declarative, less-code |
| [G58](#g58--suite-commonwallet-coresrcsenduseevmnonceinfots95) | [#29622](https://github.com/trezor/trezor-suite/pull/29622) | `useEvmNonceInfo.ts:95` | use-query-select, nit |
| [G60](#g60--suite-nativemodule-transactionssrchooksusedeviceguardedsignts74) | [#29622](https://github.com/trezor/trezor-suite/pull/29622) | `useDeviceGuardedSign.ts:74` | use-query |
| [G83](#g83--suite-nativemodule-earnsrccomponentsyieldbadgetsx52) | [#30994](https://github.com/trezor/trezor-suite/pull/30994) | `YieldBadge.tsx:52` | narrower-query-hook, over-fetching |

---

### G08 — `suite-native/module-earn/src/hooks/useComposeEarnFees.ts:164`

- **PR** [#27621 — fix(suite-native): fee selector balance error](https://github.com/trezor/trezor-suite/pull/27621) · author `@BrantalikP` · merged
- **My first comment** 2026-05-13
- **Discussion thread** https://github.com/trezor/trezor-suite/pull/27621#discussion_r3233333111
- **Line of code** https://github.com/trezor/trezor-suite/blob/6d670a9a95edff04d3fa15914e87f56373da4571/suite-native/module-earn/src/hooks/useComposeEarnFees.ts#L164
- **Thread** 1 comment(s), 1 mine
- **Status** unresolved
- **Tags** `use-mutation`, `less-code`

<details>
<summary>Code under discussion (diff hunk)</summary>

```diff
@@ -91,43 +96,77 @@ export const useComposeEarnFees = ({
     const feeInfo = useSelector((state: FeesRootState) =>
         selectConvertedNetworkFeeInfo(state, account?.symbol),
     );
+    const areFeesLoading = useSelector((state: FeesRootState) =>
+        selectAreFeesLoading(state, account?.symbol),
+    );
+    const feeLevels = useSelector((state: NativeSendRootState) => selectFeeLevels(state));
+    const selectedFee = formDraft?.selectedFee;
+    const selectedFeeLevel = selectedFee ? feeLevels[selectedFee] : undefined;
+    const fee = isFinalPrecomposedTransaction(selectedFeeLevel) ? selectedFeeLevel.fee : null;
+    const { isFeeUnavailable } = getFeeAvailability({
+        fee,
+        feeLevels,
+        selectedFee,
+        isLoading: areFeesLoading || isComposingFeeLevels,
+    });
 
     const composeFeeLevels = useCallback(async () => {
-        if (!formState || !account || !feeInfo) return;
-
-        const { selectedFee, feePerUnit, feeLimit, maxFeePerGas, maxPriorityFeePerGas } =
-            formDraftRef.current ?? {};
-
-        const mergedFormState = {
-            ...formState,
-            selectedFee: selectedFee ?? formState.selectedFee,
-            feePerUnit: feePerUnit ?? formState.feePerUnit,
-            feeLimit: feeLimit ?? formState.feeLimit,
-            maxFeePerGas: maxFeePerGas ?? formState.maxFeePerGas,
-            maxPriorityFeePerGas: maxPriorityFeePerGas ?? formState.maxPriorityFeePerGas,
-        };
-
-        const response = await dispatch(
-            composeSendFormTransactionFeeLevelsThunk({
-                formState: mergedFormState,
-                composeContext: { account, feeInfo, network: getNetwork(account.symbol) },
-            }),
-        );
-        if (!isFulfilled(response)) return;
-
-        dispatch(transactionManagementActions.storeFeeLevels({ feeLevels: response.payload }));
-
-        const normalLevel = response.payload.normal;
-        if (!mergedFormState.feePerUnit && isFinalPrecomposedTransaction(normalLevel)) {
-            mergedFormState.feePerUnit = normalLevel.feePerByte;
+        if (!formState || !account || !feeInfo) {
+            setIsComposingFeeLevels(false);
+
+            return;
         }
 
-        saveDraft(mergedFormState);
+        setIsComposingFeeLevels(true);
+
+        try {
+            const {
+                selectedFee: draftSelectedFee,
+                feePerUnit,
+                feeLimit,
+                maxFeePerGas,
+                maxPriorityFeePerGas,
+            } = formDraftRef.current ?? {};
+
+            const mergedFormState = {
+                ...formState,
+                selectedFee: draftSelectedFee ?? formState.selectedFee,
+                feePerUnit: feePerUnit ?? formState.feePerUnit,
+                feeLimit: feeLimit ?? formState.feeLimit,
+                maxFeePerGas: maxFeePerGas ?? formState.maxFeePerGas,
+                maxPriorityFeePerGas: maxPriorityFeePerGas ?? formState.maxPriorityFeePerGas,
+            };
+
+            const response = await dispatch(
+                composeSendFormTransactionFeeLevelsThunk({
+                    formState: mergedFormState,
+                    composeContext: { account, feeInfo, network: getNetwork(account.symbol) },
+                }),
+            );
+            if (!isFulfilled(response)) return;
+
+            dispatch(transactionManagementActions.storeFeeLevels({ feeLevels: response.payload }));
+
+            const normalLevel = response.payload.normal;
+            if (!mergedFormState.feePerUnit && isFinalPrecomposedTransaction(normalLevel)) {
+                mergedFormState.feePerUnit = normalLevel.feePerByte;
+            }
+
+            saveDraft(mergedFormState);
+        } finally {
+            setIsComposingFeeLevels(false);
+        }
     }, [dispatch, formState, account, feeInfo, saveDraft]);
 
     useEffect(() => {
+        setIsComposingFeeLevels(!!formState && !!account && !!feeInfo);
         debounce(composeFeeLevels);
-    }, [debounce, composeFeeLevels]);
+    }, [account, debounce, composeFeeLevels, feeInfo, formState]);
```

</details>

**Conversation**

**🟦 @cermakjiri (me)** · 2026-05-13

> suggestion for the proper fix: it looks like good job for `useMutation` / `useQuery` (it'd be cleaner & requiring less code)

---

### G21 — `suite-common/earn-staking-api/src/staking/hooks/useEthereumValidatorsQueue.ts:19`

- **PR** [#27829 — (PR no longer accessible — deleted or hidden)](https://github.com/trezor/trezor-suite/pull/27829) · author `@unknown` · unknown
- **My first comment** 2026-05-22
- **Discussion thread** https://github.com/trezor/trezor-suite/pull/27829#discussion_r3288598035
- **Thread** 1 comment(s), 1 mine
- **Status** **⚠️ PR no longer accessible on GitHub**
- **Tags** `query-options`, `shared-hook`, `suite-vs-native`

<details>
<summary>Code under discussion (diff hunk)</summary>

```diff
@@ -1,23 +1,23 @@
-import { type ResponseError, type ResponseValidationError } from '@suite-common/http-client';
-import { type UseQueryOptions, commonQueryKeys, useQuery } from '@suite-common/react-query';
+import { commonQueryKeys, useQuery } from '@suite-common/react-query';
 import { type Account } from '@suite-common/wallet-types';
 
-import { type EthValidatorsQueue } from '../../api/types';
 import { getEthereumValidatorsQueue } from '../services';
 
 interface UseEthereumValidatorsQueueProps {
-    account: Account;
+    account: Account | null;
     timestamp?: number;
+    enabled?: boolean;
 }
 
-export function useEthereumValidatorsQueue(
-    { account, timestamp }: UseEthereumValidatorsQueueProps,
-    queryOptions?: UseQueryOptions<EthValidatorsQueue, ResponseError | ResponseValidationError>,
-) {
+export function useEthereumValidatorsQueue({
+    account,
+    timestamp,
+    enabled,
+}: UseEthereumValidatorsQueueProps) {
     return useQuery({
         staleTime: 60 * 1000, // 1 minute
-        ...queryOptions,
-        queryKey: commonQueryKeys.validatorsQueue(account.key, timestamp),
+        enabled: !!account && (enabled ?? true),
```

</details>

**Conversation**

**🟦 @cermakjiri (me)** · 2026-05-22

> Sure, checking for `null` account and enabling it only when it's defined makes sense. But why have you removed the `queryOptions`? This is general hook and the usage might vary in `suite` and `suite-native`. 
>
> It'd be better to this like this:
> ```ts
> import { type ResponseError, type ResponseValidationError } from '@suite-common/http-client';
> import { type UseQueryOptions, commonQueryKeys, useQuery } from '@suite-common/react-query';
> import { type Account } from '@suite-common/wallet-types';
>
> import { type EthValidatorsQueue } from '../../api/types';
> import { getEthereumValidatorsQueue } from '../services';
>
> interface UseEthereumValidatorsQueueProps {
>     account: Account | null;
>     timestamp?: number;
> }
>
> export function useEthereumValidatorsQueue(
>     { account, timestamp }: UseEthereumValidatorsQueueProps,
>     {
>         enabled = Boolean(account),
>         ...restQueryOptions
>     }: Omit<
>         UseQueryOptions<EthValidatorsQueue, ResponseError | ResponseValidationError>,
>         'queryKey'
>     > = {},
> ) {
>     return useQuery({
>         staleTime: 60 * 1000, // 1 minute
>         ...restQueryOptions,
>         queryKey: commonQueryKeys.validatorsQueue(account?.key, timestamp),
>         queryFn: () =>
>             getEthereumValidatorsQueue({
>                 params: { timestamp },
>             }),
>     });
> }
> ```
> of course and edit the query key: `validatorsQueue: (accountKey: string | undefined, timestamp?: number) => [`

---

### G72 — `packages/suite/src/actions/wallet/graphActions.ts:171`

- **PR** [#29445 — fix(suite): keep account graph data visible while refetching](https://github.com/trezor/trezor-suite/pull/29445) · author `@tomasklim` · merged
- **My first comment** 2026-08-04
- **Discussion thread** https://github.com/trezor/trezor-suite/pull/29445#discussion_r3712475266
- **Line of code** https://github.com/trezor/trezor-suite/blob/372eb0020be72615a95bf328f8a3526846e1b807/packages/suite/src/actions/wallet/graphActions.ts#L171
- **Thread** 1 comment(s), 1 mine
- **Status** unresolved
- **Tags** `replace-thunk`, `tech-debt`

<details>
<summary>Code under discussion (diff hunk)</summary>

```diff
@@ -127,7 +166,6 @@ export const fetchAccountGraphData =
                         descriptor: account.descriptor,
                         symbol: account.symbol,
                     },
-                    data: [],
                     isLoading: false,
                     error: true,
                 },
```

</details>

**Conversation**

**🟦 @cermakjiri (me)** · 2026-08-04

> I really don't like this thunk, it could be fairly easily replaced with tanstack query. But that's for another time, I know.

---

### G56 — `packages/suite/src/hooks/wallet/useEthereumCancelTxCompose.ts:66`

- **PR** [#29622 — feat(suite-native): evm cancel ](https://github.com/trezor/trezor-suite/pull/29622) · author `@53gur0` · open
- **My first comment** 2026-07-30
- **Discussion thread** https://github.com/trezor/trezor-suite/pull/29622#discussion_r3682308103
- **Line of code** https://github.com/trezor/trezor-suite/blob/d7908c9bf897b8ce10011e7f9c02e81bba3612b5/packages/suite/src/hooks/wallet/useEthereumCancelTxCompose.ts#L66
- **Thread** 1 comment(s), 1 mine
- **Status** unresolved
- **Tags** `use-query`, `declarative`, `less-code`

<details>
<summary>Code under discussion (diff hunk)</summary>

```diff
@@ -53,62 +51,17 @@ export const useEthereumCancelTxCompose = ({ account, tx }: UseEthereumCancelTxC
         error: mutationError,
         isPending: isComposing,
     } = useMutation({
-        mutationFn: async (): Promise<{
-            composedCancelTx: PrecomposedTransactionFinalCancelRbf;
-            cancelFormState: FormState;
-        }> => {
-            if (!feeInfo || tx.rbfParams?.type !== 'ethereum') {
-                throw new Error('Missing fee info or invalid RBF params for Ethereum cancellation');
+        mutationFn: async (): Promise<ComposedEthereumCancelTransaction> => {
+            if (account.networkType !== 'ethereum') {
+                throw new Error('Ethereum cancellation is only available for EVM accounts');
             }
 
-            const { rbfParams } = tx;
-            const network = getNetwork(account.symbol);
-
-            const formState: FormState = {
-                outputs: [
-                    {
-                        type: 'payment',
-                        address: account.descriptor,
-                        amount: '0',
-                        fiat: '',
-                        currency: { value: '', label: '' },
-                        token: null,
-                    },
-                ],
-                selectedFee: 'normal',
-                feePerUnit: '',
-                feeLimit: '',
-                options: ['broadcast'],
-                isCoinControlEnabled: false,
-                hasCoinControlBeenOpened: false,
-                selectedUtxos: [],
-                rbfParams,
-            };
-
-            const feeLevels = await dispatch(
-                composeSendFormTransactionFeeLevelsThunk({
-                    formState,
-                    composeContext: {
-                        account,
-                        network,
-                        feeInfo: getEthereumRbfFeeInfo(feeInfo, rbfParams),
-                    },
-                }),
-            ).unwrap();
-
-            const normalLevel = feeLevels.normal;
-            if (!normalLevel || normalLevel.type === 'error' || normalLevel.type === 'nonfinal') {
-                throw new Error('Unable to compose a valid cancellation fee level.');
+            const result = await dispatch(composeEthereumCancelTransactionThunk({ account, tx }));
+            if (isRejected(result)) {
+                throw result.payload ?? new Error('Unknown error');
             }
 
-            return {
-                composedCancelTx: {
-                    ...normalLevel,
-                    rbfType: 'cancel',
-                    prevTxid: tx.txid,
-                } as PrecomposedTransactionFinalCancelRbf,
-                cancelFormState: formState,
-            };
+            return result.payload;
         },
     });
```

</details>

**Conversation**

**🟦 @cermakjiri (me)** · 2026-07-30

> Why not using useQuery if it's more declarative than imperative use-case? It would result in shorter code a little:
>
> ```ts
>     const { ... } = useQuery({
>         enabled: account.networkType === 'ethereum' && !!feeInfo && tx.rbfParams?.type === 'ethereum',
>         queryKey: [],
>         queryFn: async () => {
>             const result = await dispatch(composeEthereumCancelTransactionThunk({ account, tx }));
>
>             if (isRejected(result)) {
>                 throw result.payload ?? new Error('Unknown error');
>             }
>
>             return result.payload;
>         }
>     })
> ```

---

### G58 — `suite-common/wallet-core/src/send/useEvmNonceInfo.ts:95`

- **PR** [#29622 — feat(suite-native): evm cancel ](https://github.com/trezor/trezor-suite/pull/29622) · author `@53gur0` · open
- **My first comment** 2026-07-30
- **Discussion thread** https://github.com/trezor/trezor-suite/pull/29622#discussion_r3682340518
- **Line of code** https://github.com/trezor/trezor-suite/blob/d7908c9bf897b8ce10011e7f9c02e81bba3612b5/suite-common/wallet-core/src/send/useEvmNonceInfo.ts#L95 _(thread is outdated — line refers to the original diff, may have moved)_
- **Thread** 1 comment(s), 1 mine
- **Status** unresolved · outdated
- **Tags** `use-query-select`, `nit`

**Conversation**

**🟦 @cermakjiri (me)** · 2026-07-30

> NIT (ignore if you will): This might be part of the useQuery as `select` method. Anyway I guess there's no advantage compare to this solution.

---

### G60 — `suite-native/module-transactions/src/hooks/useDeviceGuardedSign.ts:74`

- **PR** [#29622 — feat(suite-native): evm cancel ](https://github.com/trezor/trezor-suite/pull/29622) · author `@53gur0` · open
- **My first comment** 2026-07-30
- **Discussion thread** https://github.com/trezor/trezor-suite/pull/29622#discussion_r3682381623
- **Line of code** https://github.com/trezor/trezor-suite/blob/d7908c9bf897b8ce10011e7f9c02e81bba3612b5/suite-native/module-transactions/src/hooks/useDeviceGuardedSign.ts#L74
- **Thread** 1 comment(s), 1 mine
- **Status** unresolved
- **Tags** `use-query`

<details>
<summary>Code under discussion (diff hunk)</summary>

```diff
@@ -0,0 +1,88 @@
+import { useCallback, useRef, useState } from 'react';
+import { useSelector } from 'react-redux';
+
+import { useFocusEffect, useNavigation } from '@react-navigation/native';
+
+import {
+    type DeviceRootState,
+    selectDeviceButtonRequestsCodes,
+    selectIsDeviceConnectedAndAuthorized,
+} from '@suite-common/device';
+import {
+    AuthorizeDeviceStackRoutes,
+    type NavigateParameters,
+    type RootStackParamList,
+    RootStackRoutes,
+    type StackToStackCompositeNavigationProps,
+    type TransactionDetailStackParamList,
+    type TransactionDetailStackRoutes,
+} from '@suite-native/navigation';
+
+type NavigationProp = StackToStackCompositeNavigationProps<
+    TransactionDetailStackParamList,
+    TransactionDetailStackRoutes.TransactionDetail,
+    RootStackParamList
+>;
+
+type UseDeviceGuardedSignParams = {
+    // The signing action to run once the device is connected and authorized.
+    sign: () => Promise<void>;
+    // Where the connection guard returns the user if they abort connecting the device.
+    cancelNavigationTarget: NavigateParameters<RootStackParamList>;
+};
+
+/**
+ * Runs a signing action behind the native device-connection guard: `requestSign` routes through the
+ * DeviceConnectionGuard screen (which connects/unlocks the device if needed, or returns immediately
+ * when it's already authorized), and `sign` runs once this screen regains focus with an authorized
+ * device. Exposes `isSigning` and `isWaitingForDevice` (the device is showing a button request) for
+ * the caller's UI. Mirrors the pattern the send/stellar flows use inline.
+ */
+export const useDeviceGuardedSign = ({
+    sign,
+    cancelNavigationTarget,
+}: UseDeviceGuardedSignParams) => {
+    const navigation = useNavigation<NavigationProp>();
+    const isDeviceConnectedAndAuthorized = useSelector((state: DeviceRootState) =>
+        selectIsDeviceConnectedAndAuthorized(state),
+    );
+    const buttonRequestCodes = useSelector((state: DeviceRootState) =>
+        selectDeviceButtonRequestsCodes(state),
+    );
+
+    const [isSigning, setIsSigning] = useState(false);
+    const pendingSignRef = useRef(false);
+    const isWaitingForDevice = isSigning && buttonRequestCodes.length > 0;
+
+    const runSign = useCallback(async () => {
+        setIsSigning(true);
+        try {
+            await sign();
+        } finally {
+            setIsSigning(false);
+        }
+    }, [sign]);
+
+    // When the screen regains focus after the device-connection guard, execute the pending sign.
+    useFocusEffect(
+        useCallback(() => {
+            if (pendingSignRef.current && isDeviceConnectedAndAuthorized) {
+                pendingSignRef.current = false;
+                runSign();
+            }
+        }, [isDeviceConnectedAndAuthorized, runSign]),
+    );
```

</details>

**Conversation**

**🟦 @cermakjiri (me)** · 2026-07-30

> this looks like job for `useQuery`

---

### G83 — `suite-native/module-earn/src/components/YieldBadge.tsx:52`

- **PR** [#30994 — Mobile - Asset Detail Screen Revamp](https://github.com/trezor/trezor-suite/pull/30994) · author `@TomasBoda` · merged
- **My first comment** 2026-08-10
- **Discussion thread** https://github.com/trezor/trezor-suite/pull/30994#discussion_r3749155737
- **Line of code** https://github.com/trezor/trezor-suite/blob/132bc2d7a32741a02b2270d1acff6ed8ed9dc22b/suite-native/module-earn/src/components/YieldBadge.tsx#L52 _(thread is outdated — line refers to the original diff, may have moved)_
- **Thread** 2 comment(s), 1 mine
- **Status** resolved · outdated
- **Tags** `narrower-query-hook`, `over-fetching`

<details>
<summary>Code under discussion (diff hunk)</summary>

```diff
@@ -0,0 +1,92 @@
+import { Pressable } from 'react-native';
+
+import { useNavigation } from '@react-navigation/native';
+
+import { useAllYieldOpportunities } from '@suite-common/earn-stablecoin-api';
+import { getYieldVaultContractAddress } from '@suite-common/wallet-core';
+import { type Account, type TokenAddress, toTokenAddress } from '@suite-common/wallet-types';
+import { Badge, type BadgeProps } from '@suite-native/atoms';
+import { Translation, type TxKeyPath } from '@suite-native/intl';
+import {
+    AppTabsRoutes,
+    EarnStackRoutes,
+    type RootStackParamList,
+    RootStackRoutes,
+    type StackNavigationProps,
+} from '@suite-native/navigation';
+
+type YieldBadgeVariant = 'inactive' | 'active' | 'promo';
+
+type YieldBadgeVariantConfig = {
+    translationId: TxKeyPath;
+    intent?: BadgeProps['intent'];
+};
+
+const variantConfigMap: Record<YieldBadgeVariant, YieldBadgeVariantConfig> = {
+    inactive: {
+        translationId: 'moduleAccountManagement.accountDetailContentScreen.yieldBadge.upToRate',
+        intent: 'brand',
+    },
+    active: {
+        translationId: 'moduleAccountManagement.accountDetailContentScreen.yieldBadge.yieldRate',
+        intent: 'brand',
+    },
+    promo: {
+        translationId: 'moduleAccountManagement.accountDetailContentScreen.yieldBadge.promoRate',
+        intent: 'brand',
+    },
+};
+
+interface YieldBadgeProps {
+    apy: number;
+    variant: YieldBadgeVariant;
+    account: Account;
+    vaultId: string;
+    tokenContract?: TokenAddress;
+}
+
+type NavigationProps = StackNavigationProps<RootStackParamList, RootStackRoutes.AccountDetail>;
+
+export const YieldBadge = ({ apy, variant, account, vaultId, tokenContract }: YieldBadgeProps) => {
+    const navigation = useNavigation<NavigationProps>();
+    const { data: yieldOpportunities } = useAllYieldOpportunities();
```

</details>

**Conversation**

**🟦 @cermakjiri (me)** · 2026-08-10

> Let's use `useYieldOpportunity` instead of `useAllYieldOpportunities`

**@TomasBoda** · 2026-08-10

> done

---
