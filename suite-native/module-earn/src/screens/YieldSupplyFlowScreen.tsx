import { useSelector } from 'react-redux';

import { type RouteProp, useRoute } from '@react-navigation/native';

import {
    type StablecoinYieldRootState,
    selectStablecoinYieldSession,
    splitYieldPendingTransaction,
} from '@suite-common/wallet-core';
import { Box, VStack, useBottomSheetModal } from '@suite-native/atoms';
import { Form } from '@suite-native/forms';
import { Screen, type YieldStackParamList, type YieldStackRoutes } from '@suite-native/navigation';
import { FeeSelector } from '@suite-native/transaction-management';

import { YieldApprovalPendingModal } from '../components/YieldApprovalPendingModal';
import { YieldSupplyAmountInputCard } from '../components/YieldSupplyAmountInputCard';
import { YieldSupplyApprovalLimitBottomSheet } from '../components/YieldSupplyApprovalLimitBottomSheet';
import { YieldSupplyApprovedAmountCard } from '../components/YieldSupplyApprovedAmountCard';
import { YieldSupplyFlowFooter } from '../components/YieldSupplyFlowFooter';
import { YieldSupplyFlowScreenHeader } from '../components/YieldSupplyFlowScreenHeader';
import { YieldSupplyInfoBottomSheet } from '../components/YieldSupplyInfoBottomSheet';
import { YieldSupplyStepCard } from '../components/YieldSupplyStepCard';
import { useResolvedYieldFlowData } from '../hooks/useResolvedYieldFlowData';
import { useYieldApprovalFees } from '../hooks/useYieldApprovalFees';
import { useYieldApprovalLimit } from '../hooks/useYieldApprovalLimit';
import { useYieldApprovalPendingTransactionTracker } from '../hooks/useYieldApprovalPendingTransactionTracker';
import { useYieldSupplyActionSubmit } from '../hooks/useYieldSupplyActionSubmit';
import { useYieldSupplyApprovalSubmit } from '../hooks/useYieldSupplyApprovalSubmit';
import { useYieldSupplyFlowSession } from '../hooks/useYieldSupplyFlowSession';
import { useYieldSupplyForm } from '../hooks/useYieldSupplyForm';

type RouteProps = RouteProp<YieldStackParamList, YieldStackRoutes.YieldSupplyFlow>;

export const YieldSupplyFlowScreen = () => {
    const route = useRoute<RouteProps>();
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
        bottomSheetRef: approvalPendingBottomSheetRef,
        closeModal: closeApprovalPendingBottomSheet,
        openModal: openApprovalPendingBottomSheet,
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

    const supplyForm = useYieldSupplyForm({ token, tokenSymbol });
    const { amountValue, form, handleAmountChange, handleMaxChange, isMaxSelected } = supplyForm;
    const {
        formState: { isValid },
    } = form;
    const stablecoinYieldSession = useSelector((state: StablecoinYieldRootState) =>
        flowKey ? selectStablecoinYieldSession(state, 'supply', flowKey) : undefined,
    );
    const { approvalPendingTransaction } = splitYieldPendingTransaction(
        stablecoinYieldSession?.action.pendingTransaction ?? null,
        'supply',
    );
    const isApprovalPending = approvalPendingTransaction !== undefined;
    const currentStep = stablecoinYieldSession?.step ?? 'approve';
    const isActionStep = currentStep === 'action';
    const approvedAmount = stablecoinYieldSession?.approval.lastApprovedAmount;
    const isApprovedAmountVisible = isActionStep && !!approvedAmount;
    const isApprovalStepLocked = !isActionStep && isApprovalPending;
    const {
        formDraft: approvalFeeFormDraft,
        formDraftKey: approvalFeeFormDraftKey,
        isComposingApprovalFee,
        selectedFee: selectedApprovalFee,
        updateFeeLevelThunk: updateApprovalFeeLevelThunk,
    } = useYieldApprovalFees({
        amount: amountValue,
        approvalLimitType,
        flowKey,
        flowData,
        isEnabled: !isActionStep && isValid && !isApprovalPending,
        tokenContract: route.params.tokenContract,
    });
    const { handleSubmitApproval, isCheckingApproval } = useYieldSupplyApprovalSubmit({
        approvalLimitType,
        flowData,
        flowKey,
        routeParams: route.params,
    });
    const { handleSubmitAction, isPreparingActionReview } = useYieldSupplyActionSubmit({
        flowData,
        flowKey,
        routeParams: route.params,
    });
    const isApprovalFeeReady = approvalFeeFormDraft !== undefined;
    const isSubmitDisabled = isActionStep
        ? isPreparingActionReview
        : !isValid ||
          isApprovalStepLocked ||
          !isApprovalFeeReady ||
          isComposingApprovalFee ||
          isCheckingApproval;
    useYieldSupplyFlowSession(flowKey);

    useYieldApprovalPendingTransactionTracker({
        accountKey: account?.key ?? null,
        flowKey,
        onApprovalPending: openApprovalPendingBottomSheet,
        onApprovalSettled: closeApprovalPendingBottomSheet,
        pendingTransaction: approvalPendingTransaction,
    });

    const handleSubmit = form.handleSubmit(async ({ amount }) => {
        if (isActionStep) {
            await handleSubmitAction(amount);

            return;
        }

        if (isApprovalStepLocked || !isApprovalFeeReady || isComposingApprovalFee) {
            return;
        }

        await handleSubmitApproval(amount);
    });

    if (resolutionStatus !== 'resolved') {
        return null;
    }

    return (
        <Screen
            noHorizontalPadding
            header={
                <YieldSupplyFlowScreenHeader
                    account={account}
                    isDisabled={isApprovalStepLocked}
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
                    isLoading={isActionStep ? isPreparingActionReview : isCheckingApproval}
                    onPress={handleSubmit}
                    tokenSymbol={tokenSymbol}
                />
            }
        >
            <Form form={form}>
                <VStack spacing="sp16">
                    <YieldSupplyStepCard
                        currentStep={currentStep}
                        isDisabled={isApprovalStepLocked}
                    />

                    {isApprovedAmountVisible && (
                        <Box paddingHorizontal="sp16">
                            <YieldSupplyApprovedAmountCard
                                accountSymbol={account.symbol}
                                amount={approvedAmount}
                                tokenContract={route.params.tokenContract}
                                tokenSymbol={tokenSymbol}
                            />
                        </Box>
                    )}

                    <Box paddingHorizontal="sp16">
                        <YieldSupplyAmountInputCard
                            approvalLimitTitle={approvalLimitTitle}
                            balance={token.balance}
                            isApprovalLimitVisible={!isActionStep}
                            isDisabled={isApprovalStepLocked}
                            isMaxSelected={isMaxSelected}
                            onAmountChange={handleAmountChange}
                            onApprovalLimitPress={openApprovalLimitBottomSheet}
                            onMaxChange={handleMaxChange}
                            tokenSymbol={tokenSymbol}
                        />
                    </Box>
                    {!isActionStep && (
                        <Box paddingHorizontal="sp16">
                            <FeeSelector
                                accountKey={account.key}
                                tokenContract={route.params.tokenContract}
                                updateThunk={updateApprovalFeeLevelThunk}
                                selectedFee={selectedApprovalFee}
                                selectedFeePerUnit={approvalFeeFormDraft?.feePerUnit}
                                formDraft={approvalFeeFormDraft}
                                formDraftKey={approvalFeeFormDraftKey}
                                isDisabled={isApprovalStepLocked}
                            />
                        </Box>
                    )}
                </VStack>
            </Form>
            <YieldSupplyInfoBottomSheet
                ref={infoBottomSheetRef}
                apy={apy}
                onClose={closeInfoBottomSheet}
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
            <YieldApprovalPendingModal
                ref={approvalPendingBottomSheetRef}
                account={account}
                pendingTransaction={approvalPendingTransaction}
                tokenContract={route.params.tokenContract}
                tokenSymbol={tokenSymbol}
                vaultName={vault.metadata.name}
            />
        </Screen>
    );
};
