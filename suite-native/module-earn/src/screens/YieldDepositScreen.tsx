import { useCallback, useEffect, useState } from 'react';
import { useDispatch } from 'react-redux';

import { type RouteProp, useIsFocused, useNavigation, useRoute } from '@react-navigation/native';

import { getNetwork } from '@suite-common/wallet-config';
import { stablecoinYieldActions } from '@suite-common/wallet-core';
import { Box, FullAlertBox, VStack, useBottomSheetModal } from '@suite-native/atoms';
import { Form } from '@suite-native/forms';
import { Translation } from '@suite-native/intl';
import {
    Screen,
    type StackNavigationProps,
    type YieldStackParamList,
    YieldStackRoutes,
    useNavigateToInitialScreen,
} from '@suite-native/navigation';
import { FeeSelector } from '@suite-native/transaction-management';
import { BigNumber } from '@trezor/utils';

import { YieldDepositAmountInputCard } from '../components/YieldDepositAmountInputCard';
import { YieldDepositApprovedAmountCard } from '../components/YieldDepositApprovedAmountCard';
import { YieldDepositFlowFooter } from '../components/YieldDepositFlowFooter';
import { YieldDepositFlowScreenHeader } from '../components/YieldDepositFlowScreenHeader';
import { YieldDepositInfoBottomSheet } from '../components/YieldDepositInfoBottomSheet';
import { YieldDepositStepCard } from '../components/YieldDepositStepCard';
import { YieldPendingTransactionModal } from '../components/YieldPendingTransactionModal';
import { YieldTxSimulationBottomSheet } from '../components/YieldTxSimulationBottomSheet';
import { useRefreshYieldDepositAllowanceOnIdle } from '../hooks/useRefreshYieldDepositAllowanceOnIdle';
import { useResolvedYieldFlowData } from '../hooks/useResolvedYieldFlowData';
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
        flowData,
        flowKey,
        token,
        tokenSymbol,
        vaultTokenSymbol,
        vaultTokenName,
        resolutionStatus,
    } = resolvedFlowData;

    const session = useYieldSession({
        flowKey,
        flowType: 'deposit',
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
        !canContinueDepositFlow || isApprovalInsufficient || !depositFee.isDepositFeeReady;

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
    });

    useRefreshYieldDepositAllowanceOnIdle({
        allowanceStatus,
        resolvedFlowData,
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

        dispatch(
            stablecoinYieldActions.enterModifyMode({
                flowType: 'deposit',
                flowKey,
                amount: amountValue || undefined,
            }),
        );

        navigation.goBack();
    }, [amountValue, dispatch, flowKey, isDepositPending, navigation]);

    const handleActionReady = useCallback(
        (preparedAction: PreparedYieldDepositAction) => {
            setSimulationPreparedAction(preparedAction);
            requestAnimationFrame(openSimulationBottomSheet);
        },
        [openSimulationBottomSheet],
    );
    const handleConfirmSimulation = useCallback(() => {
        if (!flowKey || !simulationPreparedAction) {
            return;
        }

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
        route.params,
        simulationPreparedAction,
    ]);
    const { handleSubmitDeposit } = useYieldDepositSubmit({
        amount: amountValue,
        onActionReady: handleActionReady,
        preparedAction: depositFee.preparedAction,
    });

    const handleContinue = useCallback(() => {
        if (isSubmitDisabled) {
            return;
        }

        handleSubmitDeposit();
    }, [handleSubmitDeposit, isSubmitDisabled]);

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
                    onInfoPress={openInfoBottomSheet}
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
                    <YieldDepositStepCard currentStepIndex={1} />

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
                            <YieldDepositAmountInputCard
                                balance={token.balance}
                                isMaxSelected={isMaxSelected}
                                onAmountChange={handleAmountChange}
                                onMaxChange={handleMaxChange}
                                tokenSymbol={tokenSymbol}
                            />
                        </Form>
                    </Box>

                    {isApprovalInsufficient && (
                        <Box paddingHorizontal="sp16">
                            <FullAlertBox
                                variant="warning"
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
                            <FeeSelector
                                accountKey={account.key}
                                tokenContract={route.params.tokenContract}
                                updateThunk={depositFee.updateFeeLevelThunk}
                                selectedFee={depositFee.selectedFee}
                                selectedFeePerUnit={depositFee.formDraft?.feePerUnit}
                                formDraft={depositFee.formDraft}
                                formDraftKey={depositFee.formDraftKey}
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
                onClose={handleCloseInfoBottomSheet}
                tokenSymbol={tokenSymbol}
                vaultTokenSymbol={vaultTokenSymbol}
            />
            {simulationPreparedAction && (
                <YieldTxSimulationBottomSheet
                    ref={simulationBottomSheetRef}
                    account={account}
                    flow="deposit"
                    onCancel={closeSimulationBottomSheet}
                    onConfirm={handleConfirmSimulation}
                    unsignedTx={simulationPreparedAction.unsignedTransaction}
                />
            )}
        </Screen>
    );
};
