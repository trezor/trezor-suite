import { useCallback, useEffect, useState } from 'react';
import { useSelector } from 'react-redux';

import { type RouteProp, useIsFocused, useNavigation, useRoute } from '@react-navigation/native';

import { events } from '@suite-common/analytics';
import { useServices } from '@suite-common/dependency-injection';
import { Context } from '@suite-common/message-system';
import { useDispatch } from '@suite-common/redux-utils';
import { getNetwork } from '@suite-common/wallet-config';
import {
    type AccountsRootState,
    getYieldClaimRewardsSnapshot,
    selectAccountByKey,
    yieldActions,
} from '@suite-common/wallet-core';
import { selectAccountLabel } from '@suite-native/accounts';
import { selectNativeAnalyticsDep } from '@suite-native/analytics';
import { BannerFull, Box, HStack, Text, VStack, useBottomSheetModal } from '@suite-native/atoms';
import { useFiatFromCryptoValue } from '@suite-native/formatters';
import { TokenIcon } from '@suite-native/icons';
import { Translation } from '@suite-native/intl';
import { type CombinedLabelingState } from '@suite-native/labeling';
import { ContextMessage } from '@suite-native/message-system';
import {
    Screen,
    ScreenHeader,
    type StackNavigationProps,
    type YieldStackParamList,
    YieldStackRoutes,
} from '@suite-native/navigation';

import { YieldClaimFlowFooter } from '../../components/yield/YieldClaimFlowFooter';
import { YieldClaimRewardsCard } from '../../components/yield/YieldClaimRewardsCard';
import { YieldDisabledAlert } from '../../components/yield/YieldDisabledAlert';
import { YieldFeeSection } from '../../components/yield/YieldFeeSection';
import { YieldPendingTransactionModal } from '../../components/yield/YieldPendingTransactionModal';
import { YieldTxSimulationBottomSheet } from '../../components/yield/YieldTxSimulationBottomSheet';
import { useNavigateBackAnalytics } from '../../hooks/earn/useNavigateBackAnalytics';
import { useMessageSystemYield } from '../../hooks/yield/useMessageSystemYield';
import { useShowYieldTransactionFailureAlert } from '../../hooks/yield/useShowYieldTransactionFailureAlert';
import {
    type PreparedYieldClaimAction,
    useYieldClaimFees,
} from '../../hooks/yield/useYieldClaimFees';
import { useYieldClaimRewards } from '../../hooks/yield/useYieldClaimRewards';
import { useYieldPendingTransaction } from '../../hooks/yield/useYieldPendingTransaction';
import { useYieldPendingTransactionTracking } from '../../hooks/yield/useYieldPendingTransactionTracking';
import { useYieldSession } from '../../hooks/yield/useYieldSession';
import { getClaimFeeWarning } from '../../utils/yield/yieldClaimFeeWarningUtils';

type RouteProps = RouteProp<YieldStackParamList, YieldStackRoutes.YieldClaim>;
type NavigationProps = StackNavigationProps<YieldStackParamList, YieldStackRoutes.YieldClaim>;

export const YieldClaimScreen = () => {
    const route = useRoute<RouteProps>();
    const navigation = useNavigation<NavigationProps>();
    const { accountKey, vault } = route.params;
    const isFocused = useIsFocused();
    const dispatch = useDispatch();
    const { analytics } = useServices(selectNativeAnalyticsDep);
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
    const customAccountLabel = useSelector((state: CombinedLabelingState) =>
        account
            ? selectAccountLabel(state, account.deviceState, account.descriptor, account.symbol)
            : null,
    );
    const flowKey = account?.key ?? null;
    const {
        isDisabled: isClaimDisabled,
        content: claimDisabledContent,
        variant: claimDisabledVariant,
    } = useMessageSystemYield('claim');

    useNavigateBackAnalytics({
        type: events.yieldNavigateEvent.name,
        payload: {
            action: 'cancel',
            from: 'claim-form',
            to: 'claim-form',
            networkSymbol: account?.symbol,
        },
    });

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
        displayedPendingTransaction,
        isSheetPresented,
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

    const claimFeeWarning = getClaimFeeWarning({
        feeFiatAmount,
        totalFiatClaimableAmount,
    });
    const [hasClaimBeenPrepared, setHasClaimBeenPrepared] = useState(false);
    const isClaimPrepared =
        !isClaimRewardsLoading &&
        !isClaimRewardsFiatLoading &&
        !claimFee.isPreparingClaimFee &&
        !!claimFee.preparedAction;

    useEffect(() => {
        if (isClaimPrepared) {
            setHasClaimBeenPrepared(true);
        }
    }, [isClaimPrepared]);

    const shouldShowFeeWarning = claimFeeWarning === 'fee-exceeds-rewards';

    const shouldShowUnverifiableFeeWarning =
        claimFeeWarning === 'unverifiable-rewards-value' && hasClaimBeenPrepared;

    const isContinueDisabled =
        isClaimPending ||
        isClaimSubmitting ||
        isClaimRewardsLoading ||
        claimFee.isPreparingClaimFee ||
        claimFee.isFeeUnavailable ||
        !accountRewards ||
        !claimFee.preparedAction ||
        isClaimDisabled;

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
        if (isSheetPresented) return;

        if (session?.step === 'complete') {
            navigation.replace(YieldStackRoutes.YieldClaimComplete, route.params);
        }
    }, [isSheetPresented, navigation, route.params, session?.step]);

    const reportClaimEvent = useCallback(
        (payload: { action: 'continue' | 'cancel'; type: 'claim' | 'tx-simulation-modal' }) => {
            analytics.report({
                type: events.yieldClaimEvent.name,
                payload: {
                    ...payload,
                    networkSymbol: account?.symbol,
                    rewardCount: accountRewards?.rewards.length,
                },
            });
        },
        [account?.symbol, accountRewards?.rewards.length, analytics],
    );

    const handleContinue = useCallback(() => {
        if (isContinueDisabled || !claimFee.preparedAction) {
            return;
        }

        reportClaimEvent({ action: 'continue', type: 'claim' });
        setSimulationPreparedAction(claimFee.preparedAction);
        requestAnimationFrame(openSimulationBottomSheet);
    }, [claimFee.preparedAction, isContinueDisabled, openSimulationBottomSheet, reportClaimEvent]);

    const handleCancelSimulation = useCallback(() => {
        reportClaimEvent({ action: 'cancel', type: 'tx-simulation-modal' });
        closeSimulationBottomSheet();
    }, [closeSimulationBottomSheet, reportClaimEvent]);

    const handleConfirmSimulation = useCallback(() => {
        if (!account || !flowKey || !simulationPreparedAction) {
            return;
        }

        // The snapshot is built from the same frozen rewards the claim
        // calldata was built from, so the review cannot diverge from the
        // signed transaction when Merkl data refreshes in the background.
        const rewardsSnapshot = getYieldClaimRewardsSnapshot({
            networkSymbol: account.symbol,
            rewards: simulationPreparedAction.rewards,
        });

        reportClaimEvent({ action: 'continue', type: 'tx-simulation-modal' });

        dispatch(
            yieldActions.storeActionReviewData({
                flowKey,
                flowType: 'claim',
                rewards: rewardsSnapshot,
                unsignedTransaction: simulationPreparedAction.unsignedTransaction,
            }),
        );
        closeSimulationBottomSheet();
        navigation.navigate(YieldStackRoutes.YieldClaimReview, route.params);
    }, [
        account,
        closeSimulationBottomSheet,
        dispatch,
        flowKey,
        navigation,
        reportClaimEvent,
        route.params,
        simulationPreparedAction,
    ]);

    if (!account) {
        return null;
    }

    const accountLabel = customAccountLabel ?? getNetwork(account.symbol).name;

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
                            {vault ? (
                                <>
                                    <HStack spacing="sp4" alignItems="center">
                                        <TokenIcon
                                            symbol={account.symbol}
                                            contractAddress={vault.tokenContract}
                                            size="tiny"
                                        />
                                        <Box flexShrink={1}>
                                            <Text
                                                variant="body-md"
                                                color="contentSecondary"
                                                numberOfLines={1}
                                                ellipsizeMode="tail"
                                            >
                                                {vault.name}
                                            </Text>
                                        </Box>
                                    </HStack>
                                    <Text
                                        variant="body-xs"
                                        color="contentSecondary"
                                        numberOfLines={1}
                                        ellipsizeMode="tail"
                                    >
                                        {accountLabel}
                                    </Text>
                                </>
                            ) : (
                                <Text
                                    variant="body-md"
                                    color="contentSecondary"
                                    numberOfLines={1}
                                    ellipsizeMode="tail"
                                >
                                    {accountLabel}
                                </Text>
                            )}
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
                    <ContextMessage context={Context.getEarnYield('claim')} />
                    {isClaimDisabled && (
                        <YieldDisabledAlert
                            type="claim"
                            content={claimDisabledContent}
                            variant={claimDisabledVariant}
                        />
                    )}
                    <YieldClaimRewardsCard
                        accountRewards={accountRewards}
                        isFiatLoading={isClaimRewardsFiatLoading}
                        isLoading={isClaimRewardsLoading}
                    />

                    <YieldFeeSection accountKey={account.key} fees={claimFee} />

                    {shouldShowFeeWarning && (
                        <BannerFull
                            intent="warning"
                            title={<Translation id="earn.yieldClaimFlowScreen.feeWarning.title" />}
                            description={
                                <Translation id="earn.yieldClaimFlowScreen.feeWarning.description" />
                            }
                        />
                    )}

                    {shouldShowUnverifiableFeeWarning && (
                        <BannerFull
                            intent="info"
                            title={
                                <Translation id="earn.yieldClaimFlowScreen.unverifiableFeeWarning.title" />
                            }
                            description={
                                <Translation id="earn.yieldClaimFlowScreen.unverifiableFeeWarning.description" />
                            }
                        />
                    )}
                </VStack>
            </Box>

            {displayedPendingTransaction && pendingModalProps && (
                <YieldPendingTransactionModal
                    ref={pendingBottomSheetRef}
                    accountLabel={accountLabel}
                    accountSymbol={account.symbol}
                    fee={pendingModalProps.fee}
                    isExploreDisabled={pendingModalProps.isExploreDisabled}
                    onDismiss={pendingModalProps.onDismiss}
                    onExplorePress={pendingModalProps.onExplorePress}
                    submittedAt={pendingModalProps.submittedAt}
                    txid={pendingModalProps.txid}
                    title={<Translation id="earn.yieldClaimFlowScreen.claimPendingTitle" />}
                />
            )}

            {simulationPreparedAction && (
                <YieldTxSimulationBottomSheet
                    ref={simulationBottomSheetRef}
                    account={account}
                    flow="claim"
                    onCancel={handleCancelSimulation}
                    onConfirm={handleConfirmSimulation}
                    unsignedTx={simulationPreparedAction.unsignedTransaction}
                />
            )}
        </Screen>
    );
};
