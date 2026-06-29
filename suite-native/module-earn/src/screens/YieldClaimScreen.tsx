import { useCallback, useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';

import { type RouteProp, useIsFocused, useNavigation, useRoute } from '@react-navigation/native';

import { getNetwork } from '@suite-common/wallet-config';
import {
    type AccountsRootState,
    selectAccountByKey,
    stablecoinYieldActions,
} from '@suite-common/wallet-core';
import { Box, FullAlertBox, Text, VStack, useBottomSheetModal } from '@suite-native/atoms';
import { useFiatFromCryptoValue } from '@suite-native/formatters';
import { Translation } from '@suite-native/intl';
import {
    Screen,
    ScreenHeader,
    type StackNavigationProps,
    type YieldStackParamList,
    YieldStackRoutes,
} from '@suite-native/navigation';
import { FeeSelector } from '@suite-native/transaction-management';

import { YieldClaimFlowFooter } from '../components/YieldClaimFlowFooter';
import { YieldClaimRewardsCard } from '../components/YieldClaimRewardsCard';
import { YieldPendingTransactionModal } from '../components/YieldPendingTransactionModal';
import { YieldTxSimulationBottomSheet } from '../components/YieldTxSimulationBottomSheet';
import { useShowYieldTransactionFailureAlert } from '../hooks/useShowYieldTransactionFailureAlert';
import { type PreparedYieldClaimAction, useYieldClaimFees } from '../hooks/useYieldClaimFees';
import { useYieldClaimRewards } from '../hooks/useYieldClaimRewards';
import { useYieldPendingTransaction } from '../hooks/useYieldPendingTransaction';
import { useYieldPendingTransactionTracking } from '../hooks/useYieldPendingTransactionTracking';
import { useYieldSession } from '../hooks/useYieldSession';
import { getStablecoinYieldClaimRewardsSnapshot } from '../utils/stablecoinYieldClaimSummaryUtils';
import { shouldShowClaimFeeWarning } from '../utils/yieldClaimFeeWarningUtils';

type RouteProps = RouteProp<YieldStackParamList, YieldStackRoutes.YieldClaim>;
type NavigationProps = StackNavigationProps<YieldStackParamList, YieldStackRoutes.YieldClaim>;

export const YieldClaimScreen = () => {
    const route = useRoute<RouteProps>();
    const navigation = useNavigation<NavigationProps>();
    const { accountKey } = route.params;
    const isFocused = useIsFocused();
    const dispatch = useDispatch();
    const {
        bottomSheetRef: simulationBottomSheetRef,
        closeModal: closeSimulationBottomSheet,
        openModal: openSimulationBottomSheet,
    } = useBottomSheetModal();
    const [simulationPreparedAction, setSimulationPreparedAction] =
        useState<PreparedYieldClaimAction | null>(null);
    const account = useSelector((state: AccountsRootState) =>
        selectAccountByKey(state, accountKey),
    );
    const flowKey = account?.key ?? null;
    const session = useYieldSession({
        flowKey,
        flowType: 'claim',
    });
    const {
        accountRewards,
        isClaimRewardsFiatLoading,
        isClaimRewardsLoading,
        waitForMerklToResolveClaim,
    } = useYieldClaimRewards({ account });
    const {
        pendingBottomSheetRef,
        pendingModalProps,
        pendingTransaction: claimPendingTransaction,
    } = useYieldPendingTransaction({
        accountKey: account?.key,
        isFocused,
        pendingTransaction: session?.action.pendingTransaction,
        transactionType: 'claim',
    });
    const isClaimPending = claimPendingTransaction !== undefined;
    const isClaimSubmitting = session?.action.isSubmitting ?? false;
    const claimFee = useYieldClaimFees({
        accountRewards,
        isEnabled: !!account && !isClaimPending,
    });
    const feeFiatAmount = useFiatFromCryptoValue({
        cryptoValue: claimFee.feePreview?.fee ?? null,
        symbol: account?.symbol ?? 'eth',
        isBalance: false,
    });
    const totalFiatClaimableAmount = accountRewards?.totalFiatClaimableAmount ?? null;
    const shouldShowFeeWarning = shouldShowClaimFeeWarning({
        feeFiatAmount,
        totalFiatClaimableAmount,
    });
    const isContinueDisabled =
        isClaimPending ||
        isClaimSubmitting ||
        isClaimRewardsLoading ||
        claimFee.isPreparingClaimFee ||
        claimFee.isFeeUnavailable ||
        !accountRewards ||
        !claimFee.preparedAction;

    useShowYieldTransactionFailureAlert({
        error: session?.error,
        flowKey,
        flowType: 'claim',
        isEnabled: isFocused,
    });

    useYieldPendingTransactionTracking({
        account,
        flowKey,
        flowType: 'claim',
        pendingTransaction: claimPendingTransaction,
        waitForMerklToResolveClaim,
    });

    useEffect(() => {
        if (!flowKey || session?.step !== 'approve') {
            return;
        }

        dispatch(stablecoinYieldActions.skipApprovalStep({ flowType: 'claim', flowKey }));
    }, [dispatch, flowKey, session?.step]);

    useEffect(() => {
        if (session?.step === 'complete') {
            navigation.replace(YieldStackRoutes.YieldClaimComplete, route.params);
        }
    }, [navigation, route.params, session?.step]);

    const handleContinue = useCallback(() => {
        if (isContinueDisabled || !claimFee.preparedAction) {
            return;
        }

        setSimulationPreparedAction(claimFee.preparedAction);
        requestAnimationFrame(openSimulationBottomSheet);
    }, [claimFee.preparedAction, isContinueDisabled, openSimulationBottomSheet]);

    const handleConfirmSimulation = useCallback(() => {
        if (!flowKey || !accountRewards || !simulationPreparedAction) {
            return;
        }

        dispatch(
            stablecoinYieldActions.storeActionReviewData({
                flowKey,
                flowType: 'claim',
                rewards: getStablecoinYieldClaimRewardsSnapshot(accountRewards),
                unsignedTransaction: simulationPreparedAction.unsignedTransaction,
            }),
        );
        closeSimulationBottomSheet();
        navigation.navigate(YieldStackRoutes.YieldClaimReview, route.params);
    }, [
        accountRewards,
        closeSimulationBottomSheet,
        dispatch,
        flowKey,
        navigation,
        route.params,
        simulationPreparedAction,
    ]);

    if (!account) {
        return null;
    }

    const accountLabel = account.accountLabel ?? getNetwork(account.symbol).name;

    return (
        <Screen
            noHorizontalPadding
            header={
                <ScreenHeader
                    customContent={
                        <VStack spacing={0} alignItems="center">
                            <Text variant="body-md-strong">
                                <Translation id="earn.yieldClaimFlowScreen.title" />
                            </Text>
                            <Text
                                variant="body-md"
                                color="contentSecondary"
                                numberOfLines={1}
                                ellipsizeMode="tail"
                            >
                                {accountLabel}
                            </Text>
                        </VStack>
                    }
                />
            }
            footer={
                <YieldClaimFlowFooter
                    isDisabled={isContinueDisabled}
                    isLoading={isClaimSubmitting}
                    onPress={handleContinue}
                />
            }
        >
            <Box paddingHorizontal="sp16" pointerEvents={isClaimPending ? 'none' : 'auto'}>
                <VStack spacing="sp20">
                    <YieldClaimRewardsCard
                        accountRewards={accountRewards}
                        isFiatLoading={isClaimRewardsFiatLoading}
                        isLoading={isClaimRewardsLoading}
                    />

                    <FeeSelector
                        accountKey={account.key}
                        updateThunk={claimFee.updateFeeLevelThunk}
                        selectedFee={claimFee.selectedFee}
                        selectedFeePerUnit={claimFee.formDraft?.feePerUnit}
                        formDraft={claimFee.formDraft}
                        formDraftKey={claimFee.formDraftKey}
                    />

                    {shouldShowFeeWarning && (
                        <FullAlertBox
                            intent="warning"
                            title={<Translation id="earn.yieldClaimFlowScreen.feeWarning.title" />}
                            description={
                                <Translation id="earn.yieldClaimFlowScreen.feeWarning.description" />
                            }
                        />
                    )}
                </VStack>
            </Box>

            {claimPendingTransaction && pendingModalProps && (
                <YieldPendingTransactionModal
                    ref={pendingBottomSheetRef}
                    accountLabel={accountLabel}
                    accountSymbol={account.symbol}
                    fee={pendingModalProps.fee}
                    isExploreDisabled={pendingModalProps.isExploreDisabled}
                    onExplorePress={pendingModalProps.onExplorePress}
                    submittedAt={pendingModalProps.submittedAt}
                    title={<Translation id="earn.yieldClaimFlowScreen.claimPendingTitle" />}
                />
            )}

            {simulationPreparedAction && (
                <YieldTxSimulationBottomSheet
                    ref={simulationBottomSheetRef}
                    account={account}
                    flow="claim"
                    onCancel={closeSimulationBottomSheet}
                    onConfirm={handleConfirmSimulation}
                    unsignedTx={simulationPreparedAction.unsignedTransaction}
                />
            )}
        </Screen>
    );
};
