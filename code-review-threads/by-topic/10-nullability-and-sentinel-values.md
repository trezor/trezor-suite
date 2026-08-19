# Nullability & sentinel values

Avoiding `''`/`0` sentinel fallbacks, preferring explicit `undefined`, and narrowing null/undefined upstream so components get asserted types.

**6 review-thread-group(s)** · [← back to index](../README.md)

Tags: `empty-string-sentinel` ×3, `component-props` ×2, `narrow-upstream` ×2, `suggestion` ×2, `api-design`, `balance-formatting`, `fallback-chain`, `question`

| # | PR | File | Tags |
| --- | --- | --- | --- |
| [G03](#g03--packagessuitesrccomponentsearnyieldhooksuseyieldflowts170) | [#27590](https://github.com/trezor/trezor-suite/pull/27590) | `useYieldFlow.ts:170` | empty-string-sentinel, api-design |
| [G77](#g77--suite-nativemodule-earnsrchooksuseyieldbadgetsx41) | [#30994](https://github.com/trezor/trezor-suite/pull/30994) | `useYieldBadge.tsx:41` | empty-string-sentinel, suggestion |
| [G78](#g78--suite-nativemodule-earnsrchooksuseyieldbadgetsx45) | [#30994](https://github.com/trezor/trezor-suite/pull/30994) | `useYieldBadge.tsx:45` | empty-string-sentinel, suggestion |
| [G81](#g81--suite-nativemodule-accounts-managementsrccomponentsyourpositioncardtsx113) | [#30994](https://github.com/trezor/trezor-suite/pull/30994) | `YourPositionCard.tsx:113` | narrow-upstream, component-props |
| [G82](#g82--suite-nativemodule-accounts-managementsrccomponentsyourpositioncardtsx122) | [#30994](https://github.com/trezor/trezor-suite/pull/30994) | `YourPositionCard.tsx:122` | narrow-upstream, component-props |
| [G84](#g84--suite-nativemodule-accounts-managementsrccomponentsyourpositioncardtsx52) | [#30994](https://github.com/trezor/trezor-suite/pull/30994) | `YourPositionCard.tsx:52` | fallback-chain, balance-formatting, question |

---

### G03 — `packages/suite/src/components/earn/yield/hooks/useYieldFlow.ts:170`

- **PR** [#27590 — Self-composed `withdraw` / `redeem` calldata for stablecoin yield](https://github.com/trezor/trezor-suite/pull/27590) · author `@matusbalascak` · merged
- **My first comment** 2026-05-12
- **Discussion thread** https://github.com/trezor/trezor-suite/pull/27590#discussion_r3224430555
- **Line of code** https://github.com/trezor/trezor-suite/blob/69f3aa4d239c4a14fb94986743a350a217bb50e3/packages/suite/src/components/earn/yield/hooks/useYieldFlow.ts#L170
- **Thread** 1 comment(s), 1 mine
- **Status** unresolved
- **Tags** `empty-string-sentinel`, `api-design`

<details>
<summary>Code under discussion (diff hunk)</summary>

```diff
@@ -139,7 +151,23 @@ export const useYieldFlow = ({
 
     const session = useSelector(state => selectStablecoinYieldSession(state, flowType, flowKey));
 
-    const maxAmount = flowType === 'deposit' ? (token?.balance ?? '') : suppliedAmount;
+    const withdrawInputUnit = methods.watch('withdrawInputUnit');
+    const isSharesInput = flowType === 'withdraw' && withdrawInputUnit === 'shares';
+    const canToggleWithdrawUnit = flowType === 'withdraw' && !!token && !!receiptToken;
+
+    const getWithdrawMaxAmount = () => {
+        if (isSharesInput) {
+            return suppliedSharesAmount;
+        }
+
+        return suppliedAmount;
+    };
+    const maxAmount = flowType === 'deposit' ? (token?.balance ?? '') : getWithdrawMaxAmount();
+
+    const inputTokenSymbol = isSharesInput ? (receiptToken?.symbol ?? '') : (token?.symbol ?? '');
+    const otherUnitTokenSymbol = isSharesInput
+        ? (token?.symbol ?? '')
+        : (receiptToken?.symbol ?? '');
```

</details>

**Conversation**

**🟦 @cermakjiri (me)** · 2026-05-12

> isn't better to pass undefined than empty strings so a react component could decide if it should display some placeholder for example?

---

### G77 — `suite-native/module-earn/src/hooks/useYieldBadge.tsx:41`

- **PR** [#30994 — Mobile - Asset Detail Screen Revamp](https://github.com/trezor/trezor-suite/pull/30994) · author `@TomasBoda` · merged
- **My first comment** 2026-08-10
- **Discussion thread** https://github.com/trezor/trezor-suite/pull/30994#discussion_r3749106530
- **Line of code** https://github.com/trezor/trezor-suite/blob/132bc2d7a32741a02b2270d1acff6ed8ed9dc22b/suite-native/module-earn/src/hooks/useYieldBadge.tsx#L41 _(thread is outdated — line refers to the original diff, may have moved)_
- **Thread** 2 comment(s), 1 mine
- **Status** resolved · outdated
- **Tags** `empty-string-sentinel`, `suggestion`

<details>
<summary>Code under discussion (diff hunk)</summary>

```diff
@@ -0,0 +1,102 @@
+import { useMemo } from 'react';
+import { useSelector } from 'react-redux';
+
+import { type YieldDtoV2 } from '@suite-common/earn-stablecoin-api';
+import { type MessageSystemRootState } from '@suite-common/message-system';
+import { type EnhancedTokenInfo } from '@suite-common/token-definitions';
+import { type NetworkSymbol } from '@suite-common/wallet-config';
+import {
+    getYieldVaultForOutputToken,
+    getYieldVaultsForInputToken,
+    hasYieldVaultPosition,
+} from '@suite-common/wallet-core';
+import { getApyPercent } from '@suite-common/wallet-utils';
+import { type TokenInfo } from '@trezor/blockchain-link-types';
+import { exhaustive } from '@trezor/type-utils';
+
+import { selectBestEnabledYieldVault } from '../selectors';
+
+interface YieldBadgeData {
+    apy: number;
+    vaultId: string;
+    hasVaultPosition: boolean;
+}
+
+interface UseYieldBadgeProps {
+    networkSymbol?: NetworkSymbol;
+    token?: EnhancedTokenInfo;
+    accountTokens: TokenInfo[] | undefined;
+    type: 'default' | 'defi';
+    yieldOpportunities?: YieldDtoV2[];
+}
+
+export const useYieldBadge = ({
+    networkSymbol,
+    token,
+    accountTokens,
+    type,
+    yieldOpportunities,
+}: UseYieldBadgeProps): YieldBadgeData | null => {
+    const matchedVaults = useMemo(() => {
+        if (!networkSymbol || !token) return [];
```

</details>

**Conversation**

**🟦 @cermakjiri (me)** · 2026-08-10

> Is there real use case with undefined token.symbol and setting `''` seems like way to potential bug / unnecessary checks down stream. Therefore:
> ```suggestion
>         if (!networkSymbol || !token || !token.symbol) return [];
> ```

**@TomasBoda** · 2026-08-10

> done

---

### G78 — `suite-native/module-earn/src/hooks/useYieldBadge.tsx:45`

- **PR** [#30994 — Mobile - Asset Detail Screen Revamp](https://github.com/trezor/trezor-suite/pull/30994) · author `@TomasBoda` · merged
- **My first comment** 2026-08-10
- **Discussion thread** https://github.com/trezor/trezor-suite/pull/30994#discussion_r3749107437
- **Line of code** https://github.com/trezor/trezor-suite/blob/132bc2d7a32741a02b2270d1acff6ed8ed9dc22b/suite-native/module-earn/src/hooks/useYieldBadge.tsx#L45 _(thread is outdated — line refers to the original diff, may have moved)_
- **Thread** 2 comment(s), 1 mine
- **Status** resolved · outdated
- **Tags** `empty-string-sentinel`, `suggestion`

<details>
<summary>Code under discussion (diff hunk)</summary>

```diff
@@ -0,0 +1,102 @@
+import { useMemo } from 'react';
+import { useSelector } from 'react-redux';
+
+import { type YieldDtoV2 } from '@suite-common/earn-stablecoin-api';
+import { type MessageSystemRootState } from '@suite-common/message-system';
+import { type EnhancedTokenInfo } from '@suite-common/token-definitions';
+import { type NetworkSymbol } from '@suite-common/wallet-config';
+import {
+    getYieldVaultForOutputToken,
+    getYieldVaultsForInputToken,
+    hasYieldVaultPosition,
+} from '@suite-common/wallet-core';
+import { getApyPercent } from '@suite-common/wallet-utils';
+import { type TokenInfo } from '@trezor/blockchain-link-types';
+import { exhaustive } from '@trezor/type-utils';
+
+import { selectBestEnabledYieldVault } from '../selectors';
+
+interface YieldBadgeData {
+    apy: number;
+    vaultId: string;
+    hasVaultPosition: boolean;
+}
+
+interface UseYieldBadgeProps {
+    networkSymbol?: NetworkSymbol;
+    token?: EnhancedTokenInfo;
+    accountTokens: TokenInfo[] | undefined;
+    type: 'default' | 'defi';
+    yieldOpportunities?: YieldDtoV2[];
+}
+
+export const useYieldBadge = ({
+    networkSymbol,
+    token,
+    accountTokens,
+    type,
+    yieldOpportunities,
+}: UseYieldBadgeProps): YieldBadgeData | null => {
+    const matchedVaults = useMemo(() => {
+        if (!networkSymbol || !token) return [];
+
+        const heldToken = {
+            address: token.contract,
+            symbol: token.symbol ?? '',
```

</details>

**Conversation**

**🟦 @cermakjiri (me)** · 2026-08-10

> ```suggestion
>             symbol: token.symbol,
> ```

**@TomasBoda** · 2026-08-10

> done

---

### G81 — `suite-native/module-accounts-management/src/components/YourPositionCard.tsx:113`

- **PR** [#30994 — Mobile - Asset Detail Screen Revamp](https://github.com/trezor/trezor-suite/pull/30994) · author `@TomasBoda` · merged
- **My first comment** 2026-08-10
- **Discussion thread** https://github.com/trezor/trezor-suite/pull/30994#discussion_r3749145328
- **Line of code** https://github.com/trezor/trezor-suite/blob/132bc2d7a32741a02b2270d1acff6ed8ed9dc22b/suite-native/module-accounts-management/src/components/YourPositionCard.tsx#L113 _(thread is outdated — line refers to the original diff, may have moved)_
- **Thread** 2 comment(s), 1 mine
- **Status** resolved · outdated
- **Tags** `narrow-upstream`, `component-props`

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
+
+interface YourPositionCardProps {
+    accountKey: AccountKey;
+    tokenContract?: TokenAddress;
+}
+
+export const YourPositionCard = ({ accountKey, tokenContract }: YourPositionCardProps) => {
+    const { applyStyle } = useNativeStyles();
+
+    const account = useSelector((state: AccountsRootState) =>
```

</details>

**Conversation**

**🟦 @cermakjiri (me)** · 2026-08-10

> This selection should be done outside this component so the types here can assert only `account` and doesn't have to always check for undefined/null cases 🙏

**@TomasBoda** · 2026-08-10

> done, also for `token`

---

### G82 — `suite-native/module-accounts-management/src/components/YourPositionCard.tsx:122`

- **PR** [#30994 — Mobile - Asset Detail Screen Revamp](https://github.com/trezor/trezor-suite/pull/30994) · author `@TomasBoda` · merged
- **My first comment** 2026-08-10
- **Discussion thread** https://github.com/trezor/trezor-suite/pull/30994#discussion_r3749150115
- **Line of code** https://github.com/trezor/trezor-suite/blob/132bc2d7a32741a02b2270d1acff6ed8ed9dc22b/suite-native/module-accounts-management/src/components/YourPositionCard.tsx#L122 _(thread is outdated — line refers to the original diff, may have moved)_
- **Thread** 2 comment(s), 1 mine
- **Status** resolved · outdated
- **Tags** `narrow-upstream`, `component-props`

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
+
+interface YourPositionCardProps {
+    accountKey: AccountKey;
+    tokenContract?: TokenAddress;
+}
+
+export const YourPositionCard = ({ accountKey, tokenContract }: YourPositionCardProps) => {
+    const { applyStyle } = useNativeStyles();
+
+    const account = useSelector((state: AccountsRootState) =>
+        selectAccountByKey(state, accountKey),
+    );
+
+    const symbol = useSelector((state: AccountsRootState) =>
+        selectAccountNetworkSymbol(state, accountKey),
+    );
+    const token = useSelector((state: TokensRootState) =>
+        selectAccountTokenInfo(state, accountKey, tokenContract),
+    );
```

</details>

**Conversation**

**🟦 @cermakjiri (me)** · 2026-08-10

> Might be the case for `symbol` and `token` too 🙏 
> https://github.com/trezor/trezor-suite/pull/30994/changes#r3749145328

**@TomasBoda** · 2026-08-10

> done

---

### G84 — `suite-native/module-accounts-management/src/components/YourPositionCard.tsx:52`

- **PR** [#30994 — Mobile - Asset Detail Screen Revamp](https://github.com/trezor/trezor-suite/pull/30994) · author `@TomasBoda` · merged
- **My first comment** 2026-08-10
- **Discussion thread** https://github.com/trezor/trezor-suite/pull/30994#discussion_r3749218834
- **Line of code** https://github.com/trezor/trezor-suite/blob/132bc2d7a32741a02b2270d1acff6ed8ed9dc22b/suite-native/module-accounts-management/src/components/YourPositionCard.tsx#L52
- **Thread** 2 comment(s), 1 mine
- **Status** resolved
- **Tags** `fallback-chain`, `balance-formatting`, `question`

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
+
+interface YourPositionCardProps {
+    accountKey: AccountKey;
+    tokenContract?: TokenAddress;
+}
+
+export const YourPositionCard = ({ accountKey, tokenContract }: YourPositionCardProps) => {
+    const { applyStyle } = useNativeStyles();
+
+    const account = useSelector((state: AccountsRootState) =>
+        selectAccountByKey(state, accountKey),
+    );
+
+    const symbol = useSelector((state: AccountsRootState) =>
+        selectAccountNetworkSymbol(state, accountKey),
+    );
+    const token = useSelector((state: TokensRootState) =>
+        selectAccountTokenInfo(state, accountKey, tokenContract),
+    );
+
+    const { yieldBadge, yieldBadgeVariant } = useYourPositionCardYieldBadge({
+        account,
+        token,
+        symbol,
+    });
+
+    if (!symbol) return null;
+
+    const tokenSymbol = token?.symbol ?? getDisplaySymbol(symbol);
+    const tokenName = token?.name ?? getNetworkDisplaySymbolName(symbol);
+    const balance = token?.balance ?? account?.formattedBalance ?? '0';
```

</details>

**Conversation**

**🟦 @cermakjiri (me)** · 2026-08-10

> are we sure it can handle `formattedBalance` balance too?

**@TomasBoda** · 2026-08-10

> yes, it works. also on other places in the repo

---
