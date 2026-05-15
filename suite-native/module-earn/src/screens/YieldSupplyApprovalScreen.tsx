import { useCallback, useEffect } from 'react';

import { type RouteProp, useIsFocused, useNavigation, useRoute } from '@react-navigation/native';

import { getNetwork } from '@suite-common/wallet-config';
import { splitYieldPendingTransaction } from '@suite-common/wallet-core';
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

import { ApproveSupplyForm } from '../components/ApproveSupplyForm';
import { YieldPendingTransactionModal } from '../components/YieldPendingTransactionModal';
import { YieldSupplyApprovalLimitBottomSheet } from '../components/YieldSupplyApprovalLimitBottomSheet';
import { YieldSupplyFlowFooter } from '../components/YieldSupplyFlowFooter';
import { YieldSupplyFlowScreenHeader } from '../components/YieldSupplyFlowScreenHeader';
import { YieldSupplyInfoBottomSheet } from '../components/YieldSupplyInfoBottomSheet';
import { useResolvedYieldFlowData } from '../hooks/useResolvedYieldFlowData';
import { useShowYieldTransactionFailureAlert } from '../hooks/useShowYieldTransactionFailureAlert';
import { useYieldApprovalFees } from '../hooks/useYieldApprovalFees';
import { useYieldApprovalLimit } from '../hooks/useYieldApprovalLimit';
import { useYieldApprovalPendingTransactionTracking } from '../hooks/useYieldApprovalPendingTransactionTracking';
import { useYieldSession } from '../hooks/useYieldSession';
import { useYieldSupplyApprovalSubmit } from '../hooks/useYieldSupplyApprovalSubmit';
import { useYieldSupplyForm } from '../hooks/useYieldSupplyForm';

type RouteProps = RouteProp<YieldStackParamList, YieldStackRoutes.YieldSupplyApproval>;
type NavigationProps = StackNavigationProps<
    YieldStackParamList,
    YieldStackRoutes.YieldSupplyApproval
>;

export const YieldSupplyApprovalScreen = () => {
    const route = useRoute<RouteProps>();
    const navigation = useNavigation<NavigationProps>();
    const isFocused = useIsFocused();
    const { approvalLimitTitle, approvalLimitType, setApprovalLimitType } = useYieldApprovalLimit();
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
    const sessionStep = session?.step;
    const pendingTransaction = session?.action.pendingTransaction ?? null;
    const { approvalPendingTransaction } = splitYieldPendingTransaction(
        pendingTransaction,
        'deposit',
    );

    const isApprovalPending = !!approvalPendingTransaction;

    const supplyForm = useYieldSupplyForm({ token, tokenSymbol });
    const { amountValue, form, handleAmountChange, handleMaxChange, isMaxSelected } = supplyForm;
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
    const { handleSubmitApproval, isCheckingApproval } = useYieldSupplyApprovalSubmit({
        approvalLimitType,
        flowData,
        flowKey,
        routeParams: route.params,
    });
    const isApprovalFeeReady = approvalFeeFormDraft !== undefined;
    const isApprovalSessionReady = sessionStep === 'approve';
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

    const handleApprovalConfirmed = useCallback(() => {
        navigation.navigate(YieldStackRoutes.YieldSupply, route.params);
    }, [navigation, route.params]);

    useYieldApprovalPendingTransactionTracking({
        account,
        approvalPendingTransaction,
        flowKey,
        isApprovalPending,
        isScreenFocused: isFocused,
        onApprovalConfirmed: handleApprovalConfirmed,
        sessionStep,
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
        <Translation id="earn.yieldSupplyFlowScreen.approvalLimitSheet.unlimited.title" />
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
                <YieldSupplyFlowScreenHeader
                    account={account}
                    onInfoPress={openInfoBottomSheet}
                    tokenContract={route.params.tokenContract}
                    vaultName={vault.metadata.name}
                />
            }
            footer={
                <YieldSupplyFlowFooter
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
                    <ApproveSupplyForm
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
                    amountLabel={<Translation id="earn.yieldSupplyFlowScreen.approvalLimit" />}
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
            <YieldSupplyInfoBottomSheet
                ref={infoBottomSheetRef}
                apy={apy}
                onClose={handleCloseInfoBottomSheet}
                tokenSymbol={tokenSymbol}
                vaultTokenName={vaultTokenName}
            />
            <YieldSupplyApprovalLimitBottomSheet
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
