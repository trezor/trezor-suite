# Error handling & developer experience

Unhandled thunk rejections crashing components, validation that returns `null` instead of throwing, silently skipping instead of failing loudly.

**4 review-thread-group(s)** · [← back to index](../README.md)

Tags: `breaking-change`, `component-crash`, `debug-flag`, `devx`, `e2e`, `fail-loudly`, `logging`, `observability`, `skip-vs-throw`, `throw-vs-null`, `unhandled-rejection`, `use-mutation`

| # | PR | File | Tags |
| --- | --- | --- | --- |
| [G18](#g18--suite-commonearn-stablecoinsrcsigningstablecoinyieldsigningutilsts220) | [#27718](https://github.com/trezor/trezor-suite/pull/27718) | `stablecoinYieldSigningUtils.ts:220` | throw-vs-null, breaking-change, devx |
| [G11](#g11--packagessuitesrccomponentssuitemodalsreduxmodaltransactionreviewmodaltransactionreviewmodaltsx74) | [#27725](https://github.com/trezor/trezor-suite/pull/27725) | `TransactionReviewModal.tsx:74` | unhandled-rejection, component-crash, use-mutation |
| [G64](#g64--suitee2eperformanceperfmeasurets53) | [#30154](https://github.com/trezor/trezor-suite/pull/30154) | `perfMeasure.ts:53` | fail-loudly, skip-vs-throw, e2e |
| [G65](#g65--packagesperf-e2esrcinstrumentationts69) | [#30154](https://github.com/trezor/trezor-suite/pull/30154) | `instrumentation.ts:69` | logging, debug-flag, observability |

---

### G18 — `suite-common/earn-stablecoin/src/signing/stablecoinYieldSigningUtils.ts:220`

- **PR** [#27718 — feat(suite-native): yield deposit](https://github.com/trezor/trezor-suite/pull/27718) · author `@BrantalikP` · merged
- **My first comment** 2026-05-22
- **Discussion thread** https://github.com/trezor/trezor-suite/pull/27718#discussion_r3287452170
- **Line of code** https://github.com/trezor/trezor-suite/blob/49849a8b2a17ae6deeb8424b91a233ea3d219618/suite-common/earn-stablecoin/src/signing/stablecoinYieldSigningUtils.ts#L220
- **Thread** 2 comment(s), 1 mine
- **Status** resolved
- **Tags** `throw-vs-null`, `breaking-change`, `devx`

<details>
<summary>Code under discussion (diff hunk)</summary>

```diff
@@ -0,0 +1,221 @@
+import { parseUnsignedEvmTransactionForSigning } from '@suite-common/earn-stablecoin-api';
+import { flattenEvmFees, parseEvmFeeHex } from '@suite-common/schemas/src/evm';
+import { type NetworkSymbol } from '@suite-common/wallet-config';
+import {
+    type EvmSelectedFee,
+    type FormState,
+    type PrecomposedTransactionFinal,
+    type YieldFormMetadata,
+} from '@suite-common/wallet-types';
+import {
+    asAmountUnit,
+    evmHexToBigNumber,
+    evmHexWeiToGwei,
+    getContractAddressForNetworkSymbol,
+    unitsToSubunits,
+} from '@suite-common/wallet-utils';
+import { type EthereumSignTransaction, type TokenInfo } from '@trezor/connect-common';
+import { BigNumber } from '@trezor/utils';
+
+export type StablecoinYieldParsedTransactionForSigning = NonNullable<
+    ReturnType<typeof parseUnsignedEvmTransactionForSigning>
+>;
+
+type BuildStablecoinYieldReviewTokenParams = {
+    token: {
+        contractAddress?: string | null;
+        decimals: number;
+        symbol: string;
+    };
+    symbol: NetworkSymbol;
+};
+
+type BuildStablecoinYieldReviewStateParams = BuildStablecoinYieldReviewTokenParams & {
+    amount: string;
+    flowType: YieldFormMetadata['type'];
+    tx: StablecoinYieldParsedTransactionForSigning;
+    vaultName: string;
+};
+
+type BuildStablecoinYieldReviewStateResult = {
+    formState: FormState;
+    precomposedTransaction: PrecomposedTransactionFinal;
+};
+
+type BuildStablecoinYieldTransactionReviewParams = Omit<
+    BuildStablecoinYieldReviewStateParams,
+    'tx'
+> & {
+    selectedFee?: EvmSelectedFee | null;
+    unsignedTransaction: string;
+};
+
+type BuildStablecoinYieldTransactionReviewResult = BuildStablecoinYieldReviewStateResult & {
+    transactionForSigning: EthereumSignTransaction['transaction'];
+};
+
+const getStablecoinYieldTransactionWithSelectedFee = (
+    parsedTransaction: StablecoinYieldParsedTransactionForSigning,
+    selectedFee?: EvmSelectedFee | null,
+): StablecoinYieldParsedTransactionForSigning | null => {
+    if (!selectedFee) {
+        return parsedTransaction;
+    }
+
+    const parsedSelectedFee = parseEvmFeeHex(selectedFee);
+
+    if (!parsedSelectedFee) {
+        return null;
+    }
+
+    return {
+        ...parsedTransaction,
+        ...flattenEvmFees(parsedSelectedFee),
+    };
+};
+
+export const getStablecoinYieldTransactionForSigning = (
+    parsedTransaction: StablecoinYieldParsedTransactionForSigning,
+): EthereumSignTransaction['transaction'] => {
+    const commonTransactionFields = {
+        to: parsedTransaction.to,
+        value: parsedTransaction.value ?? '0x0',
+        gasLimit: parsedTransaction.gasLimit,
+        nonce: parsedTransaction.nonce,
+        data: parsedTransaction.data,
+        chainId: parsedTransaction.chainId,
+    };
+
+    if (parsedTransaction.maxFeePerGas && parsedTransaction.maxPriorityFeePerGas) {
+        return {
+            ...commonTransactionFields,
+            maxFeePerGas: parsedTransaction.maxFeePerGas,
+            maxPriorityFeePerGas: parsedTransaction.maxPriorityFeePerGas,
+        };
+    }
+
+    if (parsedTransaction.gasPrice) {
+        return {
+            ...commonTransactionFields,
+            gasPrice: parsedTransaction.gasPrice,
+            txType: parsedTransaction.type,
+        };
+    }
+
+    throw new Error('Yield transaction gas parameters are missing.');
+};
+
+const buildStablecoinYieldReviewToken = ({
+    token,
+    symbol,
+}: BuildStablecoinYieldReviewTokenParams): TokenInfo | undefined => {
+    if (!token.contractAddress) {
+        return undefined;
+    }
+
+    return {
+        standard: 'ERC20',
+        contract: getContractAddressForNetworkSymbol(symbol, token.contractAddress),
+        symbol: token.symbol,
+        decimals: token.decimals,
+        name: token.symbol,
+    };
+};
+
+export const buildStablecoinYieldReviewState = ({
+    tx,
+    amount,
+    token,
+    symbol,
+    flowType,
+    vaultName,
+}: BuildStablecoinYieldReviewStateParams): BuildStablecoinYieldReviewStateResult => {
+    const gasPriceHex = tx.maxFeePerGas ?? tx.gasPrice ?? ('0x0' as `0x${string}`);
+    const gasLimit = evmHexToBigNumber(tx.gasLimit);
+    const gasPrice = evmHexToBigNumber(gasPriceHex);
+    const feePerUnit = evmHexWeiToGwei(gasPriceHex);
+    const fee = gasLimit.multipliedBy(gasPrice);
+    const reviewToken = buildStablecoinYieldReviewToken({ token, symbol });
+    const amountSubunits = unitsToSubunits({
+        value: asAmountUnit(new BigNumber(amount)),
+        decimals: token.decimals,
+    });
+
+    const eip1559ReviewFields: Partial<
+        Pick<PrecomposedTransactionFinal, 'maxFeePerGas' | 'maxPriorityFeePerGas'>
+    > =
+        tx.maxFeePerGas && tx.maxPriorityFeePerGas
+            ? {
+                  maxFeePerGas: evmHexWeiToGwei(tx.maxFeePerGas),
+                  maxPriorityFeePerGas: evmHexWeiToGwei(tx.maxPriorityFeePerGas),
+              }
+            : {};
+
+    const formState: FormState = {
+        outputs: [
+            {
+                type: 'payment',
+                address: tx.to,
+                amount,
+                fiat: '',
+                currency: { value: '', label: '' },
+                token: reviewToken?.contract ?? null,
+                dataHex: tx.data,
+            },
+        ],
+        selectedFee: 'custom',
+        feePerUnit,
+        feeLimit: gasLimit.toFixed(0),
+        ...eip1559ReviewFields,
+        options: ['broadcast', 'transactionData'],
+        transactionData: tx.data,
+        isCoinControlEnabled: false,
+        hasCoinControlBeenOpened: false,
+        selectedUtxos: [],
+        yieldMetadata: { type: flowType, vaultName },
+    };
+
+    const precomposedTransaction: PrecomposedTransactionFinal = {
+        type: 'final',
+        fee: fee.toFixed(0),
+        feePerByte: feePerUnit,
+        feeLimit: gasLimit.toFixed(0),
+        totalSpent: reviewToken ? amountSubunits.toFixed(0) : amountSubunits.plus(fee).toFixed(0),
+        bytes: 0,
+        inputs: [],
+        outputs: [
+            {
+                address: tx.to,
+                amount: amountSubunits.toFixed(0),
+            },
+        ],
+        outputsPermutation: [0],
+        ...(reviewToken ? { token: reviewToken, isTokenKnown: true } : {}),
+        ...eip1559ReviewFields,
+    };
+
+    return { formState, precomposedTransaction };
+};
+
+export const buildStablecoinYieldTransactionReview = ({
+    unsignedTransaction,
+    selectedFee,
+    ...reviewStateParams
+}: BuildStablecoinYieldTransactionReviewParams): BuildStablecoinYieldTransactionReviewResult | null => {
+    const parsedTransaction = parseUnsignedEvmTransactionForSigning(unsignedTransaction);
+
+    if (!parsedTransaction) {
+        return null;
+    }
+
+    const tx = getStablecoinYieldTransactionWithSelectedFee(parsedTransaction, selectedFee);
+
+    if (!tx) {
+        return null;
+    }
+
+    return {
+        ...buildStablecoinYieldReviewState({ ...reviewStateParams, tx }),
+        transactionForSigning: getStablecoinYieldTransactionForSigning(tx),
+    };
+};
```

</details>

**Conversation**

**🟦 @cermakjiri (me)** · 2026-05-22

> Great that you moved it to common 👍 One thing worries me though there's breaking change how the validation works now: i.e. instead of throwing errors it returns null.  
> At least from DevX it'll be much harder to deduce what's wrong or am I missing something? 🤔

**@BrantalikP** · 2026-05-25

> Each platform handles the error in its own way, but you’re right that returning `null` was probably too implicit. For example, it would be harder to notice that the error is related to the `fee data`. I’ve brought the explicit errors back. Thanks for pointing this out

---

### G11 — `packages/suite/src/components/suite/modals/ReduxModal/TransactionReviewModal/TransactionReviewModal.tsx:74`

- **PR** [#27725 — fix(suite): handle Solana tx timeout in review modal](https://github.com/trezor/trezor-suite/pull/27725) · author `@izmy` · merged
- **My first comment** 2026-05-14
- **Discussion thread** https://github.com/trezor/trezor-suite/pull/27725#discussion_r3241245158
- **Line of code** https://github.com/trezor/trezor-suite/blob/c2c0a043af623204c4116c8fddb4fabe5a9d28d6/packages/suite/src/components/suite/modals/ReduxModal/TransactionReviewModal/TransactionReviewModal.tsx#L74 _(thread is outdated — line refers to the original diff, may have moved)_
- **Thread** 2 comment(s), 1 mine
- **Status** resolved · outdated
- **Tags** `unhandled-rejection`, `component-crash`, `use-mutation`

<details>
<summary>Code under discussion (diff hunk)</summary>

```diff
@@ -60,16 +64,19 @@ export const TransactionReviewModal = ({ type, decision }: TransactionReviewModa
         }
     };
 
-    const handleSendTx = async () => {
-        await dispatch(
+    const handleSignAndPushSendTx = async () => {
+        const result = await dispatch(
             signAndPushSendFormTransactionThunk({
                 formState: send.precomposedForm!,
                 precomposedTransaction: send.precomposedTx!,
                 selectedAccount: selectedAccount.account,
             }),
-        );
+        ).unwrap();
```

</details>

**Conversation**

**🟦 @cermakjiri (me)** · 2026-05-14

> now the thunk's promise can be rejected, causing the component to crash, let's please add `try/catch` / `useMutation` 🙏

**@izmy** · 2026-05-14

> done

---

### G64 — `suite/e2e/performance/perfMeasure.ts:53`

- **PR** [#30154 — WIP: 28878 playwright perf tracking](https://github.com/trezor/trezor-suite/pull/30154) · author `@vojtatranta` · open
- **My first comment** 2026-08-03
- **Discussion thread** https://github.com/trezor/trezor-suite/pull/30154#discussion_r3702600838
- **Line of code** https://github.com/trezor/trezor-suite/blob/3dc9f6035d8c44fd7082e6f689cd3d03f2a9baef/suite/e2e/performance/perfMeasure.ts#L53
- **Thread** 1 comment(s), 1 mine
- **Status** **⚠️ PENDING — review never submitted, draft visible only to you** · unresolved
- **Tags** `fail-loudly`, `skip-vs-throw`, `e2e`

<details>
<summary>Code under discussion (diff hunk)</summary>

```diff
@@ -0,0 +1,149 @@
+import { CDPSession, Page, TestInfo } from '@playwright/test';
+import { appendFileSync, writeFileSync } from 'fs';
+import path from 'path';
+
+import {
+    PerfMetrics,
+    buildJsonReport,
+    compareScenario,
+    formatHumanReport,
+    getScenarioBaseline,
+    loadBaselinesSync,
+    readPerfMetrics,
+    startPerfMeasurement,
+} from '@trezor/perf-e2e';
+
+export const BASELINES_PATH = path.join(__dirname, 'baselines.json');
+
+// Gitignored, accumulates across runs. `perf:update` promotes medians from it into the baselines, so
+// accepting new numbers never requires a dedicated re-run.
+export const SAMPLES_PATH = path.join(__dirname, '.perf-samples.jsonl');
+
+// Lets the long-task observer flush and trailing renders settle before metrics are read.
+const SETTLE_MS = 400;
+
+// Chrome trace categories that make a rerender/long-task investigation possible.
+const TRACE_CATEGORIES = [
+    'devtools.timeline',
+    'disabled-by-default-devtools.timeline',
+    'v8.execute',
+    'disabled-by-default-v8.cpu_profiler',
+    'blink.user_timing',
+    'loading',
+    'toplevel',
+];
+
+/**
+ * Measures a single interaction and enforces the performance baseline.
+ *
+ * Instrumentation is installed globally at app load (see `electronSetup`), so no reload is needed
+ * here. On a target where it was not installed, the interaction still runs and measurement is
+ * skipped.
+ */
+export const measurePerformance = async (
+    page: Page,
+    testInfo: TestInfo,
+    scenario: string,
+    interaction: () => Promise<void>,
+): Promise<PerfMetrics | null> => {
+    const installed = await page.evaluate(
+        () =>
+            typeof (window as unknown as { __trezorPerf__?: unknown }).__trezorPerf__ !==
+            'undefined',
+    );
+    if (!installed) {
+        // eslint-disable-next-line no-console
+        console.log(
+            `[perf] instrumentation not installed (non-web target?) — skipping "${scenario}"`,
```

</details>

**Conversation**

**🟦 @cermakjiri (me)** · 2026-08-03

> It's for desktop too. I think this should throw an error instead (i.e. if a dev attempts to measure a test there's missing `__trezorPerf__`, why skipping it, right?)

---

### G65 — `packages/perf-e2e/src/instrumentation.ts:69`

- **PR** [#30154 — WIP: 28878 playwright perf tracking](https://github.com/trezor/trezor-suite/pull/30154) · author `@vojtatranta` · open
- **My first comment** 2026-08-03
- **Discussion thread** https://github.com/trezor/trezor-suite/pull/30154#discussion_r3703857163
- **Line of code** https://github.com/trezor/trezor-suite/blob/3dc9f6035d8c44fd7082e6f689cd3d03f2a9baef/packages/perf-e2e/src/instrumentation.ts#L69
- **Thread** 1 comment(s), 1 mine
- **Status** **⚠️ PENDING — review never submitted, draft visible only to you** · unresolved
- **Tags** `logging`, `debug-flag`, `observability`

<details>
<summary>Code under discussion (diff hunk)</summary>

```diff
@@ -0,0 +1,197 @@
+import { type PerfMetrics } from './types';
+
+/**
+ * Browser-side instrumentation.
+ *
+ * The functions below are executed inside the page, not in Node. They are handed verbatim to
+ * Playwright (`page.addInitScript` / `page.evaluate`), which serializes their source, so they MUST
+ * be fully self-contained: no imports, no closures over module state, only browser globals.
+ *
+ * `installPerfInstrumentation` must run at document start (before react-dom loads) so the React
+ * commit hook is installed before React probes `__REACT_DEVTOOLS_GLOBAL_HOOK__`.
+ */
+
+export const PERF_GLOBAL_KEY = '__trezorPerf__';
+
+type PerfController = {
+    start: () => void;
+    stop: () => PerfMetrics;
+    /** Fed by the app's <Profiler> onRender (see suite Main). Accumulates render duration. */
+    recordRender: (actualDuration: number) => void;
+};
+
+/**
+ * Idempotent.
+ *
+ * - React commit count: hooks `__REACT_DEVTOOLS_GLOBAL_HOOK__.onCommitFiberRoot` (works on any
+ *   build). Render *duration* comes from a real React <Profiler> in the app calling `recordRender`;
+ *   that only produces non-zero values when the app is built with React's profiling build
+ *   (`PERF_PROFILER` webpack alias), which the e2e desktop build enables.
+ * - Long tasks / TBT: a `longtask` PerformanceObserver buffers every entry; the window is applied
+ *   at `stop()` time so entries delivered late (observer callbacks are async) are not lost.
+ */
+export function installPerfInstrumentation(): void {
+    // Only instrument the top-level app frame. This init script runs in every frame (including the
+    // cross-origin Trezor Connect iframe/popup that handles device communication), and we must never
+    // touch those — measure only the main app. Comparing window references is same-origin-safe.
+    if (typeof window === 'undefined' || window.top !== window.self) {
+        return;
+    }
+
+    const w = window as unknown as Record<string, unknown>;
+    if (w.__trezorPerf__) {
+        return;
+    }
+
+    const state = {
+        enabled: false,
+        startTime: 0,
+        endTime: 0,
+        commitCount: 0,
+        renderDurationMs: 0,
+        // Whether the app's <Profiler> reported at least one render this window. Stays false when the
+        // app is not built with React's profiling build — then render duration is unavailable (null),
+        // not 0, so it is never mistaken for an improvement.
+        renderRecorded: false,
+        longTasks: [] as Array<{ start: number; duration: number }>,
+    };
+
+    const onCommit = (): void => {
+        if (!state.enabled) {
+            return;
+        }
+        state.commitCount += 1;
+    };
+
+    const hookKey = '__REACT_DEVTOOLS_GLOBAL_HOOK__';
+    const existingHook = w[hookKey] as
+        | { onCommitFiberRoot?: (...args: unknown[]) => unknown }
+        | undefined;
+
+    if (existingHook) {
+        // Real DevTools hook already present (e.g. extension): wrap the existing callback.
+        const previous = existingHook.onCommitFiberRoot;
+        existingHook.onCommitFiberRoot = (...args: unknown[]) => {
+            try {
+                onCommit();
+            } catch {
+                // ignore instrumentation errors, never break the app
```

</details>

**Conversation**

**🟦 @cermakjiri (me)** · 2026-08-03

> it might not a break the app but could signal something's off regarding the perf. measurement. What about enabling the logging when adding `--debug` flag?

---
