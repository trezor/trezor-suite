# Runtime validation & parsing

Zod schemas for parsing `unknown` data instead of casting, and questioning validation constraints in low-level converters.

**3 review-thread-group(s)** · [← back to index](../README.md)

Tags: `zod` ×2, `avoid-cast`, `bigint-hex`, `edge-cases`, `input-constraints`, `optional-chaining`, `unknown-data`

| # | PR | File | Tags |
| --- | --- | --- | --- |
| [G32](#g32--suite-commonwallet-utilssrcethconverterts33) | [#28414](https://github.com/trezor/trezor-suite/pull/28414) | `ethConverter.ts:33` | input-constraints, edge-cases, bigint-hex |
| [G41](#g41--suite-commonwallet-coresrcsendsendformethereumthunksts82) | [#28816](https://github.com/trezor/trezor-suite/pull/28816) | `sendFormEthereumThunks.ts:82` | zod, avoid-cast, unknown-data |
| [G59](#g59--suite-nativemodule-transactionssrchooksusecancelevmtransactionts67) | [#29622](https://github.com/trezor/trezor-suite/pull/29622) | `useCancelEvmTransaction.ts:67` | zod, optional-chaining |

---

### G32 — `suite-common/wallet-utils/src/ethConverter.ts:33`

- **PR** [#28414 — Eth conversion utils](https://github.com/trezor/trezor-suite/pull/28414) · author `@marekrjpolak` · merged
- **My first comment** 2026-06-15
- **Discussion thread** https://github.com/trezor/trezor-suite/pull/28414#discussion_r3411500893
- **Line of code** https://github.com/trezor/trezor-suite/blob/f1bc0880bc762d80234ead125311c8a867fdb6ab/suite-common/wallet-utils/src/ethConverter.ts#L33
- **Thread** 4 comment(s), 1 mine
- **Status** unresolved
- **Tags** `input-constraints`, `edge-cases`, `bigint-hex`

<details>
<summary>Code under discussion (diff hunk)</summary>

```diff
@@ -0,0 +1,94 @@
+import type {
+    DecimalString,
+    Ether,
+    Gwei,
+    HexString,
+    IntegerString,
+    Wei,
+} from '@suite-common/wallet-types';
+import { BigNumber } from '@trezor/utils';
+
+interface EthValue {
+    toWei(format: 'hex'): Wei & HexString;
+    toWei(format: 'bignumber'): Wei & BigNumber;
+    toWei(format?: 'string'): Wei & IntegerString;
+    toGwei(format: 'bignumber'): Gwei & BigNumber;
+    toGwei(format?: 'string'): Gwei & DecimalString;
+    toEther(format: 'bignumber'): Ether & BigNumber;
+    toEther(format?: 'string'): Ether & DecimalString;
+}
+
+const GWEI_DECIMALS = 9;
+const ETHER_DECIMALS = 18;
+
+const error = (value: unknown, reason: string) =>
+    new Error(`Value '${value}' is invalid (${reason})`);
+
+const toHex = (value: BigNumber): HexString => `0x${value.toString(16)}`;
+
+const toBN = (value: string | bigint, shift = 0) => {
+    const bn = new BigNumber(value);
+
+    if (bn.isNaN()) throw error(value, 'not a number');
+    if (bn.isNegative()) throw error(value, 'negative');
```

</details>

**Conversation**

**🟦 @cermakjiri (me)** · 2026-06-15

> Why can't it be negative?

**@marekrjpolak** · 2026-06-15

> Because I said so? :melting_face:  Actually it's a good question. I just thought that negative value in hex would be something like `-0xabcd` and given that we often do things like `slice(2)`, it would've been broken anyway. The same applies to decimal numbers like `0xab.cd`.
>
> By the way the old `web3-utils` does this:
> ```
> console.log(fromWei('-1234', 'gwei')); // prints 0.0000-1234
> ```
>
> Do we expect negative ether/gwei/wei amounts somewhere?

**@53gur0** · 2026-06-15

> yes, like displaying a tx fee

**@marekrjpolak** · 2026-06-15

> But the fee is not really negative, or is it? You mean this? 
> <img width="280" height="104" alt="image" src="https://github.com/user-attachments/assets/e2482162-fb20-483d-ad57-6822ef4169e9" />
>
> The thing is that these utils are more low-level and I don't want to end up with negative hexes and stuff like that.

---

### G41 — `suite-common/wallet-core/src/send/sendFormEthereumThunks.ts:82`

- **PR** [#28816 — feat(wallet-core): improve nonce discovery for EVM](https://github.com/trezor/trezor-suite/pull/28816) · author `@53gur0` · merged
- **My first comment** 2026-06-22
- **Discussion thread** https://github.com/trezor/trezor-suite/pull/28816#discussion_r3452739137
- **Line of code** https://github.com/trezor/trezor-suite/blob/2bb3fd21988b7db91be9d2fb8428da5de1bdbece/suite-common/wallet-core/src/send/sendFormEthereumThunks.ts#L82 _(thread is outdated — line refers to the original diff, may have moved)_
- **Thread** 1 comment(s), 1 mine
- **Status** unresolved · outdated
- **Tags** `zod`, `avoid-cast`, `unknown-data`

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
+    if (!firstLevel) return feeInfo;
+
+    if (isEip1559(originalGasParams) && isEip1559(firstLevel)) {
+        const currentMaxFee = new BigNumber(originalGasParams.maxFeePerGas);
+        // Cast back to access maxPriorityFeePerGas — isEip1559 narrows to { maxFeePerGas: string } only
+        const currentMaxPriorityFee = new BigNumber(
+            (originalGasParams as { maxPriorityFeePerGas?: string }).maxPriorityFeePerGas || '0',
```

</details>

**Conversation**

**🟦 @cermakjiri (me)** · 2026-06-22

> What about using some Zod schema for parsing of the unknown data instead of the casting? There's already something related to that here `suite-common/schemas/src/evm/fees/index.ts` but it's been done only for hex strings yet.

---

### G59 — `suite-native/module-transactions/src/hooks/useCancelEvmTransaction.ts:67`

- **PR** [#29622 — feat(suite-native): evm cancel ](https://github.com/trezor/trezor-suite/pull/29622) · author `@53gur0` · open
- **My first comment** 2026-07-30
- **Discussion thread** https://github.com/trezor/trezor-suite/pull/29622#discussion_r3682364238
- **Line of code** https://github.com/trezor/trezor-suite/blob/d7908c9bf897b8ce10011e7f9c02e81bba3612b5/suite-native/module-transactions/src/hooks/useCancelEvmTransaction.ts#L67
- **Thread** 1 comment(s), 1 mine
- **Status** unresolved
- **Tags** `zod`, `optional-chaining`

<details>
<summary>Code under discussion (diff hunk)</summary>

```diff
@@ -0,0 +1,221 @@
+import { useCallback, useMemo } from 'react';
+import { useDispatch, useSelector } from 'react-redux';
+
+import { useNavigation } from '@react-navigation/native';
+import { isFulfilled, isRejected } from '@reduxjs/toolkit';
+
+import { useMutation } from '@suite-common/react-query';
+import {
+    type AccountsRootState,
+    type PushTransactionError,
+    type SignTransactionError,
+    type SignTransactionTimeoutError,
+    type TransactionsRootState,
+    composeEthereumCancelTransactionThunk,
+    selectAccountByKey,
+    selectIsTransactionPending,
+    useEvmNonceInfo,
+} from '@suite-common/wallet-core';
+import {
+    type AccountKey,
+    type WalletAccountTransaction,
+    type WalletAccountTransactionWithRequiredRbfParams,
+} from '@suite-common/wallet-types';
+import {
+    getNetworkAccountFeatures,
+    getPendingEvmNonceStatus,
+    isTransactionBumpable,
+    isTransactionCancellable,
+} from '@suite-common/wallet-utils';
+import { useTranslate } from '@suite-native/intl';
+import {
+    type NavigateParameters,
+    type RootStackParamList,
+    RootStackRoutes,
+    type StackToStackCompositeNavigationProps,
+    type TransactionDetailStackParamList,
+    TransactionDetailStackRoutes,
+} from '@suite-native/navigation';
+import { signAndPushEvmCancelTransactionThunk } from '@suite-native/send';
+import { useToast } from '@suite-native/toasts';
+
+import { useDeviceGuardedSign } from './useDeviceGuardedSign';
+
+type NavigationProp = StackToStackCompositeNavigationProps<
+    TransactionDetailStackParamList,
+    TransactionDetailStackRoutes.TransactionDetail,
+    RootStackParamList
+>;
+
+const hasEthereumRbfParams = (
+    tx: WalletAccountTransaction,
+): tx is WalletAccountTransactionWithRequiredRbfParams => tx.rbfParams?.type === 'ethereum';
+
+// Mirrors the reject value of signAndPushEvmCancelTransactionThunk.
+type CancelFailure =
+    | SignTransactionError
+    | SignTransactionTimeoutError
+    | PushTransactionError
+    | undefined;
+
+// Extracts a human-readable failure reason: push failures carry the node's message in `metadata`
+// (e.g. "nonce too low", "could not replace existing tx"), while signing failures/timeouts expose
+// it directly on `message`.
+const getCancelFailureReason = (error: CancelFailure): string | undefined => {
+    if (!error) return undefined;
+
+    if ('metadata' in error) return error.metadata.error.message;
```

</details>

**Conversation**

**🟦 @cermakjiri (me)** · 2026-07-30

> I dunno, I'd either use Zod schema for parsing or use `.?` operator as it can be undefined

---
