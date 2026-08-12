import { useCallback, useEffect } from 'react';

import { type RouteProp, useIsFocused, useNavigation, useRoute } from '@react-navigation/native';

import { events } from '@suite-common/analytics';
import { useServices } from '@suite-common/dependency-injection';
import { Context } from '@suite-common/message-system';
import { getNetwork, getNetworkDisplaySymbol } from '@suite-common/wallet-config';
import { WETH_WRAP_GAS_RESERVE } from '@suite-common/wallet-constants';
import {
    getMaxWrapAmount,
    getYieldVaultContractAddress,
    shouldRecommendWrapReserve,
} from '@suite-common/wallet-core';
import { toTokenAddress, toTokenSymbol } from '@suite-common/wallet-types';
import { isPositiveBalance } from '@suite-common/wallet-utils';
import { selectNativeAnalyticsDep } from '@suite-native/analytics';
import { BannerFull, Box, VStack, useBottomSheetModal } from '@suite-native/atoms';
import { Form } from '@suite-native/forms';
import { Translation } from '@suite-native/intl';
import { ContextMessage } from '@suite-native/message-system';
import {
    Screen,
    type StackNavigationProps,
    type YieldStackParamList,
    YieldStackRoutes,
} from '@suite-native/navigation';

import { WrappedNativeTokenAmountInputCard } from '../components/WrappedNativeTokenAmountInputCard';
import { YieldDepositFlowScreenHeader } from '../components/YieldDepositFlowScreenHeader';
import { YieldDepositInfoBottomSheet } from '../components/YieldDepositInfoBottomSheet';
import { YieldDepositStepCard } from '../components/YieldDepositStepCard';
import { YieldDisabledAlert } from '../components/YieldDisabledAlert';
import { YieldFeeSection } from '../components/YieldFeeSection';
import { YieldPendingTransactionModal } from '../components/YieldPendingTransactionModal';
import { YieldTxSimulationBottomSheet } from '../components/YieldTxSimulationBottomSheet';
import { YieldWrappedNativeReceivingCard } from '../components/YieldWrappedNativeReceivingCard';
import { YieldWrappedNativeStepFooter } from '../components/YieldWrappedNativeStepFooter';
import { useMessageSystemWrappedNative } from '../hooks/useMessageSystemWrappedNative';
import { useMessageSystemYield } from '../hooks/useMessageSystemYield';
import { useResolvedYieldFlowData } from '../hooks/useResolvedYieldFlowData';
import { useYieldCurrencyToggleAnalytics } from '../hooks/useYieldCurrencyToggleAnalytics';
import { useYieldWrappedNativeStep } from '../hooks/useYieldWrappedNativeStep';

type RouteProps = RouteProp<YieldStackParamList, YieldStackRoutes.YieldDepositWrap>;
type NavigationProps = StackNavigationProps<YieldStackParamList, YieldStackRoutes.YieldDepositWrap>;

export const YieldDepositWrapScreen = () => {
    const route = useRoute<RouteProps>();
    const navigation = useNavigation<NavigationProps>();
    const isFocused = useIsFocused();
    const { analytics } = useServices(selectNativeAnalyticsDep);

    const {
        bottomSheetRef: infoBottomSheetRef,
        closeModal: closeInfoBottomSheet,
        openModal: openInfoBottomSheet,
    } = useBottomSheetModal();

    const resolvedFlowData = useResolvedYieldFlowData(route.params);
    const {
        account,
        apy,
        bonusRewardTokenSymbol,
        flowKey,
        isWrappedNativeVault,
        token,
        tokenSymbol,
        vault,
        vaultTokenSymbol,
        vaultTokenName,
        resolutionStatus,
        wrappedNativeSymbol,
    } = resolvedFlowData;

    const vaultContractAddress = vault ? getYieldVaultContractAddress(vault) : undefined;
    const reportCurrencyToggle = useYieldCurrencyToggleAnalytics({
        networkSymbol: account?.symbol,
        vaultId: vault?.id,
    });

    // The in-flow wrap step belongs to the deposit flow, so its max button reports `deposit-max`
    // rather than the standalone `wrap-max`.
    const reportMaxSelected = useCallback(() => {
        analytics.report({
            type: events.yieldInteractionEvent.name,
            payload: {
                element: 'deposit-max',
                networkSymbol: account?.symbol,
                vaultId: vault?.id,
            },
        });
    }, [account?.symbol, analytics, vault?.id]);

    const {
        isDisabled: isDepositDisabled,
        content: depositDisabledContent,
        variant: depositDisabledVariant,
    } = useMessageSystemYield('deposit', { vaultContractAddress });
    const {
        isDisabled: isWrapDisabled,
        content: wrapDisabledContent,
        variant: wrapDisabledVariant,
    } = useMessageSystemWrappedNative('wrap');

    const nativeSymbol = toTokenSymbol(account ? getNetworkDisplaySymbol(account.symbol) : '');
    const nativeBalance = account?.formattedBalance ?? '0';

    const handleSkipAnalytics = useCallback(() => {
        analytics.report({
            type: events.yieldDepositEvent.name,
            payload: {
                action: 'cancel',
                type: 'wrap',
                networkSymbol: account?.symbol,
                vaultId: vault?.id,
            },
        });
    }, [account?.symbol, analytics, vault?.id]);

    const handleSubmitAnalytics = useCallback(() => {
        analytics.report({
            type: events.yieldDepositEvent.name,
            payload: {
                action: 'continue',
                type: 'wrap',
                networkSymbol: account?.symbol,
                vaultId: vault?.id,
            },
        });
    }, [account?.symbol, analytics, vault?.id]);

    const handleNavigateToReview = useCallback(() => {
        navigation.navigate(YieldStackRoutes.YieldDepositWrapReview, route.params);
    }, [navigation, route.params]);

    const step = useYieldWrappedNativeStep({
        account,
        availableBalance: nativeBalance,
        decimals: account ? getNetwork(account.symbol).decimals : 0,
        flowKey,
        flowType: 'deposit',
        isDisabled: isWrapDisabled || isDepositDisabled,
        isWrappedNativeVault,
        onNavigateToReview: handleNavigateToReview,
        onSkipAnalytics: handleSkipAnalytics,
        onSubmitAnalytics: handleSubmitAnalytics,
        step: 'wrap',
        tokenSymbol: nativeSymbol,
        vault,
    });
    const { amountValue, fees, session, simulation } = step;

    useEffect(() => {
        if (!isFocused || !session) {
            return;
        }

        if (session.step === 'approve') {
            navigation.replace(YieldStackRoutes.YieldDepositApproval, route.params);

            return;
        }

        if (session.step === 'action') {
            navigation.replace(YieldStackRoutes.YieldDeposit, route.params);
        }
    }, [isFocused, navigation, route.params, session]);

    const handleCloseInfoBottomSheet = useCallback(() => {
        closeInfoBottomSheet();
        step.reopenPendingBottomSheet();
    }, [closeInfoBottomSheet, step]);

    if (resolutionStatus !== 'resolved' || !isWrappedNativeVault) {
        return null;
    }

    const accountLabel = account.accountLabel ?? getNetwork(account.symbol).name;
    const wrappedTokenSymbol = toTokenSymbol(token.symbol);
    const hasWrappedTokenBalance = isPositiveBalance(token.balance);
    const isReserveRecommended = shouldRecommendWrapReserve(amountValue ?? '', nativeBalance);
    const isSubmitDisabled =
        !step.isAmountReady ||
        !fees.isFeeReady ||
        !step.isStepSessionReady ||
        step.isStepPending ||
        isDepositDisabled ||
        isWrapDisabled;

    return (
        <Screen
            noHorizontalPadding
            header={
                <YieldDepositFlowScreenHeader
                    account={account}
                    closeAction={step.handleClose}
                    onInfoPress={openInfoBottomSheet}
                    title={vaultTokenName}
                    tokenContract={route.params.tokenContract}
                />
            }
            footer={
                <YieldWrappedNativeStepFooter
                    flowType="wrap"
                    isSubmitDisabled={isSubmitDisabled}
                    isSubmitLoading={fees.isFeePreparing}
                    onSkip={
                        hasWrappedTokenBalance && !step.isStepPending ? step.handleSkip : undefined
                    }
                    onSubmit={simulation.handleSubmit}
                    spentSymbol={nativeSymbol}
                />
            }
        >
            <Box pointerEvents={step.isStepPending ? 'none' : 'auto'}>
                <Form form={step.form.form}>
                    <VStack spacing="sp16">
                        <YieldDepositStepCard
                            currentStepId="wrap"
                            hasWrapStep
                            networkSymbol={account.symbol}
                        />

                        <ContextMessage
                            context={Context.getWrappedNative('wrap')}
                            marginHorizontal="sp16"
                        />
                        {isDepositDisabled && (
                            <Box paddingHorizontal="sp16">
                                <YieldDisabledAlert
                                    type="deposit"
                                    content={depositDisabledContent}
                                    variant={depositDisabledVariant}
                                />
                            </Box>
                        )}
                        {isWrapDisabled && (
                            <Box paddingHorizontal="sp16">
                                <YieldDisabledAlert
                                    type="wrap"
                                    content={wrapDisabledContent}
                                    variant={wrapDisabledVariant}
                                />
                            </Box>
                        )}

                        <Box paddingHorizontal="sp16">
                            <WrappedNativeTokenAmountInputCard
                                amountLabel={<Translation id="earn.wrapNativeToken.amountToWrap" />}
                                balance={nativeBalance}
                                maxAmount={getMaxWrapAmount(nativeBalance)}
                                onCurrencyChange={reportCurrencyToggle}
                                onMaxPress={reportMaxSelected}
                                symbol={account.symbol}
                                tokenSymbol={nativeSymbol}
                            />
                        </Box>

                        {step.isAmountReady && (
                            <Box paddingHorizontal="sp16">
                                <YieldWrappedNativeReceivingCard
                                    amount={amountValue ?? '0'}
                                    networkSymbol={account.symbol}
                                    tokenContract={toTokenAddress(token.contractAddress ?? '')}
                                    tokenDecimals={token.decimals}
                                    tokenSymbol={wrappedTokenSymbol}
                                />
                            </Box>
                        )}

                        {isReserveRecommended && (
                            <Box paddingHorizontal="sp16">
                                <BannerFull
                                    intent="info"
                                    title={
                                        <Translation
                                            id="earn.wrapNativeToken.reserveRecommendation"
                                            values={{
                                                amount: WETH_WRAP_GAS_RESERVE.toString(),
                                                nativeSymbol,
                                            }}
                                        />
                                    }
                                />
                            </Box>
                        )}

                        {simulation.isDeviceNotConnectedVisible && (
                            <Box paddingHorizontal="sp16">
                                <BannerFull
                                    intent="critical"
                                    title={
                                        <Translation id="earn.wrapNativeToken.errors.deviceNotConnected" />
                                    }
                                />
                            </Box>
                        )}

                        {simulation.isFirmwareOutdatedVisible && (
                            <Box paddingHorizontal="sp16">
                                <BannerFull
                                    intent="critical"
                                    title={
                                        <Translation id="earn.wrappedNativeToken.firmwareOutdated" />
                                    }
                                />
                            </Box>
                        )}

                        {step.isFeeSectionDisplayed && (
                            <Box paddingHorizontal="sp16">
                                <YieldFeeSection accountKey={account.key} fees={fees} />
                            </Box>
                        )}
                    </VStack>
                </Form>
            </Box>
            {step.pendingTransaction && step.pendingModalProps && (
                <YieldPendingTransactionModal
                    ref={step.pendingBottomSheetRef}
                    accountLabel={accountLabel}
                    accountSymbol={account.symbol}
                    amount={step.pendingTransaction.amount}
                    amountLabel={<Translation id="earn.wrapNativeToken.amountToWrap" />}
                    amountTokenSymbol={nativeSymbol}
                    fee={step.pendingModalProps.fee}
                    isExploreDisabled={step.pendingModalProps.isExploreDisabled}
                    onExplorePress={step.pendingModalProps.onExplorePress}
                    submittedAt={step.pendingModalProps.submittedAt}
                    txid={step.pendingModalProps.txid}
                    title={<Translation id="earn.wrapNativeToken.pendingTransactionTitle" />}
                    vaultName={vaultTokenName}
                    vaultTokenContract={route.params.tokenContract}
                />
            )}
            <YieldDepositInfoBottomSheet
                ref={infoBottomSheetRef}
                apy={apy}
                bonusRewardTokenSymbol={bonusRewardTokenSymbol}
                onClose={handleCloseInfoBottomSheet}
                tokenSymbol={tokenSymbol}
                vaultTokenSymbol={vaultTokenSymbol}
                account={account}
                vault={vault}
                wrappedNativeSymbol={wrappedNativeSymbol}
            />
            {simulation.preparedTx && (
                <YieldTxSimulationBottomSheet
                    ref={simulation.simulationBottomSheetRef}
                    account={account}
                    flow="wrap"
                    onCancel={simulation.handleCancelSimulation}
                    onConfirm={simulation.handleConfirmSimulation}
                    unsignedTx={simulation.preparedTx.unsignedTransaction}
                />
            )}
        </Screen>
    );
};
