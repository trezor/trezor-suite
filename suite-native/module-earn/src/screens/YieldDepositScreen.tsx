import { useCallback, useEffect, useState } from 'react';
import { useDispatch } from 'react-redux';

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
import { getNetwork } from '@suite-common/wallet-config';
import { getYieldVaultContractAddress, stablecoinYieldActions } from '@suite-common/wallet-core';
import { getApyBreakdown } from '@suite-common/wallet-utils';
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
import { BigNumber } from '@trezor/utils';

import { YieldAmountInputCard } from '../components/YieldAmountInputCard';
import { YieldDepositApprovedAmountCard } from '../components/YieldDepositApprovedAmountCard';
import { YieldDepositFlowFooter } from '../components/YieldDepositFlowFooter';
import { YieldDepositFlowScreenHeader } from '../components/YieldDepositFlowScreenHeader';
import { YieldDepositInfoBottomSheet } from '../components/YieldDepositInfoBottomSheet';
import { YieldDepositStepCard } from '../components/YieldDepositStepCard';
import { YieldDisabledAlert } from '../components/YieldDisabledAlert';
import { YieldFeeSection } from '../components/YieldFeeSection';
import { YieldPendingTransactionModal } from '../components/YieldPendingTransactionModal';
import { YieldTxSimulationBottomSheet } from '../components/YieldTxSimulationBottomSheet';
import { useMessageSystemYield } from '../hooks/useMessageSystemYield';
import { useNavigateBackAnalytics } from '../hooks/useNavigateBackAnalytics';
import { useRefreshYieldDepositAllowanceOnIdle } from '../hooks/useRefreshYieldDepositAllowanceOnIdle';
import { useResolvedYieldFlowData } from '../hooks/useResolvedYieldFlowData';
import { useReturnToYieldDepositWrapStep } from '../hooks/useReturnToYieldDepositWrapStep';
import { useShowYieldTransactionFailureAlert } from '../hooks/useShowYieldTransactionFailureAlert';
import { useYieldApprovedAmountDisplay } from '../hooks/useYieldApprovedAmountDisplay';
import { type PreparedYieldDepositAction, useYieldDepositFees } from '../hooks/useYieldDepositFees';
import { useYieldDepositForm } from '../hooks/useYieldDepositForm';
import { useYieldDepositSubmit } from '../hooks/useYieldDepositSubmit';
import { useYieldPendingTransaction } from '../hooks/useYieldPendingTransaction';
import { useYieldPendingTransactionTracking } from '../hooks/useYieldPendingTransactionTracking';
import { useYieldSession } from '../hooks/useYieldSession';
import { isYieldApprovalAllowanceUnlimited } from '../yieldApprovalUtils';

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
    } = useBottomSheetModal();

    const {
        bottomSheetRef: simulationBottomSheetRef,
        closeModal: closeSimulationBottomSheet,
        openModal: openSimulationBottomSheet,
    } = useBottomSheetModal();

    const [simulationPreparedAction, setSimulationPreparedAction] =
        useState<PreparedYieldDepositAction | null>(null);

    const resolvedFlowData = useResolvedYieldFlowData(route.params);
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
    } = resolvedFlowData;

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
            vaultId: resolvedFlowData.vault?.id,
        },
    });

    const session = useYieldSession({
        flowKey,
        flowType: 'deposit',
        isWrappedNativeVault: resolvedFlowData.isWrappedNativeVault,
    });
    const depositAmount = session?.action.amount;
    const allowanceAmount = session?.approval.allowanceAmount;
    const allowanceStatus = session?.approval.allowanceStatus;
    const {
        pendingBottomSheetRef,
        pendingModalProps,
        pendingTransaction: actionPendingTransaction,
        reopenPendingBottomSheet,
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
    });
    const { amountValue, form, handleAmountChange, handleMaxChange, isMaxSelected } = depositForm;
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
        vault: resolvedFlowData.vault,
    });

    useRefreshYieldDepositAllowanceOnIdle({
        allowanceStatus,
        resolvedFlowData,
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
                vaultId: resolvedFlowData.vault?.id,
            },
        });

        dispatch(
            stablecoinYieldActions.enterModifyMode({
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
        resolvedFlowData.vault?.id,
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
                    vaultId: resolvedFlowData.vault?.id,
                },
            });
        },
        [account?.symbol, analytics, resolvedFlowData.vault?.id],
    );
    const handleConfirmSimulation = useCallback(() => {
        if (!flowKey || !simulationPreparedAction) {
            return;
        }

        reportSimulationAction('continue');
        dispatch(
            stablecoinYieldActions.storeActionReviewData({
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

        const apyBreakdown = getApyBreakdown(resolvedFlowData.vault?.rewardRate?.components);

        analytics.report({
            type: events.yieldDepositEvent.name,
            payload: {
                action: 'continue',
                type: 'deposit',
                networkSymbol: account?.symbol,
                vaultId: resolvedFlowData.vault?.id,
                wrappedNative: resolvedFlowData.isWrappedNativeVault,
                ...(apyBreakdown && { apyBreakdown }),
            },
        });

        handleSubmitDeposit();
    }, [
        account?.symbol,
        analytics,
        handleSubmitDeposit,
        isSubmitDisabled,
        resolvedFlowData.isWrappedNativeVault,
        resolvedFlowData.vault,
    ]);

    const handleMaxChangeWithAnalytics = useCallback(
        (value: boolean) => {
            if (value) {
                analytics.report({
                    type: events.yieldInteractionEvent.name,
                    payload: {
                        element: 'deposit-max',
                        networkSymbol: account?.symbol,
                        vaultId: resolvedFlowData.vault?.id,
                    },
                });
            }

            handleMaxChange(value);
        },
        [account?.symbol, analytics, handleMaxChange, resolvedFlowData.vault?.id],
    );

    const handleOpenInfoBottomSheet = useCallback(() => {
        analytics.report({
            type: events.yieldInteractionEvent.name,
            payload: {
                element: 'in-a-nutshell-process-tab',
                value: 'deposit',
                networkSymbol: account?.symbol,
                vaultId: resolvedFlowData.vault?.id,
            },
        });
        openInfoBottomSheet();
    }, [account?.symbol, analytics, openInfoBottomSheet, resolvedFlowData.vault?.id]);

    const handleCloseInfoBottomSheet = useCallback(() => {
        closeInfoBottomSheet();
        reopenPendingBottomSheet();
    }, [closeInfoBottomSheet, reopenPendingBottomSheet]);
    const handleCloseDeposit = useCallback(() => {
        navigateToInitialScreen();

        if (!flowKey || session?.action.pendingTransaction) {
            return;
        }

        dispatch(stablecoinYieldActions.disposeSession({ flowType: 'deposit', flowKey }));
    }, [dispatch, flowKey, navigateToInitialScreen, session?.action.pendingTransaction]);

    if (resolutionStatus !== 'resolved' || !isDepositSessionReady) {
        return null;
    }

    const accountLabel = account.accountLabel ?? getNetwork(account.symbol).name;
    const shouldShowDepositFee = isValid && !!amountValue && !isApprovalInsufficient;

    return (
        <Screen
            noHorizontalPadding
            header={
                <YieldDepositFlowScreenHeader
                    account={account}
                    closeAction={handleCloseDeposit}
                    onInfoPress={handleOpenInfoBottomSheet}
                    tokenContract={route.params.tokenContract}
                    vaultName={vaultTokenName}
                />
            }
            footer={
                <YieldDepositFlowFooter
                    amountValue={amountValue}
                    apy={apy}
                    isDisabled={isSubmitDisabled}
                    isLoading={isActionSubmitting}
                    onPress={handleContinue}
                    shouldKeepEstimatedRewardsVisible={isApprovalInsufficient}
                    tokenSymbol={tokenSymbol}
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
                        hasWrapStep={resolvedFlowData.isWrappedNativeVault}
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
                                balance={token.balance}
                                isMaxSelected={isMaxSelected}
                                maxLabel={
                                    <Translation id="earn.yieldDepositFlowScreen.depositMax" />
                                }
                                onAmountChange={handleAmountChange}
                                onMaxChange={handleMaxChangeWithAnalytics}
                                tokenSymbol={tokenSymbol}
                            />
                        </Form>
                    </Box>

                    {isApprovalInsufficient && (
                        <Box paddingHorizontal="sp16">
                            <FullAlertBox
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
                    title={<Translation id="earn.yieldDepositFlowScreen.depositPendingTitle" />}
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
                vault={resolvedFlowData.vault}
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
