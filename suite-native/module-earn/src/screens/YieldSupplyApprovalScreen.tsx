import { type RouteProp, useNavigation, useRoute } from '@react-navigation/native';

import { Box, Button, useBottomSheetModal } from '@suite-native/atoms';
import { Form } from '@suite-native/forms';
import {
    Screen,
    type StackNavigationProps,
    type YieldStackParamList,
    YieldStackRoutes,
} from '@suite-native/navigation';
import { FeeSelector } from '@suite-native/transaction-management';

import { ApproveSupplyForm } from '../components/ApproveSupplyForm';
import { YieldSupplyApprovalLimitBottomSheet } from '../components/YieldSupplyApprovalLimitBottomSheet';
import { YieldSupplyFlowFooter } from '../components/YieldSupplyFlowFooter';
import { YieldSupplyFlowScreenHeader } from '../components/YieldSupplyFlowScreenHeader';
import { YieldSupplyInfoBottomSheet } from '../components/YieldSupplyInfoBottomSheet';
import { useResolvedYieldFlowData } from '../hooks/useResolvedYieldFlowData';
import { useYieldApprovalFees } from '../hooks/useYieldApprovalFees';
import { useYieldApprovalLimit } from '../hooks/useYieldApprovalLimit';
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
    const session = useYieldSession({
        flowKey,
        flowType: 'deposit',
        shouldDisposeOnGoBack: true,
    });
    const sessionStep = session?.step;

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
    const isApprovalSubmitDisabled =
        !isValid ||
        !isApprovalFeeReady ||
        isComposingApprovalFee ||
        isCheckingApproval ||
        isFeeUnavailable ||
        !isApprovalSessionReady;

    const handleSubmit = form.handleSubmit(async ({ amount }) => {
        if (!isApprovalFeeReady || isComposingApprovalFee || !isApprovalSessionReady) {
            return;
        }

        await handleSubmitApproval(amount);
    });

    const handleOpenSupplyShell = () => {
        if (__DEV__) {
            console.warn('[YieldSupply] Opening temporary supply shell for route validation.');
            navigation.navigate(YieldStackRoutes.YieldSupply, route.params);
        }
    };

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
                    isDisabled={isApprovalSubmitDisabled}
                    isLoading={isCheckingApproval}
                    onPress={handleSubmit}
                    tokenSymbol={tokenSymbol}
                />
            }
        >
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
                {__DEV__ && (
                    <Box paddingHorizontal="sp16" marginTop="sp16">
                        <Button
                            accessibilityRole="button"
                            intent="neutral"
                            priority="secondary"
                            onPress={handleOpenSupplyShell}
                        >
                            Open supply shell
                        </Button>
                    </Box>
                )}
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
