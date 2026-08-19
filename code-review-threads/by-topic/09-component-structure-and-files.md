# Component structure & file layout

One React component per file, extracting sub-components, hooks in their own file next to the component, and package/folder structure (tree-like vs. linear).

**7 review-thread-group(s)** · [← back to index](../README.md)

Tags: `extract-component` ×2, `one-component-per-file` ×2, `conventions`, `early-return`, `evm-vs-common`, `extensibility`, `folder-structure`, `hook-own-file`, `package-structure`, `render-profiler`, `render-readability`, `scaling`

| # | PR | File | Tags |
| --- | --- | --- | --- |
| [G20](#g20--suite-nativetx-simulationpackagejson28) | [#27718](https://github.com/trezor/trezor-suite/pull/27718) | `package.json:28` | package-structure, evm-vs-common, extensibility |
| [G23](#g23--suite-nativemodule-earnsrccomponentsyieldpendingtransactionmodalconstantsts9) | [#27718](https://github.com/trezor/trezor-suite/pull/27718) | `YieldPendingTransactionModalConstants.ts:9` | folder-structure, conventions, scaling |
| [G28](#g28--suite-nativemodule-earnsrcscreensyielddepositreviewscreentsx162) | [#27718](https://github.com/trezor/trezor-suite/pull/27718) | `YieldDepositReviewScreen.tsx:162` | one-component-per-file |
| [G61](#g61--suite-nativemodule-transactionssrccomponentscancelevmtransactionbuttontsx46) | [#29622](https://github.com/trezor/trezor-suite/pull/29622) | `CancelEvmTransactionButton.tsx:46` | one-component-per-file |
| [G63](#g63--packagessuitesrcsupportsuitemaintsx39) | [#30154](https://github.com/trezor/trezor-suite/pull/30154) | `Main.tsx:39` | extract-component, render-profiler |
| [G55](#g55--suite-nativemodule-transactionssrcscreenstransactiondetailscreentsx134) | [#30255](https://github.com/trezor/trezor-suite/pull/30255) | `TransactionDetailScreen.tsx:134` | extract-component, early-return, render-readability |
| [G80](#g80--suite-nativemodule-accounts-managementsrccomponentsyourpositioncardtsx103) | [#30994](https://github.com/trezor/trezor-suite/pull/30994) | `YourPositionCard.tsx:103` | hook-own-file |

---

### G20 — `suite-native/tx-simulation/package.json:28`

- **PR** [#27718 — feat(suite-native): yield deposit](https://github.com/trezor/trezor-suite/pull/27718) · author `@BrantalikP` · merged
- **My first comment** 2026-05-22
- **Discussion thread** https://github.com/trezor/trezor-suite/pull/27718#discussion_r3287627901
- **Line of code** https://github.com/trezor/trezor-suite/blob/49849a8b2a17ae6deeb8424b91a233ea3d219618/suite-native/tx-simulation/package.json#L28
- **Thread** 2 comment(s), 2 mine
- **Status** resolved
- **Tags** `package-structure`, `evm-vs-common`, `extensibility`

<details>
<summary>Code under discussion (diff hunk)</summary>

```diff
@@ -0,0 +1,29 @@
+{
+    "name": "@suite-native/tx-simulation",
+    "version": "1.0.0",
+    "private": true,
+    "license": "See LICENSE.md in repo root",
+    "sideEffects": false,
+    "main": "src/index",
+    "scripts": {
+        "depcheck": "yarn g:depcheck",
+        "type-check": "yarn g:tsc --build",
+        "lint:js": "yarn g:eslint '**/*.{ts,tsx,js}'"
+    },
+    "dependencies": {
+        "@suite-common/formatters": "workspace:*",
+        "@suite-common/tx-simulation": "workspace:*",
+        "@suite-common/wallet-config": "workspace:*",
+        "@suite-common/wallet-types": "workspace:*",
+        "@suite-common/wallet-utils": "workspace:*",
+        "@suite-native/atoms": "workspace:*",
+        "@suite-native/clipboard": "workspace:*",
+        "@suite-native/icons": "workspace:*",
+        "@suite-native/intl": "workspace:*",
+        "@trezor/utils": "workspace:*",
+        "react": "19.2.4",
+        "react-native": "0.83.2",
+        "react-native-reanimated": "~4.2.1",
+        "web3-utils": "^4.3.3"
+    }
```

</details>

**Conversation**

**🟦 @cermakjiri (me)** · 2026-05-22

> Nice! 🎉

**🟦 @cermakjiri (me)** · 2026-05-22

> One thing though: could you please follow similar structure as in other tx-simulation packages so it's going to be easy to extend them in future for other non-evm networks too? E.g.:
> ```ts
> tx-simulation/src 
>    /common
>        /components
>        /hooks
>    /evm
>        /components   
>        /hooks
> ```
>
> Anyway it could be done in some follow up 🙏

---

### G23 — `suite-native/module-earn/src/components/YieldPendingTransactionModalConstants.ts:9`

- **PR** [#27718 — feat(suite-native): yield deposit](https://github.com/trezor/trezor-suite/pull/27718) · author `@BrantalikP` · merged
- **My first comment** 2026-05-26
- **Discussion thread** https://github.com/trezor/trezor-suite/pull/27718#discussion_r3302274382
- **Line of code** https://github.com/trezor/trezor-suite/blob/49849a8b2a17ae6deeb8424b91a233ea3d219618/suite-native/module-earn/src/components/YieldPendingTransactionModalConstants.ts#L9
- **Thread** 3 comment(s), 2 mine
- **Status** unresolved
- **Tags** `folder-structure`, `conventions`, `scaling`

<details>
<summary>Code under discussion (diff hunk)</summary>

```diff
@@ -0,0 +1,9 @@
+export const modalSnap = {
+    collapsedIndex: 0,
+    expandedIndex: 1,
+    collapsedHeight: 148,
+    expandedHeight: 592,
+    indexMidpoint: 0.5,
+    collapsedBackdropOpacity: 0,
+    expandedBackdropOpacity: 0.5,
+} as const;
```

</details>

**Conversation**

**🟦 @cermakjiri (me)** · 2026-05-26

> This is out of scope this PR, anyway I believe it'd be good to at least open up the discussion on the topic:
>
> I've just noticed that suite-native packages are following some really strict linear file structure. However, the issue with that it breaks implicit relationships between components apposed to tree-like file structure.
>
> Linear:
> ```
> some-pkg/src/
>     /components
>          SomeScreen.tsx
>          SomeFooter.tsx
>          SomeFooterButton.tsx
>          ...
>   /hooks
>         useSomeFooter.tsx
>         useSomeXYZ.tsx
>         ...
> ```
>
> Tree-like:
> ```
> some-pkg/src/
>     /components
>          /SomeScreen
>                   /hooks
>                        useSomeXYZ.tsx # hook for the `SomeScreen`.tsx
>                  /constants
>                  /{other-architectual-primitives}
>                  /SomeFooter
>                         /hooks
>                              useSomeFooter.tsx # hook only for the relevant   footer
>                         SomeFooterButton.tsx
>                   SomeScreen.tsx
> ```
>
> - The relationship between components is implicit by the structure. If something is shared across more of them, it can be just move respective level up. 
> - It scales: It can effectively decrease browsing complexity to O(logn) making much better for bigger file structure to orient to.

**@BrantalikP** · 2026-05-26

> This is my setup everywhere except at Trezor. Could not agree more.
>
> Although I would love to do it right away, I still do not think it is a good idea to introduce new patterns into an existing codebase when the current approach is followed by the majority.
>
> This should be decided by other devs as well. I tried to convince other mobile devs in the past, unfortunately without success.
>
> If you plan any initiative to introduce this pattern, I would be more than happy to support it.

**🟦 @cermakjiri (me)** · 2026-05-26

> Glad to hear that! 
>
> I kind of agree that it's better to have unified approaches across teams in the same codebase, however if I should always wait for everything to be accepted by our Suite Council, I'm afraid there'd be not much of progress. Maybe the borderline might be defined on team-level / package-level (something like that), when there's a need to introduce a new pattern / coding practice like this. 
>
> Anyway, thank you for your feedback on that. I hope we will make this work soon. 🚀

---

### G28 — `suite-native/module-earn/src/screens/YieldDepositReviewScreen.tsx:162`

- **PR** [#27718 — feat(suite-native): yield deposit](https://github.com/trezor/trezor-suite/pull/27718) · author `@BrantalikP` · merged
- **My first comment** 2026-05-26
- **Discussion thread** https://github.com/trezor/trezor-suite/pull/27718#discussion_r3302449312
- **Line of code** https://github.com/trezor/trezor-suite/blob/49849a8b2a17ae6deeb8424b91a233ea3d219618/suite-native/module-earn/src/screens/YieldDepositReviewScreen.tsx#L162
- **Thread** 3 comment(s), 2 mine
- **Status** resolved
- **Tags** `one-component-per-file`

<details>
<summary>Code under discussion (diff hunk)</summary>

```diff
@@ -0,0 +1,164 @@
+import { useEffect, useMemo } from 'react';
+import { useSelector } from 'react-redux';
+
+import { type RouteProp, useNavigation, useRoute } from '@react-navigation/native';
+
+import {
+    type StablecoinYieldRootState,
+    type YieldFlowResolvedData,
+    selectStablecoinYieldSessionByFlowKey,
+} from '@suite-common/wallet-core';
+import { type PrecomposedTransactionFinal } from '@suite-common/wallet-types';
+import { Text, VStack } from '@suite-native/atoms';
+import {
+    ConfirmOnTrezorWrapper,
+    useConfirmOnTrezorController,
+} from '@suite-native/confirm-on-trezor';
+import { Translation } from '@suite-native/intl';
+import {
+    ScreenHeader,
+    type StackNavigationProps,
+    type YieldStackParamList,
+    YieldStackRoutes,
+} from '@suite-native/navigation';
+
+import { EarnReviewSubmittedCard } from '../components/EarnReviewSubmittedCard';
+import { YieldReviewList } from '../components/YieldReviewList';
+import { useResolvedYieldFlowData } from '../hooks/useResolvedYieldFlowData';
+import { useYieldDepositReview } from '../hooks/useYieldDepositReview';
+import { buildYieldDepositFeePreview } from '../yieldDepositFeeUtils';
+
+type RouteProps = RouteProp<YieldStackParamList, YieldStackRoutes.YieldDepositReview>;
+type NavigationProps = StackNavigationProps<
+    YieldStackParamList,
+    YieldStackRoutes.YieldDepositReview
+>;
+
+type DepositReviewContentProps = {
+    feePreview: PrecomposedTransactionFinal;
+    flowData: YieldFlowResolvedData;
+    flowKey: string;
+    review: {
+        amount: string;
+        receiptAmount: string;
+    };
+    tokenSymbol: string;
+};
+
+const DepositReviewContent = ({
+    feePreview,
+    flowData,
+    flowKey,
+    review,
+    tokenSymbol,
+}: DepositReviewContentProps) => {
+    const { confirmOnTrezorRef, revealConfirmOnTrezorSheet, closeSheet } =
+        useConfirmOnTrezorController();
+    const {
+        handleSubmitDepositReview,
+        handleDepositSubmitted,
+        isSendingDeposit,
+        isSigningDeposit,
+        isSubmitDisabled,
+        isDepositSigned,
+    } = useYieldDepositReview({
+        flowData,
+        flowKey,
+    });
+
+    useEffect(() => {
+        if (isSigningDeposit) {
+            revealConfirmOnTrezorSheet();
+        } else {
+            closeSheet();
+        }
+    }, [closeSheet, isSigningDeposit, revealConfirmOnTrezorSheet]);
+
+    return (
+        <ConfirmOnTrezorWrapper
+            isManualControlEnabled
+            controlRef={confirmOnTrezorRef}
+            closeActionType="back"
+            defaultHeader={
+                <ScreenHeader
+                    closeActionType="back"
+                    customContent={
+                        <Text variant="body-md-strong">
+                            <Translation id="earn.yieldDepositReviewScreen.title" />
+                        </Text>
+                    }
+                />
+            }
+        >
+            <VStack flex={1} justifyContent="space-between">
+                <YieldReviewList
+                    accountKey={flowData.account.key}
+                    amount={review.amount}
+                    fee={feePreview.fee}
+                    isFooterVisible={!isSigningDeposit && !isDepositSigned}
+                    isSubmitDisabled={isSubmitDisabled}
+                    isSubmitLoading={isSigningDeposit}
+                    onSubmit={handleSubmitDepositReview}
+                    receiveAmount={review.receiptAmount}
+                    receiveTokenSymbol={flowData.receiptToken.symbol}
+                    tokenSymbol={tokenSymbol}
+                    variant="deposit"
+                />
+                {isDepositSigned && (
+                    <EarnReviewSubmittedCard
+                        buttonTranslationId="earn.yieldDepositReviewScreen.submitButton"
+                        isButtonLoading={isSendingDeposit}
+                        messageTranslationId="earn.yieldDepositReviewScreen.successMessage"
+                        onButtonPress={handleDepositSubmitted}
+                    />
+                )}
+            </VStack>
+        </ConfirmOnTrezorWrapper>
+    );
+};
+
+export const YieldDepositReviewScreen = () => {
+    const route = useRoute<RouteProps>();
+    const navigation = useNavigation<NavigationProps>();
+    const { flowData, flowKey, tokenSymbol, resolutionStatus } = useResolvedYieldFlowData(
+        route.params,
+    );
+    const session = useSelector((state: StablecoinYieldRootState) =>
+        selectStablecoinYieldSessionByFlowKey(state, 'deposit', flowKey),
+    );
+    const review = session?.action.review;
+    const feePreview = useMemo(
+        () => (review ? buildYieldDepositFeePreview(review.unsignedTransaction) : null),
+        [review],
+    );
+
+    useEffect(() => {
+        if (resolutionStatus !== 'resolved') {
+            return;
+        }
+
+        if (session?.step === 'complete') {
+            navigation.replace(YieldStackRoutes.YieldDepositComplete, route.params);
+
+            return;
+        }
+
+        if (!review || session?.step !== 'action') {
+            navigation.navigate(YieldStackRoutes.YieldDeposit, route.params);
+        }
+    }, [navigation, resolutionStatus, review, route.params, session?.step]);
+
+    if (resolutionStatus !== 'resolved' || !review || !feePreview) {
+        return null;
+    }
+
+    return (
+        <DepositReviewContent
+            feePreview={feePreview}
+            flowData={flowData}
+            flowKey={flowKey}
+            review={review}
+            tokenSymbol={tokenSymbol}
+        />
+    );
+};
```

</details>

**Conversation**

**🟦 @cermakjiri (me)** · 2026-05-26

> One component per file please to make it easily readable 🙏

**@BrantalikP** · 2026-05-26

> https://github.com/trezor/trezor-suite/pull/27718#discussion_r3298064343 answered here already. WDYT?

**🟦 @cermakjiri (me)** · 2026-05-26

> TBH I still think it'd be better to divide it (better readability, so less bugs; easier composibility; potential easier refactoring in the future) but I don't push it. Also, it might be subject of some follow-up.

---

### G61 — `suite-native/module-transactions/src/components/CancelEvmTransactionButton.tsx:46`

- **PR** [#29622 — feat(suite-native): evm cancel ](https://github.com/trezor/trezor-suite/pull/29622) · author `@53gur0` · open
- **My first comment** 2026-07-30
- **Discussion thread** https://github.com/trezor/trezor-suite/pull/29622#discussion_r3682393196
- **Line of code** https://github.com/trezor/trezor-suite/blob/d7908c9bf897b8ce10011e7f9c02e81bba3612b5/suite-native/module-transactions/src/components/CancelEvmTransactionButton.tsx#L46
- **Thread** 1 comment(s), 1 mine
- **Status** unresolved
- **Tags** `one-component-per-file`

<details>
<summary>Code under discussion (diff hunk)</summary>

```diff
@@ -0,0 +1,147 @@
+import { type AccountKey, type WalletAccountTransaction } from '@suite-common/wallet-types';
+import {
+    BottomSheetModal,
+    Box,
+    Button,
+    Text,
+    VStack,
+    useBottomSheetModal,
+} from '@suite-native/atoms';
+import { ConfirmOnTrezorAnimation } from '@suite-native/confirm-on-trezor';
+import { CryptoAmountFormatter, CryptoToFiatAmountFormatter } from '@suite-native/formatters';
+import { Translation, useTranslate } from '@suite-native/intl';
+
+import { TransactionDetailRow } from './TransactionDetailRow';
+import { useCancelEvmTransaction } from '../hooks/useCancelEvmTransaction';
+
+type CancelEvmTransactionButtonProps = {
+    accountKey: AccountKey;
+    transaction: WalletAccountTransaction;
+};
+
+type CancelTransactionFeeRowProps = {
+    title: string;
+    fee: string;
+    symbol: WalletAccountTransaction['symbol'];
+};
+
+const CancelTransactionFeeRow = ({ title, fee, symbol }: CancelTransactionFeeRowProps) => (
+    <TransactionDetailRow title={title}>
+        <Box alignItems="flex-end">
+            <CryptoAmountFormatter
+                value={fee}
+                symbol={symbol}
+                variant="body-sm"
+                color="contentPrimary"
+                isBalance={false}
+            />
+            <CryptoToFiatAmountFormatter
+                value={fee}
+                symbol={symbol}
+                variant="body-sm"
+                color="contentSecondary"
+            />
+        </Box>
+    </TransactionDetailRow>
+);
```

</details>

**Conversation**

**🟦 @cermakjiri (me)** · 2026-07-30

> Let's please have single react component per file (easier to find the component, easier to refactor the component, easier to read this file) 🙏

---

### G63 — `packages/suite/src/support/suite/Main.tsx:39`

- **PR** [#30154 — WIP: 28878 playwright perf tracking](https://github.com/trezor/trezor-suite/pull/30154) · author `@vojtatranta` · open
- **My first comment** 2026-08-03
- **Discussion thread** https://github.com/trezor/trezor-suite/pull/30154#discussion_r3702586003
- **Line of code** https://github.com/trezor/trezor-suite/blob/3dc9f6035d8c44fd7082e6f689cd3d03f2a9baef/packages/suite/src/support/suite/Main.tsx#L39 _(thread is outdated — line refers to the original diff, may have moved)_
- **Thread** 1 comment(s), 1 mine
- **Status** **⚠️ PENDING — review never submitted, draft visible only to you** · unresolved · outdated
- **Tags** `extract-component`, `render-profiler`

<details>
<summary>Code under discussion (diff hunk)</summary>

```diff
@@ -17,6 +18,25 @@ import { ResponsiveContextProvider } from 'src/support/suite/ResponsiveContext';
 import { RouterHandler } from './RouterHandler';
 import { useConnectPopupModals } from './useConnectPopupModals';
 
+// DefinePlugin constant, true only for the e2e perf build. Everywhere else it is `false`, so the
+// <Profiler> branch below and these helpers are dead-code-eliminated from production bundles.
+const PERF_PROFILER_BUILD = process.env.PERF_PROFILER as unknown as boolean;
+
+// The perf-e2e instrumentation exposes __trezorPerf__ before the app loads; onRender no-ops when the
+// global is absent.
+const getPerfController = () =>
+    typeof window !== 'undefined'
+        ? (
+              window as unknown as {
+                  __trezorPerf__?: { recordRender?: (actualDuration: number) => void };
+              }
+          ).__trezorPerf__
+        : undefined;
+
+const onPerfRender: ProfilerOnRenderCallback = (_id, _phase, actualDuration) => {
+    getPerfController()?.recordRender?.(actualDuration);
+};
+
```

</details>

**Conversation**

**🟦 @cermakjiri (me)** · 2026-08-03

> Let's move everything new here to `RenderProfiler` component

---

### G55 — `suite-native/module-transactions/src/screens/TransactionDetailScreen.tsx:134`

- **PR** [#30255 — feat(suite-native): label wrap/unwrap transactions](https://github.com/trezor/trezor-suite/pull/30255) · author `@53gur0` · merged
- **My first comment** 2026-07-30
- **Discussion thread** https://github.com/trezor/trezor-suite/pull/30255#discussion_r3682093502
- **Line of code** https://github.com/trezor/trezor-suite/blob/0c78e8b7cf19237b2c1f77c4c7d95378e9f29285/suite-native/module-transactions/src/screens/TransactionDetailScreen.tsx#L134 _(thread is outdated — line refers to the original diff, may have moved)_
- **Thread** 2 comment(s), 1 mine
- **Status** unresolved · outdated
- **Tags** `extract-component`, `early-return`, `render-readability`

<details>
<summary>Code under discussion (diff hunk)</summary>

```diff
@@ -84,43 +87,60 @@ export const TransactionDetailScreen = ({
 
     const allOutputs = account !== null ? createTargets({ transaction, account }) : [];
 
+    // WETH wrap/unwrap and unstake render their own amount-bearing title directly, bypassing the
+    // generic "<type> transaction" header template (which would append " transaction" to the label).
+    let transactionTitle: ReactNode;
+    if (isUnstakeTransaction) {
+        transactionTitle = (
+            <UnstakeTransactionDetailTitle
+                unstakeAmount={unstakeAmount}
+                symbol={transaction.symbol}
+                variant="body-md-strong"
+            />
+        );
+    } else if (wrapKind) {
+        transactionTitle = (
+            <WrapTransactionName
+                transaction={transaction}
+                kind={wrapKind}
+                variant="body-md-strong"
+            />
+        );
+    } else {
+        transactionTitle = (
+            <>
+                <TokenIcon
+                    symbol={transaction.symbol}
+                    contractAddress={tokenTransfer?.contract}
+                    showNetworkIcon
+                />
+                <Text variant="body-md-strong">
+                    <Translation
+                        id="transactions.detail.header"
+                        values={{
+                            transactionType: () => (
+                                <TransactionName
+                                    key={transaction.txid}
+                                    transaction={transaction}
+                                    isPending={isPending}
+                                    variant="body-md-strong"
+                                />
+                            ),
+                        }}
+                    />
+                </Text>
+            </>
+        );
+    }
```

</details>

**Conversation**

**🟦 @cermakjiri (me)** · 2026-07-30

> To maintain the render method readability, I'd suggest move this to new component and doing early returns

**@tomasklim** · 2026-08-03

> Extracted into a new `TransactionDetailTitle` component with early returns 👍

---

### G80 — `suite-native/module-accounts-management/src/components/YourPositionCard.tsx:103`

- **PR** [#30994 — Mobile - Asset Detail Screen Revamp](https://github.com/trezor/trezor-suite/pull/30994) · author `@TomasBoda` · merged
- **My first comment** 2026-08-10
- **Discussion thread** https://github.com/trezor/trezor-suite/pull/30994#discussion_r3749138330
- **Line of code** https://github.com/trezor/trezor-suite/blob/132bc2d7a32741a02b2270d1acff6ed8ed9dc22b/suite-native/module-accounts-management/src/components/YourPositionCard.tsx#L103 _(thread is outdated — line refers to the original diff, may have moved)_
- **Thread** 2 comment(s), 1 mine
- **Status** resolved · outdated
- **Tags** `hook-own-file`

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
+
+interface UseYourPositionCardYieldBadgeProps {
+    account?: Account | null;
+    token?: TokenInfoBranded | null;
+    symbol?: NetworkSymbol | null;
+}
+
+const useYourPositionCardYieldBadge = ({
+    account,
+    token,
+    symbol,
+}: UseYourPositionCardYieldBadgeProps) => {
+    const { data: yieldOpportunities } = useAllYieldOpportunities();
+
+    const nativeYieldVault = useNativeYieldVault({ account: account ?? undefined });
+
+    const { rate: stakingRate } = useStakingRate({
+        symbol: account?.symbol,
+        accountKey: account?.key,
+    });
+
+    const promoYieldBadge =
+        !token && nativeYieldVault?.bestVault
+            ? {
+                  apy:
+                      stakingRate !== null && isApyAvailable(stakingRate)
+                          ? Math.max(nativeYieldVault.bestVault.apy, stakingRate)
+                          : nativeYieldVault.bestVault.apy,
+                  vaultId: nativeYieldVault.bestVault.id,
+              }
+            : null;
+
+    const yieldBadge = useYieldBadge({
+        networkSymbol: symbol ?? undefined,
+        token: token ?? undefined,
+        accountTokens: account?.tokens,
+        type: token && isErc4626(token) ? 'defi' : 'default',
+        yieldOpportunities,
+    });
+
+    const usedYieldBadge = promoYieldBadge ?? yieldBadge;
+
+    const usedYieldBadgeVariant = (() => {
+        if (promoYieldBadge) return 'promo' as const;
+
+        return yieldBadge?.hasVaultPosition ? ('active' as const) : ('inactive' as const);
+    })();
+
+    return { yieldBadge: usedYieldBadge, yieldBadgeVariant: usedYieldBadgeVariant };
+};
```

</details>

**Conversation**

**🟦 @cermakjiri (me)** · 2026-08-10

> Let's put it to new file with the name of the hook. 🙏

**@TomasBoda** · 2026-08-10

> done

---
