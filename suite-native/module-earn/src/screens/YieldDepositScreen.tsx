import { useCallback, useEffect, useMemo, useState } from 'react';
import { useDispatch } from 'react-redux';

import { type RouteProp, useIsFocused, useNavigation, useRoute } from '@react-navigation/native';

import { useFormatters } from '@suite-common/formatters';
import { getNetwork, getNetworkType } from '@suite-common/wallet-config';
import {
    initYieldAllowanceThunk,
    splitYieldPendingTransaction,
    stablecoinYieldActions,
} from '@suite-common/wallet-core';
import { Box, VStack, useBottomSheetModal } from '@suite-native/atoms';
import { Form } from '@suite-native/forms';
import { Translation } from '@suite-native/intl';
import {
    Screen,
    type StackNavigationProps,
    type YieldStackParamList,
    YieldStackRoutes,
} from '@suite-native/navigation';
import { FeeSummaryCard, useTransactionDetails } from '@suite-native/transaction-management';

import { YieldDepositAmountInputCard } from '../components/YieldDepositAmountInputCard';
import { YieldDepositApprovedAmountCard } from '../components/YieldDepositApprovedAmountCard';
import { YieldDepositFlowFooter } from '../components/YieldDepositFlowFooter';
import { YieldDepositFlowScreenHeader } from '../components/YieldDepositFlowScreenHeader';
import { YieldDepositInfoBottomSheet } from '../components/YieldDepositInfoBottomSheet';
import { YieldDepositStepCard } from '../components/YieldDepositStepCard';
import { YieldDepositTxSimulationBottomSheet } from '../components/YieldDepositTxSimulationBottomSheet';
import { YieldPendingTransactionModal } from '../components/YieldPendingTransactionModal';
import { useResolvedYieldFlowData } from '../hooks/useResolvedYieldFlowData';
import { useShowYieldTransactionFailureAlert } from '../hooks/useShowYieldTransactionFailureAlert';
import { type PreparedYieldDepositAction, useYieldDepositFees } from '../hooks/useYieldDepositFees';
import { useYieldDepositForm } from '../hooks/useYieldDepositForm';
import { useYieldDepositSubmit } from '../hooks/useYieldDepositSubmit';
import { useYieldPendingTransactionTracking } from '../hooks/useYieldPendingTransactionTracking';
import { useYieldSession } from '../hooks/useYieldSession';
import {
    isYieldApprovalAllowanceEnough,
    isYieldApprovalAllowanceUnlimited,
} from '../yieldApprovalUtils';

type RouteProps = RouteProp<YieldStackParamList, YieldStackRoutes.YieldDeposit>;
type NavigationProps = StackNavigationProps<YieldStackParamList, YieldStackRoutes.YieldDeposit>;

export const YieldDepositScreen = () => {
    const route = useRoute<RouteProps>();
    const navigation = useNavigation<NavigationProps>();
    const dispatch = useDispatch();
    const isFocused = useIsFocused();
    const { CryptoAmountFormatter } = useFormatters();

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

    const {
        bottomSheetRef: pendingBottomSheetRef,
        closeModal: closePendingBottomSheet,
        openModal: openPendingBottomSheet,
    } = useBottomSheetModal();

    const [simulationPreparedAction, setSimulationPreparedAction] =
        useState<PreparedYieldDepositAction | null>(null);

    const {
        account,
        apy,
        flowData,
        flowKey,
        token,
        tokenSymbol,
        vault,
        vaultTokenName,
        resolutionStatus,
    } = useResolvedYieldFlowData(route.params);

    const session = useYieldSession({
        flowKey,
        flowType: 'deposit',
    });
    const depositAmount = session?.action.amount;
    const allowanceAmount = session?.approval.allowanceAmount;
    const allowanceStatus = session?.approval.allowanceStatus;
    const pendingTransaction = session?.action.pendingTransaction ?? null;
    const { actionPendingTransaction } = splitYieldPendingTransaction(
        pendingTransaction,
        'deposit',
    );
    const isDepositPending = !!actionPendingTransaction;
    const isActionSubmitting = session?.action.isSubmitting ?? false;
    const isApprovedAmountUnlimited = isYieldApprovalAllowanceUnlimited({ session, token });
    const isAllowanceLoaded = allowanceStatus === 'loaded';
    const isDepositSessionReady = session?.step === 'action' && !!depositAmount;
    const shouldRefreshAllowance = resolutionStatus === 'resolved' && allowanceStatus === 'idle';
    const depositForm = useYieldDepositForm({
        defaultAmount: depositAmount,
        token,
        tokenSymbol,
    });
    const { amountValue, form, handleAmountChange, handleMaxChange, isMaxSelected } = depositForm;
    const {
        formState: { isValid },
    } = form;

    const isApprovalIncreaseRequired =
        isAllowanceLoaded &&
        !isYieldApprovalAllowanceEnough({
            amount: amountValue,
            session,
            token,
        });

    const isSubmitDisabled =
        isDepositPending ||
        !isDepositSessionReady ||
        !isAllowanceLoaded ||
        !isValid ||
        !amountValue ||
        isActionSubmitting;

    const depositFee = useYieldDepositFees({
        amount: amountValue,
        flowData,
        flowKey,
        isEnabled:
            isDepositSessionReady &&
            isAllowanceLoaded &&
            isValid &&
            !isApprovalIncreaseRequired &&
            !isDepositPending,
    });
    const { explorerUrl, openInBlockchain } = useTransactionDetails({
        accountKey: account?.key ?? null,
        txid: actionPendingTransaction?.txid ?? null,
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
        pendingTransaction: actionPendingTransaction,
    });

    useEffect(() => {
        if (shouldRefreshAllowance) {
            void dispatch(
                initYieldAllowanceThunk({
                    flowData,
                    flowKey,
                    flowType: 'deposit',
                    // Mobile deposit screen only refreshes display/guards here.
                    shouldSkipApprovalStep: false,
                }),
            );
        }
    }, [dispatch, flowData, flowKey, shouldRefreshAllowance]);

    useEffect(() => {
        if (session?.step === 'complete') {
            navigation.replace(YieldStackRoutes.YieldDepositComplete, route.params);
        }
    }, [navigation, route.params, session?.step]);

    const formattedApprovedAmount = useMemo(() => {
        if (!allowanceAmount || !tokenSymbol || isApprovedAmountUnlimited) {
            return null;
        }

        return CryptoAmountFormatter.format(allowanceAmount, {
            symbol: tokenSymbol,
            isBalance: true,
            withSymbol: true,
            isEllipsisAppended: false,
            maxDisplayedDecimals: 8,
        });
    }, [CryptoAmountFormatter, isApprovedAmountUnlimited, allowanceAmount, tokenSymbol]);

    const handleEditApproval = useCallback(() => {
        if (!flowKey || isDepositPending) {
            return;
        }

        dispatch(stablecoinYieldActions.enterModifyMode({ flowType: 'deposit', flowKey }));
        navigation.goBack();
    }, [dispatch, flowKey, isDepositPending, navigation]);
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
        flowData,
        flowKey,
        onActionReady: handleActionReady,
        onApprovalRequired: handleEditApproval,
        preparedAction: depositFee.preparedAction,
    });

    const handleContinue = useCallback(() => {
        if (isDepositPending) {
            return;
        }

        if (isApprovalIncreaseRequired) {
            handleEditApproval();

            return;
        }

        void handleSubmitDeposit();
    }, [handleEditApproval, handleSubmitDeposit, isApprovalIncreaseRequired, isDepositPending]);
    const footerTranslationId = isApprovalIncreaseRequired
        ? 'earn.yieldDepositFlowScreen.increaseApprovalLimit'
        : undefined;

    const handleCloseInfoBottomSheet = useCallback(() => {
        closeInfoBottomSheet();

        if (isDepositPending) {
            requestAnimationFrame(openPendingBottomSheet);
        }
    }, [closeInfoBottomSheet, isDepositPending, openPendingBottomSheet]);

    useEffect(() => {
        if (!isFocused || !isDepositPending) {
            closePendingBottomSheet();

            return;
        }

        openPendingBottomSheet();
    }, [closePendingBottomSheet, isFocused, isDepositPending, openPendingBottomSheet]);

    if (resolutionStatus !== 'resolved' || !isDepositSessionReady) {
        return null;
    }

    const networkType = getNetworkType(account.symbol);
    const accountLabel = account.accountLabel ?? getNetwork(account.symbol).name;

    return (
        <Screen
            noHorizontalPadding
            header={
                <YieldDepositFlowScreenHeader
                    account={account}
                    closeAction={handleEditApproval}
                    onInfoPress={openInfoBottomSheet}
                    tokenContract={route.params.tokenContract}
                    vaultName={vault.metadata.name}
                />
            }
            footer={
                <YieldDepositFlowFooter
                    amountValue={amountValue}
                    apy={apy}
                    buttonTranslationId={footerTranslationId}
                    isDisabled={isSubmitDisabled}
                    isLoading={isActionSubmitting}
                    onPress={handleContinue}
                    tokenSymbol={tokenSymbol}
                />
            }
        >
            <Box pointerEvents={isDepositPending ? 'none' : 'auto'}>
                <VStack spacing="sp16">
                    <YieldDepositStepCard currentStepIndex={1} />

                    <Box paddingHorizontal="sp16">
                        <YieldDepositApprovedAmountCard
                            approvedAmount={formattedApprovedAmount}
                            isApprovedAmountUnlimited={isApprovedAmountUnlimited}
                            networkSymbol={account.symbol}
                            onEditApprovalPress={handleEditApproval}
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

                    {!isApprovalIncreaseRequired && (
                        <Box paddingHorizontal="sp16">
                            <FeeSummaryCard
                                fee={depositFee.feePreview?.fee ?? null}
                                symbol={account.symbol}
                                networkType={networkType}
                                areFeesLoading={depositFee.isPreparingDepositFee}
                                testID="@earn/yield-deposit-fee-preview-card"
                            />
                        </Box>
                    )}
                </VStack>
            </Box>

            {actionPendingTransaction && (
                <YieldPendingTransactionModal
                    ref={pendingBottomSheetRef}
                    accountLabel={accountLabel}
                    accountSymbol={account.symbol}
                    amount={actionPendingTransaction.amount}
                    amountLabel={<Translation id="earn.yieldDepositFlowScreen.amountToDeposit" />}
                    amountTokenContract={route.params.tokenContract}
                    amountTokenSymbol={tokenSymbol}
                    fee={actionPendingTransaction.fee}
                    isExploreDisabled={!explorerUrl}
                    onExplorePress={openInBlockchain}
                    submittedAt={new Date(actionPendingTransaction.submittedAt ?? 0)}
                    title={<Translation id="earn.yieldDepositFlowScreen.depositPendingTitle" />}
                    vaultName={vault.metadata.name}
                    vaultTokenContract={route.params.tokenContract}
                />
            )}

            <YieldDepositInfoBottomSheet
                ref={infoBottomSheetRef}
                apy={apy}
                onClose={handleCloseInfoBottomSheet}
                tokenSymbol={tokenSymbol}
                vaultTokenName={vaultTokenName}
            />
            {simulationPreparedAction && (
                <YieldDepositTxSimulationBottomSheet
                    ref={simulationBottomSheetRef}
                    account={account}
                    onCancel={closeSimulationBottomSheet}
                    onConfirm={handleConfirmSimulation}
                    preparedAction={simulationPreparedAction}
                />
            )}
        </Screen>
    );
};
