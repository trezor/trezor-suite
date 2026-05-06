import { type RouteProp, useRoute } from '@react-navigation/native';

import { Box, VStack, useBottomSheetModal } from '@suite-native/atoms';
import { Form } from '@suite-native/forms';
import { Screen, type YieldStackParamList, type YieldStackRoutes } from '@suite-native/navigation';
import { FeeSelector } from '@suite-native/transaction-management';

import { YieldSupplyAmountInputCard } from '../components/YieldSupplyAmountInputCard';
import { YieldSupplyApprovalLimitBottomSheet } from '../components/YieldSupplyApprovalLimitBottomSheet';
import { YieldSupplyFlowFooter } from '../components/YieldSupplyFlowFooter';
import { YieldSupplyFlowScreenHeader } from '../components/YieldSupplyFlowScreenHeader';
import { YieldSupplyInfoBottomSheet } from '../components/YieldSupplyInfoBottomSheet';
import { YieldSupplyStepCard } from '../components/YieldSupplyStepCard';
import { useResolvedYieldFlowData } from '../hooks/useResolvedYieldFlowData';
import { useYieldApprovalFees } from '../hooks/useYieldApprovalFees';
import { useYieldApprovalLimit } from '../hooks/useYieldApprovalLimit';
import { useYieldSupplyApprovalSubmit } from '../hooks/useYieldSupplyApprovalSubmit';
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

    const handleSubmit = form.handleSubmit(async ({ amount }) => {
        if (!isApprovalFeeReady || isComposingApprovalFee) {
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
                        isCheckingApproval
                    }
                    isLoading={isCheckingApproval}
                    onPress={handleSubmit}
                    tokenSymbol={tokenSymbol}
                />
            }
        >
            <Form form={form}>
                <VStack spacing="sp16">
                    <YieldSupplyStepCard />

                    <Box paddingHorizontal="sp16">
                        <YieldSupplyAmountInputCard
                            approvalLimitTitle={approvalLimitTitle}
                            balance={token.balance}
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
        </Screen>
    );
};
