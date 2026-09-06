import { Context } from '@suite-common/message-system';
import { BannerFull, Box, VStack } from '@suite-native/atoms';
import { Form } from '@suite-native/forms';
import { Translation } from '@suite-native/intl';
import { ContextMessage } from '@suite-native/message-system';
import { Screen } from '@suite-native/navigation';

import { YieldAmountInputCard } from '../../components/yield/YieldAmountInputCard';
import { YieldDepositApprovedAmountCard } from '../../components/yield/YieldDepositApprovedAmountCard';
import { YieldDepositFlowFooter } from '../../components/yield/YieldDepositFlowFooter';
import { YieldDepositStepCard } from '../../components/yield/YieldDepositStepCard';
import { YieldDisabledAlert } from '../../components/yield/YieldDisabledAlert';
import { YieldFeeSection } from '../../components/yield/YieldFeeSection';
import { YieldFlowScreenHeader } from '../../components/yield/YieldFlowScreenHeader';
import { YieldSessionPendingModal } from '../../components/yield/YieldSessionPendingModal';
import { YieldSessionTxSimulationSheet } from '../../components/yield/YieldSessionTxSimulationSheet';
import { useYieldDepositController } from '../../hooks/yield/controllers/useYieldDepositController';
import { getYieldTokenContract } from '../../utils/yield/yieldFiatAmountUtils';

export const YieldDepositScreen = () => {
    const controller = useYieldDepositController();

    if (controller.status !== 'ready') {
        return null;
    }

    const {
        accountLabel,
        amountInput,
        approvedAmountCard,
        disabledAlert,
        feeSection,
        footer,
        header,
        isApprovalInsufficient,
        isInteractionBlocked,
        pendingModal,
        simulationSheet,
        stepCard,
        tokenContract,
        yieldFlowData,
    } = controller;
    const { account, apy, token, tokenSymbol } = yieldFlowData;

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
                    apy={apy}
                    isDisabled={footer.isDisabled}
                    isLoading={footer.isLoading}
                    networkSymbol={account.symbol}
                    onPress={footer.onContinue}
                    shouldKeepEstimatedRewardsVisible={isApprovalInsufficient}
                    tokenContract={footer.estimatedRewardsTokenContract}
                />
            }
        >
            <Box pointerEvents={isInteractionBlocked ? 'none' : 'auto'}>
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
                        currentStepId="deposit"
                        hasWrapStep={stepCard.hasWrapStep}
                        isApprovalStepSkipped={stepCard.isApprovalStepSkipped}
                        isWrapStepSkipped={stepCard.isWrapStepSkipped}
                        networkSymbol={account.symbol}
                        onEditStep={{
                            wrap: stepCard.onEditWrapStep,
                            approval: stepCard.onEditApprovalStep,
                        }}
                    />

                    <Box paddingHorizontal="sp16">
                        <YieldDepositApprovedAmountCard
                            actionType="edit"
                            approvedAmount={approvedAmountCard.amount}
                            isApprovedAmountUnlimited={approvedAmountCard.isUnlimited}
                            networkSymbol={account.symbol}
                            onActionPress={stepCard.onEditApprovalStep}
                            tokenDecimals={token.decimals}
                            tokenContract={tokenContract}
                            tokenSymbol={tokenSymbol}
                        />
                    </Box>

                    <Box paddingHorizontal="sp16">
                        <Form form={amountInput.form}>
                            <YieldAmountInputCard
                                amountLabel={
                                    <Translation id="earn.yieldDepositFlowScreen.amountToDeposit" />
                                }
                                balance={amountInput.balance}
                                onCurrencyChange={amountInput.onCurrencyChange}
                                onMaxPress={amountInput.onMaxPress}
                                symbol={account.symbol}
                                tokenContract={getYieldTokenContract(token)}
                                tokenDecimals={token.decimals}
                                tokenSymbol={tokenSymbol}
                            />
                        </Form>
                    </Box>

                    {isApprovalInsufficient && (
                        <Box paddingHorizontal="sp16">
                            <BannerFull
                                intent="warning"
                                title={
                                    <Translation id="earn.yieldDepositFlowScreen.alerts.approvalTooLow.title" />
                                }
                                primaryButtonLabel={
                                    <Translation id="earn.yieldDepositFlowScreen.alerts.approvalTooLow.primaryButton" />
                                }
                                onPressPrimaryButton={stepCard.onEditApprovalStep}
                            />
                        </Box>
                    )}

                    {feeSection.isVisible && (
                        <Box paddingHorizontal="sp16">
                            <YieldFeeSection
                                accountKey={account.key}
                                fees={feeSection.fees}
                                tokenContract={tokenContract}
                            />
                        </Box>
                    )}
                </VStack>
            </Box>

            <YieldSessionPendingModal
                pendingModal={pendingModal}
                accountLabel={accountLabel}
                accountSymbol={account.symbol}
                amountLabel={<Translation id="earn.yieldDepositFlowScreen.amountToDeposit" />}
                amountTokenContract={tokenContract}
                amountTokenSymbol={tokenSymbol}
                title={<Translation id="earn.yieldDepositFlowScreen.depositPendingTitle" />}
                vaultName={yieldFlowData.vaultTokenName}
                vaultTokenContract={tokenContract}
            />

            <YieldSessionTxSimulationSheet
                account={account}
                flow="deposit"
                sheet={simulationSheet}
            />
        </Screen>
    );
};
