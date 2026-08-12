import { useCallback, useEffect, useMemo } from 'react';

import { type RouteProp, useIsFocused, useNavigation, useRoute } from '@react-navigation/native';

import { events } from '@suite-common/analytics';
import { useServices } from '@suite-common/dependency-injection';
import { getNetwork, getNetworkDisplaySymbol } from '@suite-common/wallet-config';
import {
    type YieldWithdrawFlowType,
    getConvertedOutputTokenBalanceToInputTokenAmount,
} from '@suite-common/wallet-core';
import { toTokenAddress, toTokenSymbol } from '@suite-common/wallet-types';
import { selectNativeAnalyticsDep } from '@suite-native/analytics';
import { BannerFull, Box, Text, VStack } from '@suite-native/atoms';
import { Form } from '@suite-native/forms';
import { Translation } from '@suite-native/intl';
import {
    Screen,
    type StackNavigationProps,
    type YieldStackParamList,
    YieldStackRoutes,
} from '@suite-native/navigation';
import { BigNumber } from '@trezor/utils';

import { WrappedNativeTokenAmountInputCard } from '../components/WrappedNativeTokenAmountInputCard';
import { YieldDepositFlowScreenHeader } from '../components/YieldDepositFlowScreenHeader';
import { YieldDisabledAlert } from '../components/YieldDisabledAlert';
import { YieldFeeSection } from '../components/YieldFeeSection';
import { YieldPendingTransactionModal } from '../components/YieldPendingTransactionModal';
import { YieldTxSimulationBottomSheet } from '../components/YieldTxSimulationBottomSheet';
import { YieldWithdrawStepCard } from '../components/YieldWithdrawStepCard';
import { YieldWrappedNativeReceivingCard } from '../components/YieldWrappedNativeReceivingCard';
import { YieldWrappedNativeStepFooter } from '../components/YieldWrappedNativeStepFooter';
import { useMessageSystemWrappedNative } from '../hooks/useMessageSystemWrappedNative';
import { useResolvedYieldFlowData } from '../hooks/useResolvedYieldFlowData';
import { useYieldCurrencyToggleAnalytics } from '../hooks/useYieldCurrencyToggleAnalytics';
import { useYieldWrappedNativeStep } from '../hooks/useYieldWrappedNativeStep';

type RouteProps = RouteProp<YieldStackParamList, YieldStackRoutes.YieldWithdrawUnwrap>;
type NavigationProps = StackNavigationProps<
    YieldStackParamList,
    YieldStackRoutes.YieldWithdrawUnwrap
>;

export const YieldWithdrawUnwrapScreen = () => {
    const route = useRoute<RouteProps>();
    const navigation = useNavigation<NavigationProps>();
    const isFocused = useIsFocused();
    const { analytics } = useServices(selectNativeAnalyticsDep);

    const flowType: YieldWithdrawFlowType = route.params.withdrawFlowType ?? 'withdraw';

    const resolvedFlowData = useResolvedYieldFlowData(route.params);
    const {
        account,
        flowKey,
        isWrappedNativeVault,
        token,
        vault,
        vaultTokenName,
        resolutionStatus,
    } = resolvedFlowData;

    const {
        isDisabled: isUnwrapDisabled,
        content: unwrapDisabledContent,
        variant: unwrapDisabledVariant,
    } = useMessageSystemWrappedNative('unwrap');

    const reportCurrencyToggle = useYieldCurrencyToggleAnalytics({
        networkSymbol: account?.symbol,
        vaultId: vault?.id,
    });

    // The in-flow unwrap step belongs to the withdraw flow, so its max button reports
    // `withdraw-max` rather than the standalone `unwrap-max`. The step has no asset/shares choice —
    // the amount is always the wrapped token, i.e. the asset.
    const reportMaxSelected = useCallback(() => {
        analytics.report({
            type: events.yieldInteractionEvent.name,
            payload: {
                element: 'withdraw-max',
                value: 'asset',
                networkSymbol: account?.symbol,
                vaultId: vault?.id,
            },
        });
    }, [account?.symbol, analytics, vault?.id]);

    const nativeSymbol = toTokenSymbol(account ? getNetworkDisplaySymbol(account.symbol) : '');
    const wrappedBalance = token?.balance ?? '0';

    const handleSkipAnalytics = useCallback(() => {
        analytics.report({
            type: events.yieldWithdrawEvent.name,
            payload: {
                action: 'cancel',
                type: 'unwrap',
                operation: flowType,
                networkSymbol: account?.symbol,
                vaultId: vault?.id,
            },
        });
    }, [account?.symbol, analytics, flowType, vault?.id]);

    const handleSubmitAnalytics = useCallback(() => {
        analytics.report({
            type: events.yieldWithdrawEvent.name,
            payload: {
                action: 'continue',
                type: 'unwrap',
                operation: flowType,
                networkSymbol: account?.symbol,
                vaultId: vault?.id,
            },
        });
    }, [account?.symbol, analytics, flowType, vault?.id]);

    const handleNavigateToReview = useCallback(() => {
        navigation.navigate(YieldStackRoutes.YieldWithdrawUnwrapReview, route.params);
    }, [navigation, route.params]);

    const step = useYieldWrappedNativeStep({
        account,
        availableBalance: wrappedBalance,
        decimals: token?.decimals ?? 0,
        flowKey,
        flowType,
        isDisabled: isUnwrapDisabled,
        isWrappedNativeVault,
        onNavigateToReview: handleNavigateToReview,
        onSkipAnalytics: handleSkipAnalytics,
        onSubmitAnalytics: handleSubmitAnalytics,
        step: 'unwrap',
        tokenSymbol: token?.symbol ?? '',
        vault,
    });
    const { amountValue, fees, isSheetPresented, session, simulation } = step;

    const completedAmount = session?.result.completedAmount;
    const isUnwrapSessionReady = step.isStepSessionReady;
    const withdrawnAmount = useMemo(() => {
        if (
            resolutionStatus !== 'resolved' ||
            !isUnwrapSessionReady ||
            !completedAmount ||
            !vault.outputToken
        ) {
            return undefined;
        }

        const withdrawnWrappedAmount =
            flowType === 'redeem'
                ? getConvertedOutputTokenBalanceToInputTokenAmount({
                      networkSymbol: account.symbol,
                      token: vault.token,
                      outputToken: vault.outputToken,
                      outputTokenBalance: completedAmount,
                      pricePerShareState: vault.state?.pricePerShareState,
                  })
                : completedAmount;
        const clampedAmount = BigNumber.min(
            new BigNumber(withdrawnWrappedAmount).decimalPlaces(
                token.decimals,
                BigNumber.ROUND_DOWN,
            ),
            wrappedBalance,
        );

        return clampedAmount.gt(0) ? clampedAmount.toFixed() : undefined;
    }, [
        account,
        completedAmount,
        flowType,
        isUnwrapSessionReady,
        resolutionStatus,
        token,
        vault,
        wrappedBalance,
    ]);

    useEffect(() => {
        if (!isFocused) {
            return;
        }

        // Replacing the screen while the sheet is still dismissing crashes Fabric — see
        // `useYieldPendingSheet`.
        if (isSheetPresented) {
            return;
        }

        if (session?.step === 'action') {
            navigation.replace(YieldStackRoutes.YieldWithdraw, {
                ...route.params,
                withdrawFlowType: flowType,
            });

            return;
        }

        if (session?.step === 'complete') {
            navigation.replace(YieldStackRoutes.YieldWithdrawComplete, {
                ...route.params,
                withdrawFlowType: flowType,
            });
        }
    }, [flowType, isFocused, isSheetPresented, navigation, route.params, session?.step]);

    if (resolutionStatus !== 'resolved' || !isWrappedNativeVault) {
        return null;
    }

    const accountLabel = account.accountLabel ?? getNetwork(account.symbol).name;
    const wrappedTokenSymbol = toTokenSymbol(token.symbol);
    const wrappedTokenContract = toTokenAddress(token.contractAddress ?? '');
    const isSubmitDisabled =
        !step.isAmountReady ||
        !fees.isFeeReady ||
        !step.isStepSessionReady ||
        step.isStepPending ||
        isUnwrapDisabled;

    return (
        <Screen
            noHorizontalPadding
            header={
                <YieldDepositFlowScreenHeader
                    account={account}
                    closeAction={step.handleClose}
                    closeActionType="back"
                    title={vaultTokenName}
                    tokenContract={route.params.tokenContract}
                />
            }
            footer={
                <YieldWrappedNativeStepFooter
                    flowType="unwrap"
                    isSkipFirst
                    isSubmitDisabled={isSubmitDisabled}
                    isSubmitLoading={fees.isFeePreparing}
                    onSkip={step.isStepPending ? undefined : step.handleSkip}
                    onSubmit={simulation.handleSubmit}
                    spentSymbol={wrappedTokenSymbol}
                />
            }
        >
            <Box pointerEvents={step.isStepPending ? 'none' : 'auto'}>
                <Form form={step.form.form}>
                    <VStack spacing="sp16">
                        {isUnwrapDisabled && (
                            <Box paddingHorizontal="sp16">
                                <YieldDisabledAlert
                                    type="unwrap"
                                    content={unwrapDisabledContent}
                                    variant={unwrapDisabledVariant}
                                />
                            </Box>
                        )}

                        <YieldWithdrawStepCard
                            currentStepId="unwrap"
                            hasUnwrapStep
                            networkSymbol={account.symbol}
                        />

                        <Box paddingHorizontal="sp16">
                            <Text variant="body-sm" color="contentSecondary">
                                <Translation
                                    id="earn.yieldWithdrawFlowScreen.unwrapStepDescription"
                                    values={{
                                        networkName: getNetwork(account.symbol).name,
                                        tokenSymbol: wrappedTokenSymbol,
                                    }}
                                />
                            </Text>
                        </Box>

                        <Box paddingHorizontal="sp16">
                            <WrappedNativeTokenAmountInputCard
                                amountLabel={
                                    <Translation id="earn.unwrapNativeToken.amountToUnwrap" />
                                }
                                balance={wrappedBalance}
                                defaultAmount={withdrawnAmount}
                                onCurrencyChange={reportCurrencyToggle}
                                onMaxPress={reportMaxSelected}
                                symbol={account.symbol}
                                tokenContract={wrappedTokenContract}
                                tokenDecimals={token.decimals}
                                tokenSymbol={wrappedTokenSymbol}
                            />
                        </Box>

                        {step.isAmountReady && (
                            <Box paddingHorizontal="sp16">
                                <YieldWrappedNativeReceivingCard
                                    amount={amountValue ?? ''}
                                    networkSymbol={account.symbol}
                                    tokenDecimals={getNetwork(account.symbol).decimals}
                                    tokenSymbol={nativeSymbol}
                                />
                            </Box>
                        )}

                        {simulation.isDeviceNotConnectedVisible && (
                            <Box paddingHorizontal="sp16">
                                <BannerFull
                                    intent="critical"
                                    title={
                                        <Translation id="earn.unwrapNativeToken.errors.deviceNotConnected" />
                                    }
                                />
                            </Box>
                        )}

                        {step.isFeeSectionDisplayed && (
                            <Box paddingHorizontal="sp16">
                                <YieldFeeSection
                                    accountKey={account.key}
                                    fees={fees}
                                    tokenContract={wrappedTokenContract}
                                />
                            </Box>
                        )}
                    </VStack>
                </Form>
            </Box>
            {step.displayedPendingTransaction && step.pendingModalProps && (
                <YieldPendingTransactionModal
                    ref={step.pendingBottomSheetRef}
                    accountLabel={accountLabel}
                    accountSymbol={account.symbol}
                    amount={step.displayedPendingTransaction.amount}
                    amountLabel={<Translation id="earn.unwrapNativeToken.amountToUnwrap" />}
                    amountTokenContract={wrappedTokenContract}
                    amountTokenSymbol={wrappedTokenSymbol}
                    fee={step.pendingModalProps.fee}
                    isExploreDisabled={step.pendingModalProps.isExploreDisabled}
                    onDismiss={step.pendingModalProps.onDismiss}
                    onExplorePress={step.pendingModalProps.onExplorePress}
                    submittedAt={step.pendingModalProps.submittedAt}
                    txid={step.pendingModalProps.txid}
                    title={<Translation id="earn.yieldWithdrawFlowScreen.unwrapPendingTitle" />}
                    vaultName={vaultTokenName}
                    vaultTokenContract={route.params.tokenContract}
                />
            )}
            {simulation.preparedTx && (
                <YieldTxSimulationBottomSheet
                    ref={simulation.simulationBottomSheetRef}
                    account={account}
                    flow="unwrap"
                    onCancel={simulation.handleCancelSimulation}
                    onConfirm={simulation.handleConfirmSimulation}
                    unsignedTx={simulation.preparedTx.unsignedTransaction}
                />
            )}
        </Screen>
    );
};
