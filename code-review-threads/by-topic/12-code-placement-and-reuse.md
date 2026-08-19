# Code placement, package boundaries & reuse

Moving shared logic to `suite-common` so `suite-native` can reuse it, avoiding circular deps via nested exports, and where selectors/abstractions belong.

**6 review-thread-group(s)** · [← back to index](../README.md)

Tags: `api-design`, `barrel-exports`, `circular-deps`, `consistency`, `debug-settings`, `duplication`, `encapsulation`, `hook-extraction`, `http-client`, `native-reuse`, `package-boundaries`, `selector-placement`, `suite-common`, `type-declaration-size`, `wallet-core`

| # | PR | File | Tags |
| --- | --- | --- | --- |
| [G16](#g16--packagessuitesrcactionswalletstablecoin-yieldclaimmerklerewardsthunkts7) | [#27718](https://github.com/trezor/trezor-suite/pull/27718) | `claimMerkleRewardsThunk.ts:7` | circular-deps, barrel-exports, encapsulation |
| [G19](#g19--suite-commonwallet-coresrcindexts65) | [#27718](https://github.com/trezor/trezor-suite/pull/27718) | `index.ts:65` | package-boundaries, wallet-core |
| [G27](#g27--suite-nativemodule-earnsrchooksuseyieldpendingtransactiontrackingts40) | [#27718](https://github.com/trezor/trezor-suite/pull/27718) | `useYieldPendingTransactionTracking.ts:40` | duplication, suite-common |
| [G31](#g31--packagessuitesrccomponentsearnmodalsearninanutshelltronstakeinanutshellmodaltsx28) | [#28374](https://github.com/trezor/trezor-suite/pull/28374) | `TronStakeInANutshellModal.tsx:28` | native-reuse, hook-extraction |
| [G33](#g33--suitesettingssrcsettingsselectorsts30) | [#28761](https://github.com/trezor/trezor-suite/pull/28761) | `settingsSelectors.ts:30` | selector-placement, consistency, debug-settings |
| [G54](#g54--suite-commonearn-stablecoin-apisrcservicesyieldxyzts50) | [#29947](https://github.com/trezor/trezor-suite/pull/29947) | `yieldxyz.ts:50` | http-client, type-declaration-size, api-design |

---

### G16 — `packages/suite/src/actions/wallet/stablecoin-yield/claimMerkleRewardsThunk.ts:7`

- **PR** [#27718 — feat(suite-native): yield deposit](https://github.com/trezor/trezor-suite/pull/27718) · author `@BrantalikP` · merged
- **My first comment** 2026-05-22
- **Discussion thread** https://github.com/trezor/trezor-suite/pull/27718#discussion_r3287392749
- **Line of code** https://github.com/trezor/trezor-suite/blob/49849a8b2a17ae6deeb8424b91a233ea3d219618/packages/suite/src/actions/wallet/stablecoin-yield/claimMerkleRewardsThunk.ts#L7 _(thread is outdated — line refers to the original diff, may have moved)_
- **Thread** 3 comment(s), 2 mine
- **Status** resolved · outdated
- **Tags** `circular-deps`, `barrel-exports`, `encapsulation`

<details>
<summary>Code under discussion (diff hunk)</summary>

```diff
@@ -4,7 +4,7 @@ import { asTypedDesktopAnalytics, events } from '@suite/analytics';
 import { closeModal, openDeferredModal, preserveModal } from '@suite/modal';
 import { Calldata, asEvmAddress } from '@suite-common/calldata';
 import { selectSelectedDevice } from '@suite-common/device';
-import { type StablecoinYieldTxSimulationParams } from '@suite-common/earn-stablecoin/src/tx-simulation';
```

</details>

**Conversation**

**🟦 @cermakjiri (me)** · 2026-05-22

> This was intentional because putting all exports into single file leads to cir. dep. Nested exports effectively mitigate that. At the same time some encapsulation is good (at section/category level) so the package can expose only certain components. 
>
> I know, it was only discussed here https://satoshilabs.slack.com/archives/G019WLX2P7B/p1776270754685949 but could be please stay by this? I think we are all quite happy that there're finally no (ecma-script module) cir. dep. 😀

**@BrantalikP** · 2026-05-25

> I had eslint issue on mobile, adding it to localRules helped. Thanks! https://github.com/trezor/trezor-suite/pull/27718/changes/d374bb0dfeb989927db160d282ed1435f0963770

**🟦 @cermakjiri (me)** · 2026-05-26

> Awesome 🙌

---

### G19 — `suite-common/wallet-core/src/index.ts:65`

- **PR** [#27718 — feat(suite-native): yield deposit](https://github.com/trezor/trezor-suite/pull/27718) · author `@BrantalikP` · merged
- **My first comment** 2026-05-22
- **Discussion thread** https://github.com/trezor/trezor-suite/pull/27718#discussion_r3287618775
- **Line of code** https://github.com/trezor/trezor-suite/blob/49849a8b2a17ae6deeb8424b91a233ea3d219618/suite-common/wallet-core/src/index.ts#L65
- **Thread** 2 comment(s), 1 mine
- **Status** resolved
- **Tags** `package-boundaries`, `wallet-core`

<details>
<summary>Code under discussion (diff hunk)</summary>

```diff
@@ -62,6 +62,7 @@ export * from './stake/stakeThunks';
 export * from './stablecoin-yield/stablecoinYieldReducer';
 export * from './stablecoin-yield/stablecoinYieldSelectors';
 export * from './stablecoin-yield/stablecoinYieldApprovalThunks';
+export * from './stablecoin-yield/stablecoinYieldDepositThunks';
```

</details>

**Conversation**

**🟦 @cermakjiri (me)** · 2026-05-22

> Disclaimer: I know it was already here so just genuinely asking 😃 could it be moved in theory to `@suite-common/earn-stablecoin`? Because I don't see dependency on the wallet-core what so ever.

**@BrantalikP** · 2026-05-25

> agree, let's conduct it in separate PR please.

---

### G27 — `suite-native/module-earn/src/hooks/useYieldPendingTransactionTracking.ts:40`

- **PR** [#27718 — feat(suite-native): yield deposit](https://github.com/trezor/trezor-suite/pull/27718) · author `@BrantalikP` · merged
- **My first comment** 2026-05-26
- **Discussion thread** https://github.com/trezor/trezor-suite/pull/27718#discussion_r3302426845
- **Line of code** https://github.com/trezor/trezor-suite/blob/49849a8b2a17ae6deeb8424b91a233ea3d219618/suite-native/module-earn/src/hooks/useYieldPendingTransactionTracking.ts#L40
- **Thread** 2 comment(s), 1 mine
- **Status** resolved
- **Tags** `duplication`, `suite-common`

<details>
<summary>Code under discussion (diff hunk)</summary>

```diff
@@ -0,0 +1,140 @@
+import { useEffect } from 'react';
+import { useDispatch, useSelector } from 'react-redux';
+
+import {
+    type AccountsRootState,
+    type FeesRootState,
+    type TransactionsRootState,
+    type YieldFlowType,
+    type YieldPendingTransactionState,
+    fetchAndUpdateAccountThunk,
+    selectConvertedNetworkFeeInfo,
+    selectTransactionByAccountKeyAndTxid,
+    stablecoinYieldActions,
+} from '@suite-common/wallet-core';
+import { type Account } from '@suite-common/wallet-types';
+import { isPending } from '@suite-common/wallet-utils';
+
+const DEFAULT_PENDING_TX_POLL_INTERVAL_MS = 3_000;
+const MIN_PENDING_TX_POLL_INTERVAL_MS = 2_000;
+const BLOCK_TIME_TO_POLL_INTERVAL_RATIO = 2;
+
+type YieldPendingTrackingRootState = TransactionsRootState & AccountsRootState & FeesRootState;
+
+type UseYieldPendingTransactionTrackingParams = {
+    account: Account | null;
+    flowKey: string | null;
+    flowType: YieldFlowType;
+    isScreenFocused?: boolean;
+    onApprovalConfirmed?: () => void;
+    pendingTransaction: YieldPendingTransactionState | undefined;
+};
+
+const getPollIntervalMs = (blockTime: number | undefined): number => {
+    if (!blockTime) return DEFAULT_PENDING_TX_POLL_INTERVAL_MS;
+
+    return Math.max(
+        (blockTime / BLOCK_TIME_TO_POLL_INTERVAL_RATIO) * 1000,
+        MIN_PENDING_TX_POLL_INTERVAL_MS,
+    );
+};
```

</details>

**Conversation**

**🟦 @cermakjiri (me)** · 2026-05-26

> It looks like the same fn as in `@trezor/suite`, what about putting it to suite-common?

**@BrantalikP** · 2026-05-26

> I think I tried, but there is some platform specific code that made it harder to do or make it more complicated that it should if we do it, let me revalidate it. 💪

---

### G31 — `packages/suite/src/components/earn/modals/EarnInANutshell/TronStakeInANutshellModal.tsx:28`

- **PR** [#28374 — feat(suite): add Tron staking page basics](https://github.com/trezor/trezor-suite/pull/28374) · author `@matusbalascak` · merged
- **My first comment** 2026-06-05
- **Discussion thread** https://github.com/trezor/trezor-suite/pull/28374#discussion_r3361541527
- **Line of code** https://github.com/trezor/trezor-suite/blob/f7cf6d5d9aa4c0fb2b3faa9ae762736b06bb160a/packages/suite/src/components/earn/modals/EarnInANutshell/TronStakeInANutshellModal.tsx#L28
- **Thread** 2 comment(s), 1 mine
- **Status** unresolved
- **Tags** `native-reuse`, `hook-extraction`

<details>
<summary>Code under discussion (diff hunk)</summary>

```diff
@@ -0,0 +1,116 @@
+import { Translation } from '@suite/intl';
+import { useTronStakingStats } from '@suite-common/earn-staking-api';
+import { type EarnModalAction } from '@suite-common/suite-types/src/staking';
+import { BulletList, Divider } from '@trezor/components';
+
+import { formatApyValue } from 'src/components/earn/utils/earnApyUtils';
+
+import { EarnInANutshellHighlights } from './components/EarnInANutshellHighlights';
+import { EarnInANutshellModalLayout } from './components/EarnInANutshellModalLayout';
+import {
+    type EarnInANutshellProcess,
+    EarnInANutshellProcesses,
+} from './components/EarnInANutshellProcesses';
+import { EarnInfoRow } from './components/EarnInfoRow';
+
+const TRON_UNSTAKING_PERIOD_DAYS = 14;
+
+interface TronStakeInANutshellModalProps {
+    onCancel: () => void;
+    actionType?: EarnModalAction;
+}
+
+export const TronStakeInANutshellModal = ({
+    onCancel,
+    actionType = 'close',
+}: TronStakeInANutshellModalProps) => {
+    const { data } = useTronStakingStats();
+    const apy = data?.length ? Math.max(...data.map(({ apr }) => apr)) : null;
```

</details>

**Conversation**

**🟦 @cermakjiri (me)** · 2026-06-05

> What about putting this `maxApy` to `useTronStakingStats` so suite-native can re-use it?

**@matusbalascak** · 2026-06-05

> Good point, I'll implement it in the following PRs

---

### G33 — `suite/settings/src/settingsSelectors.ts:30`

- **PR** [#28761 — refactor(suite): extract shared debug utilities](https://github.com/trezor/trezor-suite/pull/28761) · author `@OriginalEveres` · merged
- **My first comment** 2026-06-16
- **Discussion thread** https://github.com/trezor/trezor-suite/pull/28761#discussion_r3418674994
- **Line of code** https://github.com/trezor/trezor-suite/blob/ab30c91089162d17697092aa39e8ef7810ae3181/suite/settings/src/settingsSelectors.ts#L29-L30 _(thread is outdated — line refers to the original diff, may have moved)_
- **Thread** 2 comment(s), 1 mine
- **Status** unresolved · outdated
- **Tags** `selector-placement`, `consistency`, `debug-settings`

<details>
<summary>Code under discussion (diff hunk)</summary>

```diff
@@ -16,20 +14,6 @@ export const selectTorOnionLinks = (state: SuiteSettingsRootState) =>
     state.suiteSettings.torOnionLinks;
 export const selectIsCoinjoinReceiveWarningHidden = (state: SuiteSettingsRootState) =>
     state.suiteSettings.isCoinjoinReceiveWarningHidden;
-export const selectIsDebugModeActive = (state: SuiteSettingsRootState) =>
-    state.suiteSettings.debug.showDebugMenu;
-export const selectIsUnlockedBootloaderAllowed = (state: SuiteSettingsRootState) =>
-    state.suiteSettings.debug.isUnlockedBootloaderAllowed;
-export const selectDebugTransports = (state: SuiteSettingsRootState) =>
-    state.suiteSettings.debug.transports;
-export const selectShowConnectLogs = (state: SuiteSettingsRootState) =>
-    state.suiteSettings.debug.showConnectLogs;
-export const selectInvityServerEnvironment = (state: SuiteSettingsRootState) =>
-    state.suiteSettings.debug.invityServerEnvironment;
-export const selectEarnYieldWorkerBaseUrl = (state: SuiteSettingsRootState) =>
-    state.suiteSettings.debug.earnYieldWorkerBaseUrl ?? defaultEarnYieldWorkerBaseUrl;
```

</details>

**Conversation**

**@OriginalEveres** · 2026-06-15

> @tomasklim is this really a good place for this? I would maybe put it into the earn package instead of debug, it seems that its correctly placed in `suite-native` like that.
>
> WDYT?

**🟦 @cermakjiri (me)** · 2026-06-16

> But then, shouldn't be done same for other debug options too?

---

### G54 — `suite-common/earn-stablecoin-api/src/services/yieldxyz.ts:50`

- **PR** [#29947 — fix(earn): reduce Yield.xyz declaration size](https://github.com/trezor/trezor-suite/pull/29947) · author `@peter-sanderson` · merged
- **My first comment** 2026-07-23
- **Discussion thread** https://github.com/trezor/trezor-suite/pull/29947#discussion_r3636383687
- **Line of code** https://github.com/trezor/trezor-suite/blob/8001e4e43467feddfd58ee9cd047b29fae2e051f/suite-common/earn-stablecoin-api/src/services/yieldxyz.ts#L50
- **Thread** 2 comment(s), 1 mine
- **Status** unresolved
- **Tags** `http-client`, `type-declaration-size`, `api-design`

<details>
<summary>Code under discussion (diff hunk)</summary>

```diff
@@ -13,12 +21,30 @@ export const yieldXyzApi = createHttpClient({
     headers: { 'X-Suite-Version': getSuiteVersion() },
 });
 
-export const getYields = yieldXyzApi('/yields', {
-    method: 'GET',
-    schema: YieldsResponseV2,
-});
+type YieldXyzRequestOptions = {
+    signal?: AbortSignal;
+};
 
-export const getYield = yieldXyzApi('/yields/:vaultId', {
-    method: 'GET',
-    schema: YieldResponseV2,
-});
+type GetYieldsOptions = YieldXyzRequestOptions & {
+    params?: z.input<typeof GetYieldsV2QueryParams>;
+};
+
+type GetYieldOptions = YieldXyzRequestOptions & {
+    routeParams: { vaultId: string };
+};
+
+/** Prevents declaration emit from expanding the inferred Yield.xyz list schema. */
+export const getYields: (options?: GetYieldsOptions) => Promise<YieldsResponseV2Output> =
+    yieldXyzApi('/yields', {
+        method: 'GET',
+        schema: YieldsResponseV2,
+    });
+
+/** Prevents declaration emit from expanding the inferred Yield.xyz detail schema. */
+export const getYield: (options: GetYieldOptions) => Promise<YieldResponseV2Output> = yieldXyzApi(
+    '/yields/:vaultId',
+    {
+        method: 'GET',
+        schema: YieldResponseV2,
+    },
+);
```

</details>

**Conversation**

**🟦 @cermakjiri (me)** · 2026-07-23

> I can see the type decl. size improvement. However, it seems, we are going to need doing this for each service / endpoint. What about rather improving the `createHttpClient` itself?
>
> I've drafted it as kind of a `0.0.1` version to iterate it later on as we gather more usage experience, thus it's easier to design a better interface for it. I can think of extending it with schemas for search params / URL params (e.g. `/users/:userId`), request body. 
>
> Do you have some design interface idea for reducing the type decl. size?

**@peter-sanderson** · 2026-07-23

> I yolo drafted the protoype here: https://github.com/trezor/trezor-suite/pull/30220

---
