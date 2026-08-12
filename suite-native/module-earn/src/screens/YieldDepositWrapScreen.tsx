import { useCallback, useEffect } from 'react';
import { useDispatch } from 'react-redux';

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
    stablecoinYieldActions,
} from '@suite-common/wallet-core';
import { toTokenAddress, toTokenSymbol } from '@suite-common/wallet-types';
import { isPositiveBalance } from '@suite-common/wallet-utils';
import { selectNativeAnalyticsDep } from '@suite-native/analytics';
import { Box, FullAlertBox, VStack, useBottomSheetModal } from '@suite-native/atoms';
import { Form } from '@suite-native/forms';
import { Translation } from '@suite-native/intl';
import { ContextMessage } from '@suite-native/message-system';
import {
    Screen,
    type StackNavigationProps,
    type YieldStackParamList,
    YieldStackRoutes,
    useNavigateToInitialScreen,
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
import { useShowYieldTransactionFailureAlert } from '../hooks/useShowYieldTransactionFailureAlert';
import {
    type PreparedWrappedNativeTokenAction,
    useWrappedNativeTokenFees,
} from '../hooks/useWrappedNativeTokenFees';
import { useWrappedNativeTokenForm } from '../hooks/useWrappedNativeTokenForm';
import { useWrappedNativeTxSimulation } from '../hooks/useWrappedNativeTxSimulation';
import { useYieldCurrencyToggleAnalytics } from '../hooks/useYieldCurrencyToggleAnalytics';
import { useYieldPendingTransaction } from '../hooks/useYieldPendingTransaction';
import { useYieldPendingTransactionTracking } from '../hooks/useYieldPendingTransactionTracking';
import { useYieldSession } from '../hooks/useYieldSession';

type RouteProps = RouteProp<YieldStackParamList, YieldStackRoutes.YieldDepositWrap>;
type NavigationProps = StackNavigationProps<YieldStackParamList, YieldStackRoutes.YieldDepositWrap>;

export const YieldDepositWrapScreen = () => {
    const route = useRoute<RouteProps>();
    const navigation = useNavigation<NavigationProps>();
    const dispatch = useDispatch();
    const isFocused = useIsFocused();
    const navigateToInitialScreen = useNavigateToInitialScreen();
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

    const session = useYieldSession({
        flowKey,
        flowType: 'deposit',
        isWrappedNativeVault,
        shouldDisposeOnGoBack: true,
    });
    const isWrapSessionReady = session?.step === 'wrap';

    const nativeSymbol = toTokenSymbol(account ? getNetworkDisplaySymbol(account.symbol) : '');
    const nativeBalance = account?.formattedBalance ?? '0';

    const form = useWrappedNativeTokenForm({
        availableBalance: nativeBalance,
        decimals: account ? getNetwork(account.symbol).decimals : 0,
        tokenSymbol: nativeSymbol,
    });
    const { amountValue } = form;
    const {
        formState: { isValid },
    } = form.form;

    const {
        pendingBottomSheetRef,
        pendingModalProps,
        pendingTransaction: wrapPendingTransaction,
        reopenPendingBottomSheet,
    } = useYieldPendingTransaction({
        accountKey: account?.key,
        isFocused,
        pendingTransaction: session?.action.pendingTransaction,
        transactionType: 'wrap',
    });
    const isWrapPending = !!wrapPendingTransaction;
    const isWrapAmountReady = isValid && !!amountValue;
    const isFeeSectionDisplayed = isWrapAmountReady && !isWrapPending;

    const wrapFee = useWrappedNativeTokenFees({
        account: account ?? null,
        amount: amountValue,
        flowType: 'wrap',
        isEnabled: isFeeSectionDisplayed && isWrapSessionReady,
    });

    useShowYieldTransactionFailureAlert({
        error: session?.error,
        flowKey,
        flowType: 'deposit',
        isEnabled: isFocused,
    });

    useYieldPendingTransactionTracking({
        account,
        flowKey,
        flowType: 'deposit',
        isScreenFocused: isFocused,
        pendingTransaction: wrapPendingTransaction,
        vault,
    });

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

    const handleSkip = useCallback(() => {
        if (!flowKey || isWrapPending) {
            return;
        }

        analytics.report({
            type: events.yieldDepositEvent.name,
            payload: {
                action: 'cancel',
                type: 'wrap',
                networkSymbol: account?.symbol,
                vaultId: vault?.id,
            },
        });

        dispatch(
            stablecoinYieldActions.resolveWrappedNativeStep({
                flowType: 'deposit',
                flowKey,
                step: 'wrap',
            }),
        );
    }, [account?.symbol, analytics, dispatch, flowKey, isWrapPending, vault?.id]);

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

    const handleSimulationConfirmed = useCallback(
        (preparedWrap: PreparedWrappedNativeTokenAction) => {
            if (!flowKey) {
                return;
            }

            dispatch(
                stablecoinYieldActions.storeWrappedNativeReviewData({
                    flowType: 'deposit',
                    flowKey,
                    step: 'wrap',
                    amount: preparedWrap.amount,
                    unsignedTransaction: preparedWrap.unsignedTransaction,
                }),
            );
            navigation.navigate(YieldStackRoutes.YieldDepositWrapReview, route.params);
        },
        [dispatch, flowKey, navigation, route.params],
    );

    const simulation = useWrappedNativeTxSimulation({
        amountValue,
        isDisabled: isWrapDisabled || isDepositDisabled,
        onConfirm: handleSimulationConfirmed,
        onSubmit: handleSubmitAnalytics,
        preparedAction: wrapFee.preparedAction,
    });

    const handleClose = useCallback(() => {
        const isWrapRemovedByPopToTop = navigation.getState().routes.length > 1;

        navigateToInitialScreen();

        if (!isWrapRemovedByPopToTop || !flowKey || isWrapPending) {
            return;
        }

        dispatch(stablecoinYieldActions.disposeSession({ flowType: 'deposit', flowKey }));
    }, [dispatch, flowKey, isWrapPending, navigateToInitialScreen, navigation]);

    const handleCloseInfoBottomSheet = useCallback(() => {
        closeInfoBottomSheet();
        reopenPendingBottomSheet();
    }, [closeInfoBottomSheet, reopenPendingBottomSheet]);

    if (resolutionStatus !== 'resolved' || !isWrappedNativeVault) {
        return null;
    }

    const accountLabel = account.accountLabel ?? getNetwork(account.symbol).name;
    const wrappedTokenSymbol = toTokenSymbol(token.symbol);
    const hasWrappedTokenBalance = isPositiveBalance(token.balance);
    const isReserveRecommended = shouldRecommendWrapReserve(amountValue ?? '', nativeBalance);
    const isSubmitDisabled =
        !isWrapAmountReady ||
        !wrapFee.isFeeReady ||
        !isWrapSessionReady ||
        isWrapPending ||
        isDepositDisabled ||
        isWrapDisabled;

    return (
        <Screen
            noHorizontalPadding
            header={
                <YieldDepositFlowScreenHeader
                    account={account}
                    closeAction={handleClose}
                    onInfoPress={openInfoBottomSheet}
                    title={vaultTokenName}
                    tokenContract={route.params.tokenContract}
                />
            }
            footer={
                <YieldWrappedNativeStepFooter
                    flowType="wrap"
                    isSubmitDisabled={isSubmitDisabled}
                    onSkip={hasWrappedTokenBalance && !isWrapPending ? handleSkip : undefined}
                    onSubmit={simulation.handleSubmit}
                    spentSymbol={nativeSymbol}
                />
            }
        >
            <Box pointerEvents={isWrapPending ? 'none' : 'auto'}>
                <Form form={form.form}>
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

                        {isWrapAmountReady && (
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
                                <FullAlertBox
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
                                <FullAlertBox
                                    intent="critical"
                                    title={
                                        <Translation id="earn.wrapNativeToken.errors.deviceNotConnected" />
                                    }
                                />
                            </Box>
                        )}

                        {simulation.isFirmwareOutdatedVisible && (
                            <Box paddingHorizontal="sp16">
                                <FullAlertBox
                                    intent="critical"
                                    title={
                                        <Translation id="earn.wrappedNativeToken.firmwareOutdated" />
                                    }
                                />
                            </Box>
                        )}

                        {isFeeSectionDisplayed && (
                            <Box paddingHorizontal="sp16">
                                <YieldFeeSection accountKey={account.key} fees={wrapFee} />
                            </Box>
                        )}
                    </VStack>
                </Form>
            </Box>
            {wrapPendingTransaction && pendingModalProps && (
                <YieldPendingTransactionModal
                    ref={pendingBottomSheetRef}
                    accountLabel={accountLabel}
                    accountSymbol={account.symbol}
                    amount={wrapPendingTransaction.amount}
                    amountLabel={<Translation id="earn.wrapNativeToken.amountToWrap" />}
                    amountTokenSymbol={nativeSymbol}
                    fee={pendingModalProps.fee}
                    isExploreDisabled={pendingModalProps.isExploreDisabled}
                    onExplorePress={pendingModalProps.onExplorePress}
                    submittedAt={pendingModalProps.submittedAt}
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
