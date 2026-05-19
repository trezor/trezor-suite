import { useCallback, useEffect } from 'react';
import { useDispatch } from 'react-redux';

import { type RouteProp, useIsFocused, useNavigation, useRoute } from '@react-navigation/native';

import { getNetwork } from '@suite-common/wallet-config';
import { initYieldAllowanceThunk, splitYieldPendingTransaction } from '@suite-common/wallet-core';
import { Box, useBottomSheetModal } from '@suite-native/atoms';
import { Form } from '@suite-native/forms';
import { Translation } from '@suite-native/intl';
import {
    Screen,
    type StackNavigationProps,
    type YieldStackParamList,
    YieldStackRoutes,
} from '@suite-native/navigation';
import { FeeSelector, useTransactionDetails } from '@suite-native/transaction-management';

import { ApproveDepositForm } from '../components/ApproveDepositForm';
import { YieldDepositApprovalLimitBottomSheet } from '../components/YieldDepositApprovalLimitBottomSheet';
import { YieldDepositFlowFooter } from '../components/YieldDepositFlowFooter';
import { YieldDepositFlowScreenHeader } from '../components/YieldDepositFlowScreenHeader';
import { YieldDepositInfoBottomSheet } from '../components/YieldDepositInfoBottomSheet';
import { YieldPendingTransactionModal } from '../components/YieldPendingTransactionModal';
import { useResolvedYieldFlowData } from '../hooks/useResolvedYieldFlowData';
import { useShowYieldTransactionFailureAlert } from '../hooks/useShowYieldTransactionFailureAlert';
import { useYieldApprovalFees } from '../hooks/useYieldApprovalFees';
import { useYieldApprovalLimit } from '../hooks/useYieldApprovalLimit';
import { useYieldDepositApprovalSubmit } from '../hooks/useYieldDepositApprovalSubmit';
import { useYieldDepositForm } from '../hooks/useYieldDepositForm';
import { useYieldPendingTransactionTracking } from '../hooks/useYieldPendingTransactionTracking';
import { useYieldSession } from '../hooks/useYieldSession';
import { isYieldApprovalAllowanceUnlimited } from '../yieldApprovalUtils';

type RouteProps = RouteProp<YieldStackParamList, YieldStackRoutes.YieldDepositApproval>;
type NavigationProps = StackNavigationProps<
    YieldStackParamList,
    YieldStackRoutes.YieldDepositApproval
>;

export const YieldDepositApprovalScreen = () => {
    const route = useRoute<RouteProps>();
    const navigation = useNavigation<NavigationProps>();
    const dispatch = useDispatch();
    const isFocused = useIsFocused();
    const {
        bottomSheetRef: infoBottomSheetRef,
        closeModal: closeInfoBottomSheet,
        openModal: openInfoBottomSheet,
    } = useBottomSheetModal();
    const {
        bottomSheetRef: approvalLimitBottomSheetRef,
        closeModal: closeApprovalLimitBottomSheet,
        openModal: openApprovalLimitBottomSheet,
    } = useBottomSheetModal();
    const {
        bottomSheetRef: pendingBottomSheetRef,
        closeModal: closePendingBottomSheet,
        openModal: openPendingBottomSheet,
    } = useBottomSheetModal();
    const {
        account,
        flowData,
        apy,
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
        shouldDisposeOnGoBack: true,
    });
    const isAllowanceAmountUnlimited = isYieldApprovalAllowanceUnlimited({ session, token });
    const defaultApprovalLimitType = isAllowanceAmountUnlimited ? 'unlimited' : 'per-deposit';
    const { approvalLimitTitle, approvalLimitType, setApprovalLimitType } =
        useYieldApprovalLimit(defaultApprovalLimitType);
    const sessionStep = session?.step;
    const allowanceStatus = session?.approval.allowanceStatus;
    const pendingTransaction = session?.action.pendingTransaction ?? null;
    const { approvalPendingTransaction } = splitYieldPendingTransaction(
        pendingTransaction,
        'deposit',
    );

    const isApprovalPending = !!approvalPendingTransaction;

    const depositForm = useYieldDepositForm({
        defaultAmount: session?.approval.isModifyMode ? session.action.amount : undefined,
        token,
        tokenSymbol,
    });
    const { amountValue, form, handleAmountChange, handleMaxChange, isMaxSelected } = depositForm;
    const {
        formState: { isValid },
    } = form;
    const {
        formDraft: approvalFeeFormDraft,
        formDraftKey: approvalFeeFormDraftKey,
        isComposingApprovalFee,
        isFeeUnavailable,
        selectedFee: selectedApprovalFee,
        updateFeeLevelThunk: updateApprovalFeeLevelThunk,
    } = useYieldApprovalFees({
        amount: amountValue,
        approvalLimitType,
        flowKey,
        isEnabled: isValid,
        flowData,
        tokenContract: route.params.tokenContract,
    });
    const { handleSubmitApproval, isCheckingApproval } = useYieldDepositApprovalSubmit({
        approvalLimitType,
        flowData,
        flowKey,
        routeParams: route.params,
    });
    const isApprovalFeeReady = approvalFeeFormDraft !== undefined;
    const isApprovalSessionReady = sessionStep === 'approve';
    const shouldRefreshAllowance = resolutionStatus === 'resolved' && allowanceStatus === 'idle';
    const isSubmitDisabled =
        isApprovalPending ||
        !isValid ||
        !isApprovalFeeReady ||
        isComposingApprovalFee ||
        isCheckingApproval ||
        isFeeUnavailable ||
        !isApprovalSessionReady;
    const pendingModalData = isApprovalPending ? approvalPendingTransaction : null;
    const isPendingModalVisible = !!pendingModalData;
    const { explorerUrl, openInBlockchain } = useTransactionDetails({
        accountKey: account?.key ?? null,
        txid: approvalPendingTransaction?.txid ?? null,
    });

    useShowYieldTransactionFailureAlert({
        error: session?.error,
        flowKey,
        flowType: 'deposit',
        isEnabled: isFocused,
    });

    useEffect(() => {
        if (shouldRefreshAllowance) {
            void dispatch(
                initYieldAllowanceThunk({
                    flowData,
                    flowKey,
                    flowType: 'deposit',
                    // Mobile approval screen needs allowance without auto-skipping to deposit.
                    shouldSkipApprovalStep: false,
                }),
            );
        }
    }, [dispatch, flowData, flowKey, shouldRefreshAllowance]);

    const handleApprovalConfirmed = useCallback(() => {
        navigation.navigate(YieldStackRoutes.YieldDeposit, route.params);
    }, [navigation, route.params]);

    useYieldPendingTransactionTracking({
        account,
        flowKey,
        flowType: 'deposit',
        isScreenFocused: isFocused,
        onApprovalConfirmed: handleApprovalConfirmed,
        pendingTransaction: approvalPendingTransaction,
    });

    const handleCloseInfoBottomSheet = useCallback(() => {
        closeInfoBottomSheet();

        if (isPendingModalVisible) {
            requestAnimationFrame(openPendingBottomSheet);
        }
    }, [closeInfoBottomSheet, isPendingModalVisible, openPendingBottomSheet]);

    useEffect(() => {
        if (!isFocused || !isPendingModalVisible) {
            closePendingBottomSheet();

            return;
        }

        openPendingBottomSheet();
    }, [closePendingBottomSheet, isFocused, isPendingModalVisible, openPendingBottomSheet]);

    const handleSubmit = form.handleSubmit(async ({ amount }) => {
        if (!isApprovalFeeReady || isComposingApprovalFee || !isApprovalSessionReady) {
            return;
        }

        await handleSubmitApproval(amount);
    });

    if (resolutionStatus !== 'resolved') {
        return null;
    }

    const accountLabel = account.accountLabel ?? getNetwork(account.symbol).name;
    const pendingModalAmount = pendingModalData?.isAmountUnlimited ? (
        <Translation id="earn.yieldDepositFlowScreen.approvalLimitSheet.unlimited.title" />
    ) : (
        pendingModalData?.amount
    );
    const pendingModalAmountTokenSymbol = pendingModalData?.isAmountUnlimited
        ? undefined
        : tokenSymbol;

    return (
        <Screen
            noHorizontalPadding
            header={
                <YieldDepositFlowScreenHeader
                    account={account}
                    onInfoPress={openInfoBottomSheet}
                    tokenContract={route.params.tokenContract}
                    vaultName={vault.metadata.name}
                />
            }
            footer={
                <YieldDepositFlowFooter
                    amountValue={amountValue}
                    apy={apy}
                    isDisabled={isSubmitDisabled}
                    isLoading={isCheckingApproval}
                    onPress={handleSubmit}
                    tokenSymbol={tokenSymbol}
                />
            }
        >
            <Box pointerEvents={isApprovalPending ? 'none' : 'auto'}>
                <Form form={form}>
                    {/* TODO: Allow changing unlimited approval once revoke is supported on mobile. */}
                    <ApproveDepositForm
                        approvalLimitTitle={approvalLimitTitle}
                        balance={token.balance}
                        feeSelector={
                            <FeeSelector
                                accountKey={account.key}
                                tokenContract={route.params.tokenContract}
                                updateThunk={updateApprovalFeeLevelThunk}
                                selectedFee={selectedApprovalFee}
                                selectedFeePerUnit={approvalFeeFormDraft?.feePerUnit}
                                formDraft={approvalFeeFormDraft}
                                formDraftKey={approvalFeeFormDraftKey}
                            />
                        }
                        isApprovalLimitDisabled={isAllowanceAmountUnlimited}
                        isMaxSelected={isMaxSelected}
                        onAmountChange={handleAmountChange}
                        onApprovalLimitPress={openApprovalLimitBottomSheet}
                        onMaxChange={handleMaxChange}
                        tokenSymbol={tokenSymbol}
                    />
                </Form>
            </Box>
            {pendingModalData && (
                <YieldPendingTransactionModal
                    ref={pendingBottomSheetRef}
                    accountLabel={accountLabel}
                    accountSymbol={account.symbol}
                    amount={pendingModalAmount}
                    amountLabel={<Translation id="earn.yieldDepositFlowScreen.approvalLimit" />}
                    amountTokenContract={route.params.tokenContract}
                    amountTokenSymbol={pendingModalAmountTokenSymbol}
                    fee={pendingModalData.fee}
                    isExploreDisabled={!explorerUrl}
                    onExplorePress={openInBlockchain}
                    submittedAt={new Date(pendingModalData.submittedAt ?? 0)}
                    title={
                        <Translation id="moduleTrading.tradingConfirmationScreen.approveTitle" />
                    }
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
            <YieldDepositApprovalLimitBottomSheet
                ref={approvalLimitBottomSheetRef}
                accountSymbol={account.symbol}
                onApprovalLimitSelect={setApprovalLimitType}
                onClose={closeApprovalLimitBottomSheet}
                selectedApprovalLimitType={approvalLimitType}
                tokenContract={route.params.tokenContract}
                tokenSymbol={tokenSymbol}
            />
        </Screen>
    );
};
