# React hooks & effects

Refs vs. state, effect dependencies and stale closures (`useFreshRef` / `useCurrentRef`).

**2 review-thread-group(s)** · [← back to index](../README.md)

Tags: `stale-closure`, `use-effect-deps`, `use-fresh-ref`, `use-ref`

| # | PR | File | Tags |
| --- | --- | --- | --- |
| [G22](#g22--suite-nativemodule-earnsrccomponentsyieldpendingtransactionmodaltsx129) | [#27718](https://github.com/trezor/trezor-suite/pull/27718) | `YieldPendingTransactionModal.tsx:129` | use-ref |
| [G10](#g10--packagessuitesrccomponentssuitemodalsreduxmodaltransactionreviewmodaltransactionreviewmodalbodytsx49) | [#27725](https://github.com/trezor/trezor-suite/pull/27725) | `TransactionReviewModalBody.tsx:49` | use-effect-deps, stale-closure, use-fresh-ref |

---

### G22 — `suite-native/module-earn/src/components/YieldPendingTransactionModal.tsx:129`

- **PR** [#27718 — feat(suite-native): yield deposit](https://github.com/trezor/trezor-suite/pull/27718) · author `@BrantalikP` · merged
- **My first comment** 2026-05-26
- **Discussion thread** https://github.com/trezor/trezor-suite/pull/27718#discussion_r3302177192
- **Line of code** https://github.com/trezor/trezor-suite/blob/49849a8b2a17ae6deeb8424b91a233ea3d219618/suite-native/module-earn/src/components/YieldPendingTransactionModal.tsx#L129
- **Thread** 2 comment(s), 1 mine
- **Status** resolved
- **Tags** `use-ref`

<details>
<summary>Code under discussion (diff hunk)</summary>

```diff
@@ -0,0 +1,307 @@
+import { type ReactNode, useCallback, useMemo } from 'react';
+import { StyleSheet, View } from 'react-native';
+import {
+    Extrapolation,
+    interpolate,
+    useAnimatedStyle,
+    useSharedValue,
+} from 'react-native-reanimated';
+
+import { type BottomSheetBackdropProps } from '@gorhom/bottom-sheet';
+import { type BottomSheetModalMethods } from '@gorhom/bottom-sheet/lib/typescript/types';
+
+import { useFormatters } from '@suite-common/formatters';
+import { type NetworkSymbol } from '@suite-common/wallet-config';
+import { type TokenAddress, type TokenSymbol } from '@suite-common/wallet-types';
+import {
+    Badge,
+    BottomSheetModal,
+    type BottomSheetModalRef,
+    Box,
+    Button,
+    Card,
+    CircularSpinner,
+    HStack,
+    Text,
+    VStack,
+} from '@suite-native/atoms';
+import { CryptoAmountFormatter, CryptoToFiatAmountFormatter } from '@suite-native/formatters';
+import { CryptoIcon, Icon, NetworkIcon } from '@suite-native/icons';
+import { Translation } from '@suite-native/intl';
+import { prepareNativeStyle, useNativeStyles } from '@trezor/styles-native';
+
+import { YieldPendingTransactionModalBackdrop } from './YieldPendingTransactionModalBackdrop';
+import { modalSnap } from './YieldPendingTransactionModalConstants';
+import { YieldPendingTransactionModalHeader } from './YieldPendingTransactionModalHeader';
+import { YieldPendingTransactionModalRow } from './YieldPendingTransactionModalRow';
+
+type YieldPendingTransactionModalProps = {
+    accountLabel: string;
+    accountSymbol: NetworkSymbol;
+    amount?: ReactNode;
+    amountLabel?: ReactNode;
+    amountTokenContract?: TokenAddress;
+    amountTokenSymbol?: TokenSymbol;
+    fee?: string;
+    isExploreDisabled?: boolean;
+    onExplorePress: () => void;
+    pendingLabel?: ReactNode;
+    ref: BottomSheetModalRef;
+    submittedAt: Date;
+    title: ReactNode;
+    vaultName?: string;
+    vaultTokenContract?: TokenAddress;
+};
+
+const VAULT_NAME_MAX_WIDTH = 150;
+
+const pendingIconStyle = prepareNativeStyle(utils => ({
+    width: 56,
+    height: 56,
+    borderRadius: utils.borders.radii.round,
+    alignItems: 'center',
+    justifyContent: 'center',
+    backgroundColor: utils.colors.surfaceFillRaised,
+    ...utils.boxShadows.small,
+}));
+
+const constrainedValueStyle = prepareNativeStyle(() => ({
+    maxWidth: VAULT_NAME_MAX_WIDTH,
+    minWidth: 0,
+    flexShrink: 1,
+}));
+
+const constrainedValueTextStyle = prepareNativeStyle(() => ({
+    minWidth: 0,
+    flexShrink: 1,
+}));
+
+const getBottomSheet = (ref: BottomSheetModalRef): BottomSheetModalMethods | null => {
+    if (typeof ref === 'object' && ref !== null && 'current' in ref) {
+        return ref.current;
+    }
+
+    return null;
+};
+
+export const YieldPendingTransactionModalContainer = ({ children }: { children?: ReactNode }) => (
+    <View pointerEvents="box-none" style={StyleSheet.absoluteFill}>
+        {children}
+    </View>
+);
+
+export const YieldPendingTransactionModal = ({
+    accountLabel,
+    accountSymbol,
+    amount,
+    amountLabel,
+    amountTokenContract,
+    amountTokenSymbol,
+    fee,
+    isExploreDisabled,
+    onExplorePress,
+    pendingLabel = <Translation id="moduleTrading.tradingConfirmationScreen.pending" />,
+    ref,
+    submittedAt,
+    title,
+    vaultName,
+    vaultTokenContract,
+}: YieldPendingTransactionModalProps) => {
+    const { applyStyle } = useNativeStyles();
+    const { DateFormatter, TimeFormatter } = useFormatters();
+    const animatedIndex = useSharedValue<number>(modalSnap.expandedIndex);
+    const snapPoints = useMemo(() => [modalSnap.collapsedHeight, modalSnap.expandedHeight], []);
+    const caretAnimatedStyle = useAnimatedStyle(() => {
+        const rotation = interpolate(
+            animatedIndex.value,
+            [modalSnap.collapsedIndex, modalSnap.expandedIndex],
+            [180, 0],
+            Extrapolation.CLAMP,
+        );
+
+        return {
+            transform: [{ rotateZ: `${rotation}deg` }],
+        };
+    });
+
+    const handleToggleSheet = useCallback(() => {
+        const isExpanded = animatedIndex.value >= modalSnap.indexMidpoint;
+        const bottomSheet = getBottomSheet(ref);
```

</details>

**Conversation**

**🟦 @cermakjiri (me)** · 2026-05-26

> Shouldn't be this rather done via `useRef` hook?

**@BrantalikP** · 2026-05-26

> nono, this serves simply as ref check if you look into the getBottomSheet, I need access to the ref from the parent to have control over the modal

---

### G10 — `packages/suite/src/components/suite/modals/ReduxModal/TransactionReviewModal/TransactionReviewModalBody.tsx:49`

- **PR** [#27725 — fix(suite): handle Solana tx timeout in review modal](https://github.com/trezor/trezor-suite/pull/27725) · author `@izmy` · merged
- **My first comment** 2026-05-14
- **Discussion thread** https://github.com/trezor/trezor-suite/pull/27725#discussion_r3241224796
- **Line of code** https://github.com/trezor/trezor-suite/blob/c2c0a043af623204c4116c8fddb4fabe5a9d28d6/packages/suite/src/components/suite/modals/ReduxModal/TransactionReviewModal/TransactionReviewModalBody.tsx#L49
- **Thread** 4 comment(s), 2 mine
- **Status** resolved
- **Tags** `use-effect-deps`, `stale-closure`, `use-fresh-ref`

<details>
<summary>Code under discussion (diff hunk)</summary>

```diff
@@ -39,14 +40,26 @@ export const TransactionReviewModalBody = ({
     isRbfConfirmedError,
 }: TransactionReviewModalBodyProps) => {
     const analytics = useAnalytics();
+    const dispatch = useDispatch();
     const account = useSelector(selectAccountIncludingChosenInTrading);
     const device = useSelector(selectSelectedDevice);
     const [isSending, setIsSending] = useState(false);
-    const { precomposedTx } = txInfoState;
-    const [hasTxExpired, setHasTxExpired] = useState(false);
+    const { precomposedTx, serializedTx } = txInfoState;
+    const [hasTxReviewExpired, setHasTxReviewExpired] = useState(false);
+    const prevSerializedTxRef = useRef(serializedTx);
```

</details>

**Conversation**

**🟦 @cermakjiri (me)** · 2026-05-14

> I think the intent here prevent triggering useEffect on `serializedTx` change but having fresh `serializedTx` value in the useEffect, right? If so, use `useFreshRef` 🙏

**@izmy** · 2026-05-14

> `useFreshRef` would not work here because this ref intentionally stores the previous `serializedTx` value. The effect needs to detect the transition from signed tx present to signed tx cleared, not read the latest value.

**🟦 @cermakjiri (me)** · 2026-05-14

> this only stores the value on mount, if you want prev., the `useCurrentRef` is the solution (I can see now, the naming is misleading 😄)

**@izmy** · 2026-05-14

> `useCurrentRef` updates before this effect runs. Here we need to read the previous `serializedTx` first and only then update the ref, so the manual update at the end of the effect is intentional.

---
