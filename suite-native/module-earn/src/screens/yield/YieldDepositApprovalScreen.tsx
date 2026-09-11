import { Context } from '@suite-common/message-system';
import { BannerFull, Box, VStack } from '@suite-native/atoms';
import { Form } from '@suite-native/forms';
import { Translation } from '@suite-native/intl';
import { ContextMessage } from '@suite-native/message-system';
import { Screen } from '@suite-native/navigation';
import { FeeSelector } from '@suite-native/transaction-management';

import { YieldAmountInputCard } from '../../components/yield/YieldAmountInputCard';
import { YieldDepositApprovalLimitBottomSheet } from '../../components/yield/YieldDepositApprovalLimitBottomSheet';
import { YieldDepositApprovedAmountCard } from '../../components/yield/YieldDepositApprovedAmountCard';
import { YieldDepositFlowFooter } from '../../components/yield/YieldDepositFlowFooter';
import { YieldDepositStepCard } from '../../components/yield/YieldDepositStepCard';
import { YieldDisabledAlert } from '../../components/yield/YieldDisabledAlert';
import { YieldFlowScreenHeader } from '../../components/yield/YieldFlowScreenHeader';
import { YieldSessionPendingModal } from '../../components/yield/YieldSessionPendingModal';
import { useYieldDepositApprovalController } from '../../hooks/yield/controllers/useYieldDepositApprovalController';
import { getYieldTokenContract } from '../../utils/yield/yieldFiatAmountUtils';

export const YieldDepositApprovalScreen = () => {
    const controller = useYieldDepositApprovalController();

    if (controller.status !== 'ready') {
        return null;
    }

    const {
        accountLabel,
        amountInput,
        approvalLimitSheet,
        approvedAmountCard,
        disabledAlert,
        feeSection,
        footer,
        header,
        isInteractionBlocked,
        isRevokeRequired,
        pendingModal,
        stepCard,
        tokenContract,
        yieldFlowData,
    } = controller;
    const { account, apy, token, tokenSymbol } = yieldFlowData;

    const pendingModalAmount = pendingModal?.pendingTransaction.isAmountUnlimited ? (
        <Translation id="earn.yieldDepositFlowScreen.approvalLimitSheet.unlimited.title" />
    ) : (
        pendingModal?.pendingTransaction.amount
    );
    const pendingModalAmountTokenSymbol = pendingModal?.pendingTransaction.isAmountUnlimited
        ? undefined
        : tokenSymbol;

    return (
        <Screen
            noHorizontalPadding
            header={
                <YieldFlowScreenHeader
                    account={account}
                    closeAction={header.onClose}
                    title={yieldFlowData.vaultTokenName}
                    tokenContract={tokenContract}
                />
            }
            footer={
                <YieldDepositFlowFooter
                    accountKey={account.key}
                    amountValue={footer.amountValue}
                    approvalAction={footer.approvalAction}
                    apy={apy}
                    isDisabled={footer.isDisabled}
                    isLoading={footer.isLoading}
                    isSkipDisabled={footer.isSkipDisabled}
                    networkSymbol={account.symbol}
                    onPress={footer.onPress}
                    onSkipPress={footer.onSkipPress}
                    tokenContract={footer.estimatedRewardsTokenContract}
                />
            }
        >
            <Box pointerEvents={isInteractionBlocked ? 'none' : 'auto'}>
                <Form form={amountInput.form}>
                    <VStack spacing="sp16">
                        <ContextMessage
                            context={Context.getEarnYield('deposit')}
                            marginHorizontal="sp16"
                        />
                        {disabledAlert && (
                            <Box paddingHorizontal="sp16">
                                <YieldDisabledAlert
                                    type="deposit"
                                    content={disabledAlert.content}
                                    variant={disabledAlert.variant}
                                />
                            </Box>
                        )}
                        <YieldDepositStepCard
                            currentStepId="approval"
                            hasWrapStep={stepCard.hasWrapStep}
                            isWrapStepSkipped={stepCard.isWrapStepSkipped}
                            networkSymbol={account.symbol}
                            onEditStep={{ wrap: stepCard.onEditWrapStep }}
                        />

                        {approvedAmountCard.isVisible && (
                            <Box paddingHorizontal="sp16">
                                <YieldDepositApprovedAmountCard
                                    actionType="revoke"
                                    approvedAmount={approvedAmountCard.amount}
                                    isApprovedAmountUnlimited={approvedAmountCard.isUnlimited}
                                    networkSymbol={account.symbol}
                                    onActionPress={approvedAmountCard.onRevoke}
                                    tokenDecimals={token.decimals}
                                    tokenContract={tokenContract}
                                    tokenSymbol={tokenSymbol}
                                />
                            </Box>
                        )}

                        <Box paddingHorizontal="sp16">
                            <YieldAmountInputCard
                                amountLabel={
                                    <Translation id="earn.yieldDepositFlowScreen.amountToDeposit" />
                                }
                                approvalLimitTitle={amountInput.approvalLimitTitle}
                                balance={amountInput.balance}
                                isApprovalLimitDisabled={amountInput.isApprovalLimitDisabled}
                                onApprovalLimitPress={amountInput.onApprovalLimitPress}
                                onCurrencyChange={amountInput.onCurrencyChange}
                                onMaxPress={amountInput.onMaxPress}
                                symbol={account.symbol}
                                tokenContract={getYieldTokenContract(token)}
                                tokenDecimals={token.decimals}
                                tokenSymbol={tokenSymbol}
                            />
                        </Box>

                        {isRevokeRequired && (
                            <Box paddingHorizontal="sp16">
                                <BannerFull
                                    intent="warning"
                                    title={
                                        <Translation id="earn.yieldDepositFlowScreen.alerts.approvalIncreaseRequiresRevoke.title" />
                                    }
                                />
                            </Box>
                        )}

                        {feeSection.isVisible && (
                            <Box paddingHorizontal="sp16">
                                <FeeSelector
                                    accountKey={account.key}
                                    tokenContract={tokenContract}
                                    updateThunk={feeSection.updateFeeLevelThunk}
                                    selectedFee={feeSection.selectedFee}
                                    selectedFeePerUnit={feeSection.formDraft?.feePerUnit}
                                    formDraft={feeSection.formDraft}
                                    formDraftKey={feeSection.formDraftKey}
                                />
                            </Box>
                        )}
                    </VStack>
                </Form>
            </Box>
            <YieldSessionPendingModal
                pendingModal={pendingModal}
                accountLabel={accountLabel}
                accountSymbol={account.symbol}
                amount={pendingModalAmount}
                amountLabel={<Translation id="earn.yieldDepositFlowScreen.approvalLimit" />}
                amountTokenContract={tokenContract}
                amountTokenSymbol={pendingModalAmountTokenSymbol}
                title={<Translation id="moduleTrading.tradingConfirmationScreen.approveTitle" />}
                vaultName={yieldFlowData.vaultTokenName}
                vaultTokenContract={tokenContract}
            />
            <YieldDepositApprovalLimitBottomSheet
                ref={approvalLimitSheet.bottomSheetRef}
                accountSymbol={account.symbol}
                onApprovalLimitSelect={approvalLimitSheet.onSelect}
                onClose={approvalLimitSheet.onClose}
                selectedApprovalLimitType={approvalLimitSheet.selectedType}
                tokenContract={tokenContract}
                tokenSymbol={tokenSymbol}
            />
        </Screen>
    );
};
