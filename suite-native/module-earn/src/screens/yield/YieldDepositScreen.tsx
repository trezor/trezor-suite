import { useCallback, useEffect, useState } from 'react';

import {
    type RouteProp,
    StackActions,
    useIsFocused,
    useNavigation,
    useRoute,
} from '@react-navigation/native';

import { events } from '@suite-common/analytics';
import { useServices } from '@suite-common/dependency-injection';
import { Context } from '@suite-common/message-system';
import { useDispatch } from '@suite-common/redux-utils';
import { getNetwork } from '@suite-common/wallet-config';
import { getYieldVaultContractAddress, yieldActions } from '@suite-common/wallet-core';
import { getApyBreakdown } from '@suite-common/wallet-utils';
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
    useNavigateToInitialScreen,
} from '@suite-native/navigation';
import { BigNumber } from '@trezor/utils';

import { YieldAmountInputCard } from '../../components/yield/YieldAmountInputCard';
import { YieldDepositApprovedAmountCard } from '../../components/yield/YieldDepositApprovedAmountCard';
import { YieldDepositFlowFooter } from '../../components/yield/YieldDepositFlowFooter';
import { YieldDepositFlowScreenHeader } from '../../components/yield/YieldDepositFlowScreenHeader';
import { YieldDepositInfoBottomSheet } from '../../components/yield/YieldDepositInfoBottomSheet';
import { YieldDepositStepCard } from '../../components/yield/YieldDepositStepCard';
import { YieldDisabledAlert } from '../../components/yield/YieldDisabledAlert';
import { YieldFeeSection } from '../../components/yield/YieldFeeSection';
import { YieldPendingTransactionModal } from '../../components/yield/YieldPendingTransactionModal';
import { YieldTxSimulationBottomSheet } from '../../components/yield/YieldTxSimulationBottomSheet';
import { useNavigateBackAnalytics } from '../../hooks/earn/useNavigateBackAnalytics';
import { useMessageSystemYield } from '../../hooks/yield/useMessageSystemYield';
import { useRefreshYieldDepositAllowanceOnIdle } from '../../hooks/yield/useRefreshYieldDepositAllowanceOnIdle';
import { useReturnToYieldDepositWrapStep } from '../../hooks/yield/useReturnToYieldDepositWrapStep';
import { useShowYieldTransactionFailureAlert } from '../../hooks/yield/useShowYieldTransactionFailureAlert';
import { useYieldApprovedAmountDisplay } from '../../hooks/yield/useYieldApprovedAmountDisplay';
import { useYieldCurrencyToggleAnalytics } from '../../hooks/yield/useYieldCurrencyToggleAnalytics';
import {
    type PreparedYieldDepositAction,
    useYieldDepositFees,
} from '../../hooks/yield/useYieldDepositFees';
import { useYieldDepositForm } from '../../hooks/yield/useYieldDepositForm';
import { useYieldDepositSubmit } from '../../hooks/yield/useYieldDepositSubmit';
import { useYieldFlowData } from '../../hooks/yield/useYieldFlowData';
import { useYieldPendingTransaction } from '../../hooks/yield/useYieldPendingTransaction';
import { useYieldPendingTransactionTracking } from '../../hooks/yield/useYieldPendingTransactionTracking';
import { useYieldSession } from '../../hooks/yield/useYieldSession';
import { isYieldApprovalAllowanceUnlimited } from '../../utils/yield/yieldApprovalUtils';
import { getYieldTokenContract } from '../../utils/yield/yieldFiatAmountUtils';

type RouteProps = RouteProp<YieldStackParamList, YieldStackRoutes.YieldDeposit>;
type NavigationProps = StackNavigationProps<YieldStackParamList, YieldStackRoutes.YieldDeposit>;

export const YieldDepositScreen = () => {
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
    } = useBottomSheetModal({ isNestedSheet: true });

    const {
        bottomSheetRef: simulationBottomSheetRef,
        closeModal: closeSimulationBottomSheet,
        openModal: openSimulationBottomSheet,
    } = useBottomSheetModal();

    const [simulationPreparedAction, setSimulationPreparedAction] =
        useState<PreparedYieldDepositAction | null>(null);

    const yieldFlowData = useYieldFlowData(route.params);

    const {
        account,
        apy,
        bonusRewardTokenSymbol,
        flowData,
        flowKey,
        token,
        tokenSymbol,
        vault,
        vaultTokenSymbol,
        vaultTokenName,
        resolutionStatus,
        wrappedNativeSymbol,
    } = yieldFlowData;

    const vaultContractAddress = vault ? getYieldVaultContractAddress(vault) : undefined;
    const {
        isDisabled: isDepositDisabled,
        content: depositDisabledContent,
        variant: depositDisabledVariant,
    } = useMessageSystemYield('deposit', { vaultContractAddress });

    useNavigateBackAnalytics({
        type: events.yieldNavigateEvent.name,
        payload: {
            action: 'cancel',
            from: 'deposit-form',
            to: 'deposit-form',
            networkSymbol: account?.symbol,
            vaultId: yieldFlowData.vault?.id,
        },
    });

    const session = useYieldSession({
        flowKey,
        flowType: 'deposit',
        isWrappedNativeVault: yieldFlowData.isWrappedNativeVault,
    });
    const depositAmount = session?.action.amount;
    const allowanceAmount = session?.approval.allowanceAmount;
    const allowanceStatus = session?.approval.allowanceStatus;
    const {
        pendingBottomSheetRef,
        pendingModalProps,
        pendingTransaction: actionPendingTransaction,
    } = useYieldPendingTransaction({
        accountKey: account?.key,
        isFocused,
        pendingTransaction: session?.action.pendingTransaction,
        transactionType: 'deposit',
    });
    const isDepositPending = !!actionPendingTransaction;
    const isActionSubmitting = session?.action.isSubmitting ?? false;
    const isApprovedAmountUnlimited = isYieldApprovalAllowanceUnlimited({ session, token });
    const { formattedApprovedAmount } = useYieldApprovedAmountDisplay({
        allowanceAmount,
        isApprovedAmountUnlimited,
        tokenSymbol,
    });
    const isAllowanceLoaded = allowanceStatus === 'loaded';
    const isDepositSessionReady = session?.step === 'action';
    const depositForm = useYieldDepositForm({
        defaultAmount: depositAmount,
        token,
        tokenSymbol,
        wrappedAmount: session?.result.wrappedAmount,
    });
    const { amountValue, availableBalance, form, handleMaxPress } = depositForm;
    const {
        formState: { isValid },
    } = form;

    const isApprovalInsufficient =
        isAllowanceLoaded &&
        !!amountValue &&
        !isApprovedAmountUnlimited &&
        new BigNumber(amountValue).gt(allowanceAmount ?? '0');
    const isDepositAmountReady = isValid && !!amountValue;

    const canContinueDepositFlow =
        isDepositSessionReady &&
        isAllowanceLoaded &&
        isDepositAmountReady &&
        !isDepositPending &&
        !isActionSubmitting;
    const canPrepareDepositFee = canContinueDepositFlow && !isApprovalInsufficient;

    const depositFee = useYieldDepositFees({
        amount: amountValue,
        flowData,
        flowKey,
        isEnabled: canPrepareDepositFee,
    });
    const isSubmitDisabled =
        !canContinueDepositFlow ||
        isApprovalInsufficient ||
        !depositFee.isDepositFeeReady ||
        isDepositDisabled;

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
        pendingTransaction: actionPendingTransaction,
        vault: yieldFlowData.vault,
    });

    useRefreshYieldDepositAllowanceOnIdle({
        allowanceStatus,
        yieldFlowData,
    });

    const returnToWrapStep = useReturnToYieldDepositWrapStep({
        flowKey,
        routeParams: route.params,
    });

    useEffect(() => {
        if (session?.step === 'complete') {
            navigation.replace(YieldStackRoutes.YieldDepositComplete, route.params);
        }
    }, [navigation, route.params, session?.step]);

    const handleGoBackToApproval = useCallback(() => {
        if (!flowKey || isDepositPending) {
            return;
        }

        analytics.report({
            type: events.yieldDepositEvent.name,
            payload: {
                action: 'continue',
                type: 'modify-allowance',
                networkSymbol: account?.symbol,
                vaultId: yieldFlowData.vault?.id,
            },
        });

        dispatch(
            yieldActions.enterModifyMode({
                flowType: 'deposit',
                flowKey,
                amount: amountValue || undefined,
            }),
        );

        navigation.dispatch(
            StackActions.popTo(YieldStackRoutes.YieldDepositApproval, route.params),
        );
    }, [
        account?.symbol,
        amountValue,
        analytics,
        dispatch,
        flowKey,
        isDepositPending,
        navigation,
        yieldFlowData.vault?.id,
        route.params,
    ]);

    const handleActionReady = useCallback(
        (preparedAction: PreparedYieldDepositAction) => {
            setSimulationPreparedAction(preparedAction);
            requestAnimationFrame(openSimulationBottomSheet);
        },
        [openSimulationBottomSheet],
    );
    const reportSimulationAction = useCallback(
        (action: 'continue' | 'cancel') => {
            analytics.report({
                type: events.yieldDepositEvent.name,
                payload: {
                    action,
                    type: 'tx-simulation-modal',
                    networkSymbol: account?.symbol,
                    vaultId: yieldFlowData.vault?.id,
                },
            });
        },
        [account?.symbol, analytics, yieldFlowData.vault?.id],
    );
    const handleConfirmSimulation = useCallback(() => {
        if (!flowKey || !simulationPreparedAction) {
            return;
        }

        reportSimulationAction('continue');
        dispatch(
            yieldActions.storeActionReviewData({
                amount: simulationPreparedAction.amount,
                flowKey,
                flowType: 'deposit',
                receiptAmount: simulationPreparedAction.receiptAmount,
                unsignedTransaction: simulationPreparedAction.unsignedTransaction,
            }),
        );
        closeSimulationBottomSheet();
        navigation.navigate(YieldStackRoutes.YieldDepositReview, route.params);
    }, [
        closeSimulationBottomSheet,
        dispatch,
        flowKey,
        navigation,
        reportSimulationAction,
        route.params,
        simulationPreparedAction,
    ]);
    const handleCancelSimulation = useCallback(() => {
        reportSimulationAction('cancel');
        closeSimulationBottomSheet();
    }, [closeSimulationBottomSheet, reportSimulationAction]);
    const { handleSubmitDeposit } = useYieldDepositSubmit({
        amount: amountValue,
        onActionReady: handleActionReady,
        preparedAction: depositFee.preparedAction,
    });

    const handleContinue = useCallback(() => {
        if (isSubmitDisabled) {
            return;
        }

        const apyBreakdown = getApyBreakdown(yieldFlowData.vault?.rewardRate?.components);

        analytics.report({
            type: events.yieldDepositEvent.name,
            payload: {
                action: 'continue',
                type: 'deposit',
                networkSymbol: account?.symbol,
                vaultId: yieldFlowData.vault?.id,
                wrappedNative: yieldFlowData.isWrappedNativeVault,
                ...(apyBreakdown && { apyBreakdown }),
            },
        });

        handleSubmitDeposit();
    }, [
        account?.symbol,
        analytics,
        handleSubmitDeposit,
        isSubmitDisabled,
        yieldFlowData.isWrappedNativeVault,
        yieldFlowData.vault,
    ]);

    const handleMaxPressWithAnalytics = useCallback(() => {
        analytics.report({
            type: events.yieldInteractionEvent.name,
            payload: {
                element: 'deposit-max',
                networkSymbol: account?.symbol,
                vaultId: yieldFlowData.vault?.id,
            },
        });

        handleMaxPress();
    }, [account?.symbol, analytics, handleMaxPress, yieldFlowData.vault?.id]);

    const reportCurrencyToggle = useYieldCurrencyToggleAnalytics({
        networkSymbol: account?.symbol,
        vaultId: yieldFlowData.vault?.id,
    });

    const handleOpenInfoBottomSheet = useCallback(() => {
        analytics.report({
            type: events.yieldInteractionEvent.name,
            payload: {
                element: 'in-a-nutshell-process-tab',
                value: 'deposit',
                networkSymbol: account?.symbol,
                vaultId: yieldFlowData.vault?.id,
            },
        });
        openInfoBottomSheet();
    }, [account?.symbol, analytics, openInfoBottomSheet, yieldFlowData.vault?.id]);

    const handleCloseDeposit = useCallback(() => {
        navigateToInitialScreen();

        if (!flowKey || session?.action.pendingTransaction) {
            return;
        }

        dispatch(yieldActions.disposeSession({ flowType: 'deposit', flowKey }));
    }, [dispatch, flowKey, navigateToInitialScreen, session?.action.pendingTransaction]);

    if (resolutionStatus !== 'resolved' || !isDepositSessionReady) {
        return null;
    }

    const accountLabel = account.accountLabel ?? getNetwork(account.symbol).name;
    const shouldShowDepositFee = isValid && !!amountValue && !isApprovalInsufficient;
    // Wrapped-native vault estimates should be displayed as native crypto, so
    // omit token contract to keep EarnEstimatedRewards on the crypto formatter.
    const estimatedRewardsTokenContract = yieldFlowData.isWrappedNativeVault
        ? undefined
        : route.params.tokenContract;

    return (
        <Screen
            noHorizontalPadding
            header={
                <YieldDepositFlowScreenHeader
                    account={account}
                    closeAction={handleCloseDeposit}
                    onInfoPress={handleOpenInfoBottomSheet}
                    title={vaultTokenName}
                    tokenContract={route.params.tokenContract}
                />
            }
            footer={
                <YieldDepositFlowFooter
                    accountKey={account.key}
                    amountValue={amountValue}
                    apy={apy}
                    isDisabled={isSubmitDisabled}
                    isLoading={isActionSubmitting || depositFee.isPreparingDepositFee}
                    networkSymbol={account.symbol}
                    onPress={handleContinue}
                    shouldKeepEstimatedRewardsVisible={isApprovalInsufficient}
                    tokenContract={estimatedRewardsTokenContract}
                />
            }
        >
            <Box pointerEvents={isDepositPending ? 'none' : 'auto'}>
                <VStack spacing="sp16">
                    <ContextMessage
                        context={Context.getEarnYield('deposit')}
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
                    <YieldDepositStepCard
                        currentStepId="deposit"
                        hasWrapStep={yieldFlowData.isWrappedNativeVault}
                        isApprovalStepSkipped={!!session?.approval.isSkipped}
                        isWrapStepSkipped={!session?.result.wrappedAmount}
                        networkSymbol={account.symbol}
                        onEditStep={{
                            wrap: returnToWrapStep,
                            approval: handleGoBackToApproval,
                        }}
                    />

                    <Box paddingHorizontal="sp16">
                        <YieldDepositApprovedAmountCard
                            actionType="edit"
                            approvedAmount={formattedApprovedAmount}
                            isApprovedAmountUnlimited={isApprovedAmountUnlimited}
                            networkSymbol={account.symbol}
                            onActionPress={handleGoBackToApproval}
                            tokenContract={route.params.tokenContract}
                        />
                    </Box>

                    <Box paddingHorizontal="sp16">
                        <Form form={form}>
                            <YieldAmountInputCard
                                amountLabel={
                                    <Translation id="earn.yieldDepositFlowScreen.amountToDeposit" />
                                }
                                balance={availableBalance}
                                onCurrencyChange={reportCurrencyToggle}
                                onMaxPress={handleMaxPressWithAnalytics}
                                symbol={account.symbol}
                                tokenContract={getYieldTokenContract(token)}
                                tokenDecimals={token.decimals}
                                tokenSymbol={tokenSymbol}
                            />
                        </Form>
                    </Box>

                    {isApprovalInsufficient && (
                        <Box paddingHorizontal="sp16">
                            <BannerFull
                                intent="warning"
                                title={
                                    <Translation id="earn.yieldDepositFlowScreen.alerts.approvalTooLow.title" />
                                }
                                primaryButtonLabel={
                                    <Translation id="earn.yieldDepositFlowScreen.alerts.approvalTooLow.primaryButton" />
                                }
                                onPressPrimaryButton={handleGoBackToApproval}
                            />
                        </Box>
                    )}

                    {shouldShowDepositFee && (
                        <Box paddingHorizontal="sp16">
                            <YieldFeeSection
                                accountKey={account.key}
                                fees={depositFee}
                                tokenContract={route.params.tokenContract}
                            />
                        </Box>
                    )}
                </VStack>
            </Box>

            {actionPendingTransaction && pendingModalProps && (
                <YieldPendingTransactionModal
                    ref={pendingBottomSheetRef}
                    accountLabel={accountLabel}
                    accountSymbol={account.symbol}
                    amount={actionPendingTransaction.amount}
                    amountLabel={<Translation id="earn.yieldDepositFlowScreen.amountToDeposit" />}
                    amountTokenContract={route.params.tokenContract}
                    amountTokenSymbol={tokenSymbol}
                    fee={pendingModalProps.fee}
                    isExploreDisabled={pendingModalProps.isExploreDisabled}
                    onExplorePress={pendingModalProps.onExplorePress}
                    submittedAt={pendingModalProps.submittedAt}
                    txid={pendingModalProps.txid}
                    title={<Translation id="earn.yieldDepositFlowScreen.depositPendingTitle" />}
                    vaultName={vaultTokenName}
                    vaultTokenContract={route.params.tokenContract}
                />
            )}

            <YieldDepositInfoBottomSheet
                ref={infoBottomSheetRef}
                apy={apy}
                bonusRewardTokenSymbol={bonusRewardTokenSymbol}
                onClose={closeInfoBottomSheet}
                tokenSymbol={tokenSymbol}
                vaultTokenSymbol={vaultTokenSymbol}
                account={account}
                vault={yieldFlowData.vault}
                wrappedNativeSymbol={wrappedNativeSymbol}
            />
            {simulationPreparedAction && (
                <YieldTxSimulationBottomSheet
                    ref={simulationBottomSheetRef}
                    account={account}
                    flow="deposit"
                    onCancel={handleCancelSimulation}
                    onConfirm={handleConfirmSimulation}
                    unsignedTx={simulationPreparedAction.unsignedTransaction}
                />
            )}
        </Screen>
    );
};
