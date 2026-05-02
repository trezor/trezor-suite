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
import { YieldSupplyFlowFooter } from '../components/YieldSupplyFlowFooter';
import { YieldSupplyFlowScreenHeader } from '../components/YieldSupplyFlowScreenHeader';
import { YieldSupplyInfoBottomSheet } from '../components/YieldSupplyInfoBottomSheet';
import { YieldSupplyStepCard } from '../components/YieldSupplyStepCard';
import { useResolvedYieldFlowData } from '../hooks/useResolvedYieldFlowData';
import { useYieldApprovalFees } from '../hooks/useYieldApprovalFees';
import { useYieldApprovalLimit } from '../hooks/useYieldApprovalLimit';
import { useYieldApprovalPendingTransactionTracker } from '../hooks/useYieldApprovalPendingTransactionTracker';
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
        apy,
        flowData,
        flowKey,
        token,
        tokenSymbol,
        vault,
        vaultTokenName,
        resolutionStatus,
    } = useResolvedYieldFlowData(route.params);
    const supplyForm = useYieldSupplyForm({ token, tokenSymbol: tokenSymbol ?? '' });
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
    const isFlowLocked = isApprovalPending;
    const {
        formDraft: approvalFeeFormDraft,
        formDraftKey: approvalFeeFormDraftKey,
        isComposingApprovalFee,
        selectedFee: selectedApprovalFee,
        updateFeeLevelThunk: updateApprovalFeeLevelThunk,
    } = useYieldApprovalFees({
        amount: amountValue,
        approvalLimitType,
        flowData,
        flowKey,
        isEnabled: isValid && !isFlowLocked,
        tokenContract: route.params.tokenContract,
    });
    const { handleSubmitApproval, isCheckingApproval } = useYieldSupplyApprovalSubmit({
        approvalLimitType,
        flowData,
        flowKey,
        routeParams: route.params,
    });
    const isApprovalFeeReady = approvalFeeFormDraft !== undefined;

    useYieldSupplyFlowSession(flowKey);

    useYieldApprovalPendingTransactionTracker({
        accountKey: account?.key ?? null,
        flowKey,
        onApprovalPending: openApprovalPendingBottomSheet,
        onApprovalSettled: closeApprovalPendingBottomSheet,
        pendingTransaction: approvalPendingTransaction,
    });

    const handleSubmit = form.handleSubmit(async ({ amount }) => {
        if (isFlowLocked || !isApprovalFeeReady || isComposingApprovalFee) {
            return;
        }

        await handleSubmitApproval(amount);
    });

    if (
        resolutionStatus !== 'resolved' ||
        !vault ||
        !account ||
        !token ||
        !tokenSymbol ||
        !flowData ||
        !flowKey ||
        !vaultTokenName
    ) {
        return null;
    }

    return (
        <Screen
            noHorizontalPadding
            header={
                <YieldSupplyFlowScreenHeader
                    account={account}
                    isDisabled={isFlowLocked}
                    onInfoPress={openInfoBottomSheet}
                    tokenContract={route.params.tokenContract}
                    vaultName={vault.metadata.name}
                />
            }
            footer={
                <YieldSupplyFlowFooter
                    amountValue={amountValue}
                    apy={apy}
                    isDisabled={
                        !isValid ||
                        !isApprovalFeeReady ||
                        isComposingApprovalFee ||
                        isCheckingApproval ||
                        isFlowLocked
                    }
                    isLoading={isCheckingApproval}
                    onPress={handleSubmit}
                    tokenSymbol={tokenSymbol}
                />
            }
        >
            <Form form={form}>
                <VStack spacing="sp16">
                    <YieldSupplyStepCard isDisabled={isFlowLocked} />

                    <Box paddingHorizontal="sp16">
                        <YieldSupplyAmountInputCard
                            approvalLimitTitle={approvalLimitTitle}
                            balance={token.balance}
                            isDisabled={isFlowLocked}
                            isMaxSelected={isMaxSelected}
                            onAmountChange={handleAmountChange}
                            onApprovalLimitPress={openApprovalLimitBottomSheet}
                            onMaxChange={handleMaxChange}
                            tokenSymbol={tokenSymbol}
                        />
                    </Box>
                    <Box paddingHorizontal="sp16">
                        <FeeSelector
                            accountKey={account.key}
                            tokenContract={route.params.tokenContract}
                            updateThunk={updateApprovalFeeLevelThunk}
                            selectedFee={selectedApprovalFee}
                            selectedFeePerUnit={approvalFeeFormDraft?.feePerUnit}
                            formDraft={approvalFeeFormDraft}
                            formDraftKey={approvalFeeFormDraftKey}
                            isDisabled={isFlowLocked}
                        />
                    </Box>
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
