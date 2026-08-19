# Readability & simplification

Extracting named helpers/variables, early returns over nesting, dropping redundant branches, naming, and reusing existing utils.

**11 review-thread-group(s)** · [← back to index](../README.md)

Tags: `duplication` ×2, `extract-fn` ×2, `address-comparison`, `address-normalization`, `copy-paste`, `correctness-question`, `dead-branch`, `design-system`, `early-return`, `extract-condition`, `helper-fn`, `naming`, `nesting`, `no-mutation`, `nonce-logic`, `prefer-filter-over-if-else`, `reuse-existing-util`, `shared-type`, `status-enum`, `styling`, `suggestion`, `to-sorted`

| # | PR | File | Tags |
| --- | --- | --- | --- |
| [G26](#g26--suite-nativemodule-earnsrchooksuseyielddepositreviewts34) | [#27718](https://github.com/trezor/trezor-suite/pull/27718) | `useYieldDepositReview.ts:34` | naming, status-enum |
| [G12](#g12--packagessuitesrcviewswallettradingcommontradingformtradingapprovemodaltsx96) | [#27901](https://github.com/trezor/trezor-suite/pull/27901) | `TradingApproveModal.tsx:96` | address-normalization, helper-fn |
| [G14](#g14--suite-commonwallet-coresrcaccountsaccountsthunksts166) | [#27901](https://github.com/trezor/trezor-suite/pull/27901) | `accountsThunks.ts:166` | prefer-filter-over-if-else |
| [G29](#g29--suite-commonwallet-coresrcsendtronbuildcontractts9) | [#28234](https://github.com/trezor/trezor-suite/pull/28234) | `buildContract.ts:9` | shared-type, duplication |
| [G37](#g37--suite-nativetransactionssrccomponentstransactiontargettsx119) | [#28948](https://github.com/trezor/trezor-suite/pull/28948) | `TransactionTarget.tsx:119` | dead-branch, suggestion |
| [G51](#g51--packagessuitesrccomponentsearndashboardstakingearnstakingaccountrowtsx386) | [#29031](https://github.com/trezor/trezor-suite/pull/29031) | `EarnStakingAccountRow.tsx:386` | extract-condition, duplication |
| [G68](#g68--suite-commonwallet-utilssrccardanostakingutilsts111) | [#30028](https://github.com/trezor/trezor-suite/pull/30028) | `cardanoStakingUtils.ts:111` | to-sorted, no-mutation |
| [G69](#g69--packagessuitesrcactionswalletstakestakeformcardanoactionsts421) | [#30028](https://github.com/trezor/trezor-suite/pull/30028) | `stakeFormCardanoActions.ts:421` | extract-fn, early-return, nesting |
| [G73](#g73--suite-commonwallet-utilssrctransactionutilsts182) | [#30910](https://github.com/trezor/trezor-suite/pull/30910) | `transactionUtils.ts:182` | extract-fn, nonce-logic, correctness-question |
| [G75](#g75--suite-commonwallet-utilssrctransactionutilsts80) | [#30910](https://github.com/trezor/trezor-suite/pull/30910) | `transactionUtils.ts:80` | reuse-existing-util, address-comparison |
| [G79](#g79--suite-nativemodule-accounts-managementsrccomponentsyourpositioncardtsx30) | [#30994](https://github.com/trezor/trezor-suite/pull/30994) | `YourPositionCard.tsx:30` | styling, copy-paste, design-system |

---

### G26 — `suite-native/module-earn/src/hooks/useYieldDepositReview.ts:34`

- **PR** [#27718 — feat(suite-native): yield deposit](https://github.com/trezor/trezor-suite/pull/27718) · author `@BrantalikP` · merged
- **My first comment** 2026-05-26
- **Discussion thread** https://github.com/trezor/trezor-suite/pull/27718#discussion_r3302415688
- **Line of code** https://github.com/trezor/trezor-suite/blob/49849a8b2a17ae6deeb8424b91a233ea3d219618/suite-native/module-earn/src/hooks/useYieldDepositReview.ts#L34 _(thread is outdated — line refers to the original diff, may have moved)_
- **Thread** 2 comment(s), 1 mine
- **Status** resolved · outdated
- **Tags** `naming`, `status-enum`

<details>
<summary>Code under discussion (diff hunk)</summary>

```diff
@@ -0,0 +1,155 @@
+import { useCallback, useState } from 'react';
+import { useDispatch, useSelector } from 'react-redux';
+
+import { useNavigation } from '@react-navigation/native';
+import { isRejected } from '@reduxjs/toolkit';
+
+import {
+    type StablecoinYieldRootState,
+    type YieldFlowResolvedData,
+    selectStablecoinYieldTxReview,
+} from '@suite-common/wallet-core';
+import { requestPrioritizedDeviceAccess } from '@suite-native/device-mutex';
+import type {
+    StackNavigationProps,
+    YieldStackParamList,
+    YieldStackRoutes,
+} from '@suite-native/navigation';
+
+import { USER_CANCELLED_ERROR_CODES } from '../constants';
+import { pushYieldActionReviewThunk, signYieldActionReviewThunk } from '../yieldTransactionThunks';
+import { useShowPushTransactionFailedDuringReviewAlert } from './useShowPushTransactionFailedDuringReviewAlert';
+
+type UseYieldDepositReviewParams = {
+    flowData: YieldFlowResolvedData;
+    flowKey: string;
+};
+
+type UseYieldDepositReviewResult = {
+    handleSubmitDepositReview: () => Promise<void>;
+    handleDepositSubmitted: () => Promise<void>;
+    isSendingDeposit: boolean;
+    isSigningDeposit: boolean;
+    isSubmitDisabled: boolean;
+    isDepositSigned: boolean;
```

</details>

**Conversation**

**🟦 @cermakjiri (me)** · 2026-05-26

> `depositStatus` might be more suitable for so many states

**@BrantalikP** · 2026-05-26

>  https://github.com/trezor/trezor-suite/pull/27718/changes/0743fc3a03ac49eb3c3283cca51f78db6f9f21c1

---

### G12 — `packages/suite/src/views/wallet/trading/common/TradingForm/TradingApproveModal.tsx:96`

- **PR** [#27901 — Yield speed up transaction support](https://github.com/trezor/trezor-suite/pull/27901) · author `@matusbalascak` · merged
- **My first comment** 2026-05-21
- **Discussion thread** https://github.com/trezor/trezor-suite/pull/27901#discussion_r3279119442
- **Line of code** https://github.com/trezor/trezor-suite/blob/776fa680167b24f58af7090350ed97bbd77587f2/packages/suite/src/views/wallet/trading/common/TradingForm/TradingApproveModal.tsx#L96 _(thread is outdated — line refers to the original diff, may have moved)_
- **Thread** 2 comment(s), 2 mine
- **Status** unresolved · outdated
- **Tags** `address-normalization`, `helper-fn`

<details>
<summary>Code under discussion (diff hunk)</summary>

```diff
@@ -92,8 +92,8 @@ export const TradingApproveModal = ({ amount, cryptoId }: TradingApproveModalPro
         const exchange = selectedQuote?.exchange;
         const provider = exchange ? providersInfo?.[exchange] : null;
 
-        const approvalData = getEvmApprovalTxData(selectedQuote?.dexTx?.data);
-        const spender = approvalData?.spender ?? null;
+        const approvalData = Calldata.evm.erc20.approve.decode(selectedQuote?.dexTx?.data);
+        const spender = approvalData?.spender.toLowerCase() ?? null;
```

</details>

**Conversation**

**🟦 @cermakjiri (me)** · 2026-05-21

> Would it make sense to return the `spender` from `decode` as `approvalData?.spender.toLowerCase() ?? null`?

**🟦 @cermakjiri (me)** · 2026-05-21

> Or use some general method for formatting the address based on network?

---

### G14 — `suite-common/wallet-core/src/accounts/accountsThunks.ts:166`

- **PR** [#27901 — Yield speed up transaction support](https://github.com/trezor/trezor-suite/pull/27901) · author `@matusbalascak` · merged
- **My first comment** 2026-05-21
- **Discussion thread** https://github.com/trezor/trezor-suite/pull/27901#discussion_r3279157068
- **Line of code** https://github.com/trezor/trezor-suite/blob/776fa680167b24f58af7090350ed97bbd77587f2/suite-common/wallet-core/src/accounts/accountsThunks.ts#L166
- **Thread** 1 comment(s), 1 mine
- **Status** unresolved
- **Tags** `prefer-filter-over-if-else`

<details>
<summary>Code under discussion (diff hunk)</summary>

```diff
@@ -159,9 +159,24 @@ export const fetchAndUpdateAccountThunk = createThunk(
                 dispatch(transactionsActions.removeTransaction({ account, txs: analyze.remove }));
             }
             if (analyze.add.length > 0) {
+                // Blockbook returns empty tokens for pending contract calls. Copy them
+                // from our fake tx (identified by `deadline`) so RBF on this pending tx still
+                // has token + amount.
+                const enrichedAdd = analyze.add.map(freshTx => {
+                    if ((freshTx.tokens?.length ?? 0) > 0) return freshTx;
```

</details>

**Conversation**

**🟦 @cermakjiri (me)** · 2026-05-21

> NIT 🤏: `.filter` > `if/else`

---

### G29 — `suite-common/wallet-core/src/send/tron/buildContract.ts:9`

- **PR** [#28234 — feat(suite): add transaction data editor to tron send form](https://github.com/trezor/trezor-suite/pull/28234) · author `@matusbalascak` · merged
- **My first comment** 2026-06-01
- **Discussion thread** https://github.com/trezor/trezor-suite/pull/28234#discussion_r3334490148
- **Line of code** https://github.com/trezor/trezor-suite/blob/14f1ff0af72ac9b357b3b085fede1021ddaab031/suite-common/wallet-core/src/send/tron/buildContract.ts#L9 _(thread is outdated — line refers to the original diff, may have moved)_
- **Thread** 1 comment(s), 1 mine
- **Status** resolved · outdated
- **Tags** `shared-type`, `duplication`

<details>
<summary>Code under discussion (diff hunk)</summary>

```diff
@@ -0,0 +1,39 @@
+export const buildTriggerContract = ({
+    ownerHex,
+    recipientHex,
+    data,
+}: {
+    ownerHex: string;
+    recipientHex: string;
+    data: string;
+}) =>
```

</details>

**Conversation**

**🟦 @cermakjiri (me)** · 2026-06-01

> nit: put it to shared interface / type with `buildTransferContract`?

---

### G37 — `suite-native/transactions/src/components/TransactionTarget.tsx:119`

- **PR** [#28948 — fix(suite-native): display aggregated amounts on tx list item](https://github.com/trezor/trezor-suite/pull/28948) · author `@53gur0` · merged
- **My first comment** 2026-06-22
- **Discussion thread** https://github.com/trezor/trezor-suite/pull/28948#discussion_r3452277831
- **Line of code** https://github.com/trezor/trezor-suite/blob/c8494882fbe89e3e5478598c155ac54dd43dd25a/suite-native/transactions/src/components/TransactionTarget.tsx#L119 _(thread is outdated — line refers to the original diff, may have moved)_
- **Thread** 2 comment(s), 1 mine
- **Status** unresolved · outdated
- **Tags** `dead-branch`, `suggestion`

<details>
<summary>Code under discussion (diff hunk)</summary>

```diff
@@ -116,14 +116,14 @@ export const TransactionTarget = ({
         if (isSolanaUnstakeTx) return null;
         switch (type) {
             case 'target':
-                return transaction.amount;
+                return payload.amount;
```

</details>

**Conversation**

**🟦 @cermakjiri (me)** · 2026-06-22

> All cases return the same value, so:
> ```suggestion
> ```

**@53gur0** · 2026-06-22

> fixup! fb26ac6cfe55e183a65697034cc8aa6bc5219871

---

### G51 — `packages/suite/src/components/earn/dashboard/staking/EarnStakingAccountRow.tsx:386`

- **PR** [#29031 — Tron - Earn dashboard + Staking limits](https://github.com/trezor/trezor-suite/pull/29031) · author `@TomasBoda` · merged
- **My first comment** 2026-06-24
- **Discussion thread** https://github.com/trezor/trezor-suite/pull/29031#discussion_r3467480205
- **Line of code** https://github.com/trezor/trezor-suite/blob/30b4edc6e5f92ac9b4ee75d6982d15bf59c66322/packages/suite/src/components/earn/dashboard/staking/EarnStakingAccountRow.tsx#L386 _(thread is outdated — line refers to the original diff, may have moved)_
- **Thread** 2 comment(s), 1 mine
- **Status** unresolved · outdated
- **Tags** `extract-condition`, `duplication`

<details>
<summary>Code under discussion (diff hunk)</summary>

```diff
@@ -338,7 +382,8 @@ export const EarnStakingAccountRow = ({
             </Table.Cell>
 
             <Table.Cell>
-                {stakingStatus === 'staking-outdated-provider' ? (
+                {stakingStatus === 'staking-outdated-provider' ||
+                stakingStatus === 'staking-remaining-votes' ? (
```

</details>

**Conversation**

**🟦 @cermakjiri (me)** · 2026-06-24

> there's same condition for this and the case above, what about putting it into some var?
> ```ts
> const apyAvailable = stakingStatus !== 'staking-outdated-provider' && stakingStatus !== 'staking-remaining-votes'
> ```

**@TomasBoda** · 2026-06-26

> done

---

### G68 — `suite-common/wallet-utils/src/cardanoStakingUtils.ts:111`

- **PR** [#30028 — Cardano staking updates](https://github.com/trezor/trezor-suite/pull/30028) · author `@tomasklim` · merged
- **My first comment** 2026-08-04
- **Discussion thread** https://github.com/trezor/trezor-suite/pull/30028#discussion_r3711920509
- **Line of code** https://github.com/trezor/trezor-suite/blob/7e62dbfeaae420a6bb64042264b12dccdd3ba28d/suite-common/wallet-utils/src/cardanoStakingUtils.ts#L111 _(thread is outdated — line refers to the original diff, may have moved)_
- **Thread** 1 comment(s), 1 mine
- **Status** unresolved · outdated
- **Tags** `to-sorted`, `no-mutation`

<details>
<summary>Code under discussion (diff hunk)</summary>

```diff
@@ -92,27 +91,30 @@ export const poolBech32ToHex = (poolId: string): string => {
     return Buffer.from(bytes).toString('hex');
 };
 
-export const selectBestCardanoPool = (pools?: AdaPools['pools']) => {
-    if (!pools || pools.length === 0) return CARDANO_EVERSTAKE_STAKING_POOL;
-
-    // find the one within the threshold
-    const bestPool = pools.find(pool => pool.saturation < CARDANO_POOL_SATURATION_SAFE_THRESHOLD);
-
-    if (bestPool) {
+export const selectBestCardanoPool = (pools?: AdaPools['pools'], currentPoolId?: string | null) => {
+    // An account already delegated to an Everstake pool must never be moved to another
+    // pool, no matter which UI flow composes the delegation.
+    if (
+        currentPoolId &&
+        (EVERSTAKE_POOLS.includes(currentPoolId) || pools?.some(pool => pool.id === currentPoolId))
+    ) {
         return {
-            hex: poolBech32ToHex(bestPool.id),
-            bech32: bestPool.id,
+            hex: poolBech32ToHex(currentPoolId),
+            bech32: currentPoolId,
         };
     }
 
-    // pick the last one (lowest saturation)
-    const fallbackIndex = pools.length - 1;
-    // @ts-expect-error: indexing with noUncheckedIndexedAccess
-    const fallback: (typeof pools)[number] = pools[fallbackIndex];
+    if (!pools || pools.length === 0) return CARDANO_EVERSTAKE_STAKING_POOL;
+
+    // Sort client-side instead of relying on the API ordering contract; new stakes
+    // always go to the least saturated pool.
+    const [bestPool] = [...pools].sort((a, b) => a.saturation - b.saturation);
```

</details>

**Conversation**

**🟦 @cermakjiri (me)** · 2026-08-04

> nit: `pools.toSorted`

---

### G69 — `packages/suite/src/actions/wallet/stake/stakeFormCardanoActions.ts:421`

- **PR** [#30028 — Cardano staking updates](https://github.com/trezor/trezor-suite/pull/30028) · author `@tomasklim` · merged
- **My first comment** 2026-08-04
- **Discussion thread** https://github.com/trezor/trezor-suite/pull/30028#discussion_r3711981075
- **Line of code** https://github.com/trezor/trezor-suite/blob/7e62dbfeaae420a6bb64042264b12dccdd3ba28d/packages/suite/src/actions/wallet/stake/stakeFormCardanoActions.ts#L421 _(thread is outdated — line refers to the original diff, may have moved)_
- **Thread** 1 comment(s), 1 mine
- **Status** unresolved · outdated
- **Tags** `extract-fn`, `early-return`, `nesting`

<details>
<summary>Code under discussion (diff hunk)</summary>

```diff
@@ -395,5 +402,23 @@ export const signTransaction =
             return signedTx;
         }
 
-        return signedTx.payload.serializedTx;
+        // Report the pool from the certificate that was actually signed, not a later
+        // recomputation — a divergence from the account pool must stay observable.
+        const fromPool = getCardanoAccountPoolId(account);
+        const poolDelegation: StakingCardanoPoolDelegationPayload | undefined =
+            formValues.stakeType === 'stake'
+                ? {
+                      fromPool: fromPool ? (EVERSTAKE_POOL_NAMES[fromPool] ?? fromPool) : undefined,
+                      toPool: EVERSTAKE_POOL_NAMES[selectedPool.bech32] ?? selectedPool.bech32,
+                      toPoolSaturation: cardanoPools.find(pool => pool.id === selectedPool.bech32)
+                          ?.saturation,
+                      poolsDataAvailable: cardanoPools.length > 0,
+                      isEverstakeToEverstake:
+                          fromPool !== null &&
+                          fromPool !== selectedPool.bech32 &&
+                          isCardanoStakedWithEverstake(account, cardanoPools),
+                  }
+                : undefined;
```

</details>

**Conversation**

**🟦 @cermakjiri (me)** · 2026-08-04

> NIT (readability): It took me a while to digest this piece, I'd move it to `getPoolDelegation` with early `return` avoiding nesting.

---

### G73 — `suite-common/wallet-utils/src/transactionUtils.ts:182`

- **PR** [#30910 — fix(suite-desktop): double-check nonces origination](https://github.com/trezor/trezor-suite/pull/30910) · author `@53gur0` · merged
- **My first comment** 2026-08-05
- **Discussion thread** https://github.com/trezor/trezor-suite/pull/30910#discussion_r3721407524
- **Line of code** https://github.com/trezor/trezor-suite/blob/12d9c3c83e0083f174dc67d285823596bbfba921/suite-common/wallet-utils/src/transactionUtils.ts#L182
- **Thread** 3 comment(s), 2 mine
- **Status** unresolved
- **Tags** `extract-fn`, `nonce-logic`, `correctness-question`

<details>
<summary>Code under discussion (diff hunk)</summary>

```diff
@@ -157,10 +174,12 @@ export const getEvmNonceInfo = (
 
     // accountNonce (e.g. account.misc.nonce) can lag behind the local tx list if it hasn't been
     // refreshed since a confirmed tx was locally picked up. A locally confirmed nonce proves a
-    // higher true nonce exists, so it's a floor accountNonce can't be below. When no confirmed
-    // nonce is locally known this is 0, so it never lowers accountNonce.
-    const maxLocalConfirmedNonce = confirmedNonces.size > 0 ? Math.max(...confirmedNonces) + 1 : 0;
-    const effectiveAccountNonce = Math.max(accountNonce, maxLocalConfirmedNonce);
+    // higher true nonce exists, so it's a floor accountNonce can't be below. The floor walks up
+    // contiguously rather than jumping to max(confirmedNonces): an isolated outlier (a corrupted
+    // record, or a nonce that never belonged to this account) is then never reached — see
+    // getEvmNonceInfoFromConfirmedNonce for the same reasoning.
+    let effectiveAccountNonce = accountNonce;
+    while (confirmedNonces.has(effectiveAccountNonce)) effectiveAccountNonce += 1;
```

</details>

**Conversation**

**🟦 @cermakjiri (me)** · 2026-08-05

> So is it really ok not to take the highest one, right?
>
> I know it's minor but what about wrapping it to new fn so it's easily digestible (for other readers) by the fn name and if needed then the long comment?
> ```ts
> /**
>    ...
> */
> function getNextAvailableEvmNonce(confirmedNonces: Set<string>, accountNonce: string) {
>   let effectiveAccountNonce = accountNonce;
>
>    while (confirmedNonces.has(effectiveAccountNonce)) effectiveAccountNonce += 1
>
>   return effectiveAccountNonce  
> }

**@53gur0** · 2026-08-05

> the issue was that list of pending nonces also contained transactions and nonces that were not created by the user

**🟦 @cermakjiri (me)** · 2026-08-05

> okay

---

### G75 — `suite-common/wallet-utils/src/transactionUtils.ts:80`

- **PR** [#30910 — fix(suite-desktop): double-check nonces origination](https://github.com/trezor/trezor-suite/pull/30910) · author `@53gur0` · merged
- **My first comment** 2026-08-05
- **Discussion thread** https://github.com/trezor/trezor-suite/pull/30910#discussion_r3721438603
- **Line of code** https://github.com/trezor/trezor-suite/blob/12d9c3c83e0083f174dc67d285823596bbfba921/suite-common/wallet-utils/src/transactionUtils.ts#L80
- **Thread** 1 comment(s), 1 mine
- **Status** unresolved
- **Tags** `reuse-existing-util`, `address-comparison`

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
```

</details>

**Conversation**

**🟦 @cermakjiri (me)** · 2026-08-05

> what about using `areEvmAddressesEqual`?

---

### G79 — `suite-native/module-accounts-management/src/components/YourPositionCard.tsx:30`

- **PR** [#30994 — Mobile - Asset Detail Screen Revamp](https://github.com/trezor/trezor-suite/pull/30994) · author `@TomasBoda` · merged
- **My first comment** 2026-08-10
- **Discussion thread** https://github.com/trezor/trezor-suite/pull/30994#discussion_r3749129439
- **Line of code** https://github.com/trezor/trezor-suite/blob/132bc2d7a32741a02b2270d1acff6ed8ed9dc22b/suite-native/module-accounts-management/src/components/YourPositionCard.tsx#L30
- **Thread** 2 comment(s), 1 mine
- **Status** resolved
- **Tags** `styling`, `copy-paste`, `design-system`

<details>
<summary>Code under discussion (diff hunk)</summary>

```diff
@@ -0,0 +1,218 @@
+import { useSelector } from 'react-redux';
+
+import { useAllYieldOpportunities } from '@suite-common/earn-stablecoin-api';
+import {
+    type NetworkSymbol,
+    getDisplaySymbol,
+    getNetworkDisplaySymbolName,
+} from '@suite-common/wallet-config';
+import {
+    type AccountsRootState,
+    selectAccountByKey,
+    selectAccountNetworkSymbol,
+} from '@suite-common/wallet-core';
+import {
+    type Account,
+    type AccountKey,
+    type TokenAddress,
+    type TokenInfoBranded,
+    type TokenSymbol,
+} from '@suite-common/wallet-types';
+import { isApyAvailable, isErc4626 } from '@suite-common/wallet-utils';
+import { Box, Card, HStack, Text } from '@suite-native/atoms';
+import {
+    CryptoAmountFormatter,
+    CryptoToFiatAmountFormatter,
+    TokenAmountFormatter,
+    TokenToFiatAmountFormatter,
+} from '@suite-native/formatters';
+import { TokenIcon } from '@suite-native/icons';
+import {
+    YieldBadge,
+    useNativeYieldVault,
+    useStakingRate,
+    useYieldBadge,
+} from '@suite-native/module-earn';
+import { type TokensRootState, selectAccountTokenInfo } from '@suite-native/tokens';
+import { prepareNativeStyle, useNativeStyles } from '@trezor/styles-native';
+
+const cardStyle = prepareNativeStyle(utils => ({
+    flexDirection: 'row',
+    justifyContent: 'space-between',
+    alignItem: 'center',
+    marginHorizontal: utils.spacings.sp16,
+    padding: utils.spacings.sp16,
+    backgroundColor: utils.colors.surfaceFillRaised,
+    borderRadius: utils.borders.radii.r16,
+}));
+
+const cardContentStyle = prepareNativeStyle(_ => ({
+    flexShrink: 1,
+    justifyContent: 'flex-start',
+    alignItems: 'flex-start',
+}));
```

</details>

**Conversation**

**🟦 @cermakjiri (me)** · 2026-08-10

> I know if I'd do this in Suite desktop, Growth team will say something... but I assume it's more relaxed in suite-native 😄

**@TomasBoda** · 2026-08-10

> I think I copied this from the previous asset card 😬

---
