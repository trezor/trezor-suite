# TypeScript type safety

Type predicates, `satisfies`, narrowing account types via `AccountWithNetworkType`, avoiding casts, fixing types instead of working around them.

**12 review-thread-group(s)** · [← back to index](../README.md)

Tags: `suggestion` ×7, `satisfies` ×3, `account-with-network-type` ×2, `d-ts` ×2, `test-fixtures` ×2, `type-guard` ×2, `ambient-types`, `avoid-cast`, `explicit-annotation`, `fix-the-type`, `is-network-symbol`, `module-augmentation`, `narrow-upstream`, `question`, `redux-augmentation`, `tx-type-modelling`, `type-predicate`

| # | PR | File | Tags |
| --- | --- | --- | --- |
| [G01](#g01--packagessuitesrccomponentssuitemodalsreduxmodaltransactionreviewmodaltransactionreviewoutputlisttransactionreviewoutputtsx119) | [#27590](https://github.com/trezor/trezor-suite/pull/27590) | `TransactionReviewOutput.tsx:119` | type-guard, suggestion |
| [G02](#g02--packagessuitesrccomponentssuitemodalsreduxmodaltransactionreviewmodaltransactionreviewoutputlisttransactionreviewoutputtsx118) | [#27590](https://github.com/trezor/trezor-suite/pull/27590) | `TransactionReviewOutput.tsx:118` | type-predicate, suggestion |
| [G24](#g24--suite-nativemodule-earnsrchooks__tests__useresolvedyieldflowdatatestts49) | [#27718](https://github.com/trezor/trezor-suite/pull/27718) | `useResolvedYieldFlowData.test.ts:49` | satisfies, test-fixtures |
| [G25](#g25--suite-nativemodule-earnsrchooks__tests__useresolvedyieldflowdatatestts27) | [#27718](https://github.com/trezor/trezor-suite/pull/27718) | `useResolvedYieldFlowData.test.ts:27` | satisfies, test-fixtures, suggestion |
| [G34](#g34--suite-commonvalidatorssrctypests1) | [#28797](https://github.com/trezor/trezor-suite/pull/28797) | `types.ts:1` | ambient-types, d-ts, module-augmentation |
| [G40](#g40--suite-commonwallet-coresrcsendsendformethereumthunksts439) | [#28816](https://github.com/trezor/trezor-suite/pull/28816) | `sendFormEthereumThunks.ts:439` | account-with-network-type, suggestion |
| [G42](#g42--suite-commonwallet-coresrcsendsendformethereumthunksts75) | [#28816](https://github.com/trezor/trezor-suite/pull/28816) | `sendFormEthereumThunks.ts:75` | explicit-annotation, suggestion |
| [G35](#g35--packagessuitesrcviewswalletstakingcomponentstronstakingdashboardtronresourcescardtronresourcescardtsx15) | [#28908](https://github.com/trezor/trezor-suite/pull/28908) | `TronResourcesCard.tsx:15` | account-with-network-type, narrow-upstream, suggestion |
| [G57](#g57--suite-commonwallet-coresrcsendcomposecanceltransactioncomposeethereumcanceltransactionthunkts100) | [#29622](https://github.com/trezor/trezor-suite/pull/29622) | `composeEthereumCancelTransactionThunk.ts:100` | avoid-cast, satisfies |
| [G62](#g62--suite-nativemodule-transactionssrcreduxdts11) | [#29622](https://github.com/trezor/trezor-suite/pull/29622) | `redux.d.ts:11` | d-ts, redux-augmentation, question |
| [G76](#g76--suite-commonwallet-utilssrctransactionutilsts93) | [#30910](https://github.com/trezor/trezor-suite/pull/30910) | `transactionUtils.ts:93` | fix-the-type, tx-type-modelling |
| [G86](#g86--suite-nativemodule-accounts-managementsrccomponentsstablecoinyieldtokenoverviewtsx262) | [#31071](https://github.com/trezor/trezor-suite/pull/31071) | `StablecoinYieldTokenOverview.tsx:262` | type-guard, is-network-symbol, suggestion |

---

### G01 — `packages/suite/src/components/suite/modals/ReduxModal/TransactionReviewModal/TransactionReviewOutputList/TransactionReviewOutput.tsx:119`

- **PR** [#27590 — Self-composed `withdraw` / `redeem` calldata for stablecoin yield](https://github.com/trezor/trezor-suite/pull/27590) · author `@matusbalascak` · merged
- **My first comment** 2026-05-12
- **Discussion thread** https://github.com/trezor/trezor-suite/pull/27590#discussion_r3224403668
- **Line of code** https://github.com/trezor/trezor-suite/blob/69f3aa4d239c4a14fb94986743a350a217bb50e3/packages/suite/src/components/suite/modals/ReduxModal/TransactionReviewModal/TransactionReviewOutputList/TransactionReviewOutput.tsx#L119
- **Thread** 1 comment(s), 1 mine
- **Status** unresolved
- **Tags** `type-guard`, `suggestion`

<details>
<summary>Code under discussion (diff hunk)</summary>

```diff
@@ -92,6 +92,32 @@ const approvalStrings: Record<EvmApprovalPurpose, Record<'value' | 'label', Tran
     },
 };
 
+const yieldStrings: Record<
+    Extract<EvmTransactionPurpose, 'deposit' | 'withdraw' | 'redeem'>,
+    Record<'value' | 'label' | 'amount', TranslationKey>
+> = {
+    deposit: {
+        value: 'TR_EARN_YIELD_REVIEW_SUPPLY_DESCRIPTION',
+        label: 'TR_EARN_YIELD_REVIEW_SUPPLY_TITLE',
+        amount: 'TR_EARN_YIELD_REVIEW_SUPPLY_AMOUNT',
+    },
+    withdraw: {
+        value: 'TR_EARN_YIELD_REVIEW_WITHDRAW_DESCRIPTION',
+        label: 'TR_EARN_YIELD_REVIEW_WITHDRAW_TITLE',
+        amount: 'TR_EARN_YIELD_REVIEW_WITHDRAW_AMOUNT',
+    },
+    redeem: {
+        value: 'TR_EARN_YIELD_REVIEW_REDEEM_DESCRIPTION',
+        label: 'TR_EARN_YIELD_REVIEW_REDEEM_TITLE',
+        amount: 'TR_EARN_YIELD_REVIEW_REDEEM_AMOUNT',
+    },
+};
+
+const isYieldAction = (
+    evmTxType: EvmTransactionPurpose | undefined,
+): evmTxType is 'deposit' | 'withdraw' | 'redeem' =>
+    evmTxType === 'deposit' || evmTxType === 'withdraw' || evmTxType === 'redeem';
```

</details>

**Conversation**

**🟦 @cermakjiri (me)** · 2026-05-12

> ```suggestion
>     Object.keys(yieldStrings).includes(evmTxType)
> ```

---

### G02 — `packages/suite/src/components/suite/modals/ReduxModal/TransactionReviewModal/TransactionReviewOutputList/TransactionReviewOutput.tsx:118`

- **PR** [#27590 — Self-composed `withdraw` / `redeem` calldata for stablecoin yield](https://github.com/trezor/trezor-suite/pull/27590) · author `@matusbalascak` · merged
- **My first comment** 2026-05-12
- **Discussion thread** https://github.com/trezor/trezor-suite/pull/27590#discussion_r3224406990
- **Line of code** https://github.com/trezor/trezor-suite/blob/69f3aa4d239c4a14fb94986743a350a217bb50e3/packages/suite/src/components/suite/modals/ReduxModal/TransactionReviewModal/TransactionReviewOutputList/TransactionReviewOutput.tsx#L118
- **Thread** 1 comment(s), 1 mine
- **Status** unresolved
- **Tags** `type-predicate`, `suggestion`

<details>
<summary>Code under discussion (diff hunk)</summary>

```diff
@@ -92,6 +92,32 @@ const approvalStrings: Record<EvmApprovalPurpose, Record<'value' | 'label', Tran
     },
 };
 
+const yieldStrings: Record<
+    Extract<EvmTransactionPurpose, 'deposit' | 'withdraw' | 'redeem'>,
+    Record<'value' | 'label' | 'amount', TranslationKey>
+> = {
+    deposit: {
+        value: 'TR_EARN_YIELD_REVIEW_SUPPLY_DESCRIPTION',
+        label: 'TR_EARN_YIELD_REVIEW_SUPPLY_TITLE',
+        amount: 'TR_EARN_YIELD_REVIEW_SUPPLY_AMOUNT',
+    },
+    withdraw: {
+        value: 'TR_EARN_YIELD_REVIEW_WITHDRAW_DESCRIPTION',
+        label: 'TR_EARN_YIELD_REVIEW_WITHDRAW_TITLE',
+        amount: 'TR_EARN_YIELD_REVIEW_WITHDRAW_AMOUNT',
+    },
+    redeem: {
+        value: 'TR_EARN_YIELD_REVIEW_REDEEM_DESCRIPTION',
+        label: 'TR_EARN_YIELD_REVIEW_REDEEM_TITLE',
+        amount: 'TR_EARN_YIELD_REVIEW_REDEEM_AMOUNT',
+    },
+};
+
+const isYieldAction = (
+    evmTxType: EvmTransactionPurpose | undefined,
+): evmTxType is 'deposit' | 'withdraw' | 'redeem' =>
```

</details>

**Conversation**

**🟦 @cermakjiri (me)** · 2026-05-12

> ```suggestion
> ): evmTxType is keyof typeof yieldStrings  =>
> ```

---

### G24 — `suite-native/module-earn/src/hooks/__tests__/useResolvedYieldFlowData.test.ts:49`

- **PR** [#27718 — feat(suite-native): yield deposit](https://github.com/trezor/trezor-suite/pull/27718) · author `@BrantalikP` · merged
- **My first comment** 2026-05-26
- **Discussion thread** https://github.com/trezor/trezor-suite/pull/27718#discussion_r3302343773
- **Line of code** https://github.com/trezor/trezor-suite/blob/49849a8b2a17ae6deeb8424b91a233ea3d219618/suite-native/module-earn/src/hooks/__tests__/useResolvedYieldFlowData.test.ts#L49 _(thread is outdated — line refers to the original diff, may have moved)_
- **Thread** 3 comment(s), 2 mine
- **Status** resolved · outdated
- **Tags** `satisfies`, `test-fixtures`

<details>
<summary>Code under discussion (diff hunk)</summary>

```diff
@@ -0,0 +1,102 @@
+import { type YieldDto } from '@suite-common/earn-stablecoin-api';
+import { type Account, type AccountKey } from '@suite-common/wallet-types';
+
+import { resolveYieldFlowData } from '../useResolvedYieldFlowData';
+
+const accountKey = 'eth-account-key' as AccountKey;
+const underlyingTokenAddress = '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48';
+const receiptTokenAddress = '0xde6c23e561f3e55846207ec45a91b777e0f7c889';
+const yieldId = 'ethereum-usdc-steakusdc';
+
+const account = {
+    key: accountKey,
+    symbol: 'eth',
+    tokens: [
+        {
+            contract: underlyingTokenAddress,
+            symbol: 'USDC',
+            decimals: 6,
+            balance: '25',
+        },
+        {
+            contract: receiptTokenAddress,
+            symbol: 'trSHUSDCp',
+            decimals: 18,
+            balance: '1.5',
+        },
+    ],
+} as unknown as Account;
+
+const vault = {
+    id: yieldId,
+    network: 'ethereum',
+    providerId: 'morpho',
+    metadata: { name: 'Steakhouse USDC Prime' },
+    token: {
+        address: underlyingTokenAddress,
+        symbol: 'USDC',
+        decimals: 6,
+        coinGeckoId: 'usd-coin',
+    },
+    outputToken: {
+        address: receiptTokenAddress,
+        symbol: 'trSHUSDCp',
+        name: 'Trezor Steakhouse USDC Prime',
+        decimals: 18,
+        coinGeckoId: 'usd-coin',
+    },
+    rewardRate: { total: 0.05 },
+} as unknown as YieldDto;
```

</details>

**Conversation**

**🟦 @cermakjiri (me)** · 2026-05-26

> I understand the `vault` should have the type, however at least partial type validation might be a good idea via `satisfies`.

**@BrantalikP** · 2026-05-26

> partial would not work for the hook, I completed the mock instead https://github.com/trezor/trezor-suite/pull/27718/changes/25a82a123cb603cf14c3f6db7e4cc1a5187b3eab

**🟦 @cermakjiri (me)** · 2026-05-26

> nice 💪

---

### G25 — `suite-native/module-earn/src/hooks/__tests__/useResolvedYieldFlowData.test.ts:27`

- **PR** [#27718 — feat(suite-native): yield deposit](https://github.com/trezor/trezor-suite/pull/27718) · author `@BrantalikP` · merged
- **My first comment** 2026-05-26
- **Discussion thread** https://github.com/trezor/trezor-suite/pull/27718#discussion_r3302376413
- **Line of code** https://github.com/trezor/trezor-suite/blob/49849a8b2a17ae6deeb8424b91a233ea3d219618/suite-native/module-earn/src/hooks/__tests__/useResolvedYieldFlowData.test.ts#L27 _(thread is outdated — line refers to the original diff, may have moved)_
- **Thread** 2 comment(s), 1 mine
- **Status** resolved · outdated
- **Tags** `satisfies`, `test-fixtures`, `suggestion`

<details>
<summary>Code under discussion (diff hunk)</summary>

```diff
@@ -0,0 +1,102 @@
+import { type YieldDto } from '@suite-common/earn-stablecoin-api';
+import { type Account, type AccountKey } from '@suite-common/wallet-types';
+
+import { resolveYieldFlowData } from '../useResolvedYieldFlowData';
+
+const accountKey = 'eth-account-key' as AccountKey;
+const underlyingTokenAddress = '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48';
+const receiptTokenAddress = '0xde6c23e561f3e55846207ec45a91b777e0f7c889';
+const yieldId = 'ethereum-usdc-steakusdc';
+
+const account = {
+    key: accountKey,
+    symbol: 'eth',
+    tokens: [
+        {
+            contract: underlyingTokenAddress,
+            symbol: 'USDC',
+            decimals: 6,
+            balance: '25',
+        },
+        {
+            contract: receiptTokenAddress,
+            symbol: 'trSHUSDCp',
+            decimals: 18,
+            balance: '1.5',
+        },
+    ],
```

</details>

**Conversation**

**🟦 @cermakjiri (me)** · 2026-05-26

> e.g.:
> ```suggestion
>     ] satisfies Omit<TokenInfo, 'standard'>[],
> ```

**@BrantalikP** · 2026-05-26

> https://github.com/trezor/trezor-suite/pull/27718#discussion_r3302376413

---

### G34 — `suite-common/validators/src/types.ts:1`

- **PR** [#28797 — chore(validators): remove dead validator types](https://github.com/trezor/trezor-suite/pull/28797) · author `@mroz22` · closed
- **My first comment** 2026-06-18
- **Discussion thread** https://github.com/trezor/trezor-suite/pull/28797#discussion_r3434859843
- **Line of code** https://github.com/trezor/trezor-suite/blob/e036bd91faaf6704ba8192bf6060ba16195cac9b/suite-common/validators/src/types.ts#L1
- **Thread** 3 comment(s), 2 mine
- **Status** unresolved
- **Tags** `ambient-types`, `d-ts`, `module-augmentation`

<details>
<summary>Code under discussion (diff hunk)</summary>

```diff
@@ -1,11 +1,8 @@
-import { type AnySchema } from 'yup';
+export {};
```

</details>

**Conversation**

**@peter-sanderson** · 2026-06-17

> sus

**🟦 @cermakjiri (me)** · 2026-06-18

> it's this or `import './types';` in `validators/src/index.ts` 🤷‍♂️

**🟦 @cermakjiri (me)** · 2026-06-18

> no, now it can actually be just `validators.d.ts` that should be picked by ts without import, right?

---

### G40 — `suite-common/wallet-core/src/send/sendFormEthereumThunks.ts:439`

- **PR** [#28816 — feat(wallet-core): improve nonce discovery for EVM](https://github.com/trezor/trezor-suite/pull/28816) · author `@53gur0` · merged
- **My first comment** 2026-06-22
- **Discussion thread** https://github.com/trezor/trezor-suite/pull/28816#discussion_r3452406666
- **Line of code** https://github.com/trezor/trezor-suite/blob/2bb3fd21988b7db91be9d2fb8428da5de1bdbece/suite-common/wallet-core/src/send/sendFormEthereumThunks.ts#L439 _(thread is outdated — line refers to the original diff, may have moved)_
- **Thread** 2 comment(s), 1 mine
- **Status** unresolved · outdated
- **Tags** `account-with-network-type`, `suggestion`

<details>
<summary>Code under discussion (diff hunk)</summary>

```diff
@@ -350,39 +420,80 @@ export const composeEthereumTransactionFeeLevelsThunk = createThunk<
     },
 );
 
-export const ethereumGetCurrentNonceThunk = createThunk<
-    { nonce: string },
-    { selectedAccount: Account & { networkType: 'ethereum' }; rbfParams?: RbfTransactionParams }
->(
-    `${SEND_MODULE_PREFIX}/ethereumGetCurrentNonceThunk`,
-    ({ selectedAccount, rbfParams }, { getState }) => {
-        // Ethereum account `misc.nonce` is not updated before pending tx is mined
-        // Calculate `pendingNonce`: greatest value in pending tx + 1
-        // This may lead to unexpected/unwanted behavior
-        // whenever pending tx gets rejected all following txs (with higher nonce) will be rejected as well
-        const transactions = selectTransactions(getState());
-        const pendingTxs = (transactions[selectedAccount.key] || [])
-            .filter(isPending)
-            .filter(isSentTransaction);
-        const pendingNonce = pendingTxs.reduce((value, tx) => {
-            if (!tx.ethereumSpecific) return value;
+/**
+ * Resolves the nonce to use for the next Ethereum transaction.
+ *
+ * For RBF (cancel / speed-up) the original tx's nonce is reused. Otherwise:
+ *  - `confirmedNonce` = the account's current nonce from the backend (account.misc.nonce), or the
+ *    mined-only nonce from blockbook when `fetchConfirmedNonce` is true (trezor/blockbook#1562).
+ *  - `nonce` (signing default) = `confirmedNonce` advanced past any *contiguous* outgoing pending
+ *    txs. Gapped pending txs (e.g. a stuck tx far above the confirmed nonce) are ignored, so the
+ *    suggestion fills the gap instead of queueing behind an unmineable tx.
+ */
+export const resolveEthereumNonce = async ({
+    selectedAccount,
+    rbfParams,
+    accountTransactions,
+    fetchConfirmedNonce,
+}: {
+    selectedAccount: Account & { networkType: 'ethereum' };
```

</details>

**Conversation**

**🟦 @cermakjiri (me)** · 2026-06-22

> NIT: 
> ```suggestion
>     selectedAccount: AccountWithNetworkType<'ethereum'>
> ```

**@53gur0** · 2026-06-25

> fixup! 682b51f2f89b

---

### G42 — `suite-common/wallet-core/src/send/sendFormEthereumThunks.ts:75`

- **PR** [#28816 — feat(wallet-core): improve nonce discovery for EVM](https://github.com/trezor/trezor-suite/pull/28816) · author `@53gur0` · merged
- **My first comment** 2026-06-22
- **Discussion thread** https://github.com/trezor/trezor-suite/pull/28816#discussion_r3452740309
- **Line of code** https://github.com/trezor/trezor-suite/blob/2bb3fd21988b7db91be9d2fb8428da5de1bdbece/suite-common/wallet-core/src/send/sendFormEthereumThunks.ts#L75 _(thread is outdated — line refers to the original diff, may have moved)_
- **Thread** 3 comment(s), 1 mine
- **Status** unresolved · outdated
- **Tags** `explicit-annotation`, `suggestion`

<details>
<summary>Code under discussion (diff hunk)</summary>

```diff
@@ -52,6 +57,71 @@ import {
 import { selectAddressDisplayType } from '../settings/walletSettingsReducer';
 import { selectTransactions } from '../transactions/transactionsSelectors';
 
+/**
+ * Returns fee info with levels bumped above the original transaction's gas price,
+ * so that the replacement transaction will be accepted by the mempool.
+ *
+ * Expects `feeInfo` with levels already in Gwei (i.e. from selectConvertedNetworkFeeInfo).
+ * `originalGasParams` must also be in Gwei.
+ */
+export const getEthereumRbfFeeInfo = (
+    feeInfo: FeeInfo,
+    originalGasParams: { gasPrice?: string; maxFeePerGas?: string; maxPriorityFeePerGas?: string },
+): FeeInfo => {
+    // feeInfo.levels are already in Gwei — do NOT call getConvertedOrDefaultFeeInfo here,
+    // that would double-convert and produce near-zero values.
+    const { levels } = feeInfo;
+    // @ts-expect-error: indexing with noUncheckedIndexedAccess
+    const firstLevel: (typeof levels)[number] = levels[0];
```

</details>

**Conversation**

**🟦 @cermakjiri (me)** · 2026-06-22

> ```suggestion
>     const firstLevel: FeeLevel = levels[0];
> ```

**@53gur0** · 2026-06-29

> a32a3c185ec8
>
> also fixed type for the feeLevel to have at least one element 
> ```
> levels: [FeeLevel, ...FeeLevel[]];
> ```

**@53gur0** · 2026-06-29

> Unfortunately it's too many changes it seems. Would be great to address this issue separately. Had to rollback the type to possibly empty array

---

### G35 — `packages/suite/src/views/wallet/staking/components/TronStakingDashboard/TronResourcesCard/TronResourcesCard.tsx:15`

- **PR** [#28908 — feat(suite): implement tron staking dashboard](https://github.com/trezor/trezor-suite/pull/28908) · author `@matusbalascak` · merged
- **My first comment** 2026-06-19
- **Discussion thread** https://github.com/trezor/trezor-suite/pull/28908#discussion_r3440966584
- **Line of code** https://github.com/trezor/trezor-suite/blob/6110524d4bdcfe7c05c242cf1e60e55fe8336db2/packages/suite/src/views/wallet/staking/components/TronStakingDashboard/TronResourcesCard/TronResourcesCard.tsx#L15
- **Thread** 1 comment(s), 1 mine
- **Status** unresolved
- **Tags** `account-with-network-type`, `narrow-upstream`, `suggestion`

<details>
<summary>Code under discussion (diff hunk)</summary>

```diff
@@ -0,0 +1,85 @@
+import { useState } from 'react';
+
+import { Translation } from '@suite/intl';
+import { goto } from '@suite/router';
+import { type Account, type TronResourceType } from '@suite-common/wallet-types';
+import { getTronResources } from '@suite-common/wallet-utils';
+import { Button, Card, Column, Icon, Row, Text } from '@trezor/components';
+
+import { useDispatch } from 'src/hooks/suite';
+
+import { TronResourceModal } from '../TronResourceModal';
+import { TronResourceRow } from './TronResourceRow';
+
+interface TronResourcesCardProps {
+    account: Account;
```

</details>

**Conversation**

**🟦 @cermakjiri (me)** · 2026-06-19

> It might be useful to go with `AccountWithNetworkType<'tron'>` for stricter types and less conditions. 
> ```suggestion
>     account: AccountWithNetworkType<'tron'>;
> ```
> and do the "is it correct account check" only once somewhere upstream

---

### G57 — `suite-common/wallet-core/src/send/composeCancelTransaction/composeEthereumCancelTransactionThunk.ts:100`

- **PR** [#29622 — feat(suite-native): evm cancel ](https://github.com/trezor/trezor-suite/pull/29622) · author `@53gur0` · open
- **My first comment** 2026-07-30
- **Discussion thread** https://github.com/trezor/trezor-suite/pull/29622#discussion_r3682317823
- **Line of code** https://github.com/trezor/trezor-suite/blob/d7908c9bf897b8ce10011e7f9c02e81bba3612b5/suite-common/wallet-core/src/send/composeCancelTransaction/composeEthereumCancelTransactionThunk.ts#L100
- **Thread** 1 comment(s), 1 mine
- **Status** unresolved
- **Tags** `avoid-cast`, `satisfies`

<details>
<summary>Code under discussion (diff hunk)</summary>

```diff
@@ -0,0 +1,104 @@
+import { isRejected } from '@reduxjs/toolkit';
+
+import { createThunk } from '@suite-common/redux-utils';
+import { getNetwork } from '@suite-common/wallet-config';
+import {
+    type AccountWithNetworkType,
+    type FormState,
+    type PrecomposedTransactionFinalCancelRbf,
+    type WalletAccountTransactionWithRequiredRbfParams,
+} from '@suite-common/wallet-types';
+
+import { selectConvertedNetworkFeeInfo } from '../../fees/feesReducer';
+import { SEND_MODULE_PREFIX } from '../sendFormConstants';
+import { getEthereumRbfFeeInfo } from '../sendFormEthereumThunks';
+import { composeSendFormTransactionFeeLevelsThunk } from '../sendFormThunks';
+import { type ComposeFeeLevelsError } from '../sendFormTypes';
+
+export type ComposeEthereumCancelTransactionThunkParams = {
+    account: AccountWithNetworkType<'ethereum'>;
+    tx: WalletAccountTransactionWithRequiredRbfParams;
+};
+
+export type ComposedEthereumCancelTransaction = {
+    composedCancelTx: PrecomposedTransactionFinalCancelRbf;
+    cancelFormState: FormState;
+};
+
+/**
+ * Composes an EVM cancel transaction: a 0-value transfer to the account's own address reusing the
+ * original tx's nonce (via `rbfParams`, applied at signing time) with a fee bumped above the
+ * original gas params so the mempool accepts the replacement.
+ */
+export const composeEthereumCancelTransactionThunk = createThunk<
+    ComposedEthereumCancelTransaction,
+    ComposeEthereumCancelTransactionThunkParams,
+    { rejectValue: ComposeFeeLevelsError }
+>(
+    `${SEND_MODULE_PREFIX}/composeEthereumCancelTransactionThunk`,
+    async ({ account, tx }, { dispatch, getState, rejectWithValue }) => {
+        const feeInfo = selectConvertedNetworkFeeInfo(getState(), account.symbol);
+        const { rbfParams } = tx;
+
+        if (!feeInfo || rbfParams.type !== 'ethereum') {
+            return rejectWithValue({
+                error: 'fee-levels-compose-failed',
+                message: 'Missing fee info or invalid RBF params for Ethereum cancellation.',
+            });
+        }
+
+        const cancelFormState: FormState = {
+            outputs: [
+                {
+                    type: 'payment',
+                    address: account.descriptor,
+                    amount: '0',
+                    fiat: '',
+                    currency: { value: '', label: '' },
+                    token: null,
+                },
+            ],
+            selectedFee: 'normal',
+            feePerUnit: '',
+            feeLimit: '',
+            options: ['broadcast'],
+            isCoinControlEnabled: false,
+            hasCoinControlBeenOpened: false,
+            selectedUtxos: [],
+            rbfParams,
+        };
+
+        const response = await dispatch(
+            composeSendFormTransactionFeeLevelsThunk({
+                formState: cancelFormState,
+                composeContext: {
+                    account,
+                    network: getNetwork(account.symbol),
+                    feeInfo: getEthereumRbfFeeInfo(feeInfo, rbfParams),
+                },
+            }),
+        );
+
+        if (isRejected(response)) {
+            return rejectWithValue(response.payload ?? { error: 'fee-levels-compose-failed' });
+        }
+
+        const normalLevel = response.payload.normal;
+        if (!normalLevel || normalLevel.type === 'error' || normalLevel.type === 'nonfinal') {
+            return rejectWithValue({
+                error: 'fee-levels-compose-failed',
+                message: 'Unable to compose a valid cancellation fee level.',
+            });
+        }
+
+        return {
+            // The ethereum compose path never yields the Cardano-specific final shape.
+            composedCancelTx: {
+                ...normalLevel,
+                rbfType: 'cancel',
+                prevTxid: tx.txid,
+            } as PrecomposedTransactionFinalCancelRbf,
```

</details>

**Conversation**

**🟦 @cermakjiri (me)** · 2026-07-30

> The casting doesn't feel right here. Can we rather use `satisfies` or add new type?

---

### G62 — `suite-native/module-transactions/src/redux.d.ts:11`

- **PR** [#29622 — feat(suite-native): evm cancel ](https://github.com/trezor/trezor-suite/pull/29622) · author `@53gur0` · open
- **My first comment** 2026-07-30
- **Discussion thread** https://github.com/trezor/trezor-suite/pull/29622#discussion_r3682514942
- **Line of code** https://github.com/trezor/trezor-suite/blob/d7908c9bf897b8ce10011e7f9c02e81bba3612b5/suite-native/module-transactions/src/redux.d.ts#L11
- **Thread** 1 comment(s), 1 mine
- **Status** unresolved
- **Tags** `d-ts`, `redux-augmentation`, `question`

<details>
<summary>Code under discussion (diff hunk)</summary>

```diff
@@ -0,0 +1,11 @@
+import { type AsyncThunkAction, type ThunkAction } from '@reduxjs/toolkit';
+
+declare module 'redux' {
+    export interface Dispatch<A extends Action = AnyAction> {
+        <TThunk extends AsyncThunkAction<any, any, any>>(thunk: TThunk): ReturnType<TThunk>;
+
+        <ReturnType = any, State = any, ExtraThunkArg = any>(
+            thunkAction: ThunkAction<ReturnType, State, ExtraThunkArg, A>,
+        ): ReturnType;
+    }
+}
```

</details>

**Conversation**

**🟦 @cermakjiri (me)** · 2026-07-30

> is this really required? 👀

---

### G76 — `suite-common/wallet-utils/src/transactionUtils.ts:93`

- **PR** [#30910 — fix(suite-desktop): double-check nonces origination](https://github.com/trezor/trezor-suite/pull/30910) · author `@53gur0` · merged
- **My first comment** 2026-08-05
- **Discussion thread** https://github.com/trezor/trezor-suite/pull/30910#discussion_r3721463180
- **Line of code** https://github.com/trezor/trezor-suite/blob/12d9c3c83e0083f174dc67d285823596bbfba921/suite-common/wallet-utils/src/transactionUtils.ts#L93
- **Thread** 1 comment(s), 1 mine
- **Status** unresolved
- **Tags** `fix-the-type`, `tx-type-modelling`

<details>
<summary>Code under discussion (diff hunk)</summary>

```diff
@@ -70,11 +70,28 @@ export const isPending = (tx: WalletAccountTransaction | AccountTransaction) =>
     return !!tx && (!tx.blockHeight || tx.blockHeight < 0);
 };
 
-// Also matches 'contract': a contract-deployment tx is signed and broadcast from the account's own
-// address and consumes an EVM nonce exactly like a plain send, so it must count toward the same
-// nonce pool (see getEvmNonceInfo) even though blockbook classifies it under a distinct type.
-export const isSentTransaction = (tx: WalletAccountTransaction | AccountTransaction) =>
-    ['sent', 'self', 'contract'].includes(tx.type);
+// isAccountOwned is set by enhanceVinVout at transform time; the descriptor comparison is the
+// fallback for records where it is absent, and is case-insensitive because EVM addresses reach us in
+// mixed EIP-55 casing (cf. isOutgoing in blockchain-link-utils).
+const isSignedByDescriptor = (details: AccountTransaction['details'], descriptor: string) =>
+    !!details?.vin?.some(
+        vin =>
+            vin.isAccountOwned ||
+            vin.addresses?.some(address => address.toLowerCase() === descriptor.toLowerCase()),
+    );
+
+/**
+ * Whether the account itself signed (and paid for) the transaction.
+ *
+ * Deliberately not `tx.type`, which is a display label: it reads 'sent' for any transaction moving
+ * value out of the account — including one signed by a stranger, since an ERC-20 Transfer log or a
+ * transferFrom(account, …) call may name any `from` — and 'failed' for the account's own reverted
+ * sends. EVM nonce arithmetic needs authorship instead: a foreign transaction carries the *signer's*
+ * nonce, which says nothing about this account, while an own failed or contract-deployment
+ * transaction consumes a nonce exactly like a plain send.
+ */
+export const isSignedByAccount = (tx: Pick<WalletAccountTransaction, 'details' | 'descriptor'>) =>
```

</details>

**Conversation**

**🟦 @cermakjiri (me)** · 2026-08-05

> If I understand it correctly, the `sent` type is basically useless / broken because of: 
>
> > call may name any `from` — and 'failed' for the account's own reverted sends
>
> so wouldn't be better to fix the `sent` type or introduce new one... something in this direction?

---

### G86 — `suite-native/module-accounts-management/src/components/StablecoinYieldTokenOverview.tsx:262`

- **PR** [#31071 — fix(suite-native): communicate weth vault as eth](https://github.com/trezor/trezor-suite/pull/31071) · author `@TomasBoda` · merged
- **My first comment** 2026-08-10
- **Discussion thread** https://github.com/trezor/trezor-suite/pull/31071#discussion_r3750108169
- **Line of code** https://github.com/trezor/trezor-suite/blob/a9f17868ba66f7bbd488e71aa765c728422c1ae9/suite-native/module-accounts-management/src/components/StablecoinYieldTokenOverview.tsx#L262 _(thread is outdated — line refers to the original diff, may have moved)_
- **Thread** 4 comment(s), 1 mine
- **Status** resolved · outdated
- **Tags** `type-guard`, `is-network-symbol`, `suggestion`

<details>
<summary>Code under discussion (diff hunk)</summary>

```diff
@@ -256,14 +257,22 @@ export const StablecoinYieldTokenOverview = ({
                         {depositedPosition && (
                             <HStack alignItems="center" spacing="sp8">
                                 <TokenIcon
-                                    symbol={depositedPosition.symbol}
+                                    symbol={
+                                        wrappedNativeSymbol !== null
+                                            ? (wrappedNativeSymbol as NetworkSymbol)
```

</details>

**Conversation**

**@izmy** · 2026-08-10

> `toTokenSymbol(wrappedNativeSymbol)`

**@TomasBoda** · 2026-08-10

> doesn't work here. the `symbol` prop expects a `NetworkSymbol`

**🟦 @cermakjiri (me)** · 2026-08-10

> what about `wrappedNativeSymbol && isNetworkSymbol(wrappedNativeSymbol) ? ... : ...`?

**@TomasBoda** · 2026-08-11

> done

---
