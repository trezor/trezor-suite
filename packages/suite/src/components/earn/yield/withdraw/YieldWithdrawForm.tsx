import { FormProvider, useForm } from 'react-hook-form';

import { Translation } from '@suite/intl';
import { BulletList, Column, Text } from '@trezor/components';

import { YieldActionStep } from '../common/YieldActionStep';
import { YieldApproveModal } from '../common/YieldApproveModal';
import { YieldApproveStep } from '../common/YieldApproveStep';
import { YieldFlowComplete } from '../common/YieldFlowComplete';
import { YieldFlowStepList } from '../common/YieldFlowStepList';
import { YieldRevokeModal } from '../common/YieldRevokeModal';
import { getFlowStepState } from '../common/getFlowStepState';
import type { YieldWithdrawFormValues } from '../common/types';
import { useYieldWithdrawContext } from '../common/useYieldWithdrawContext';

export const YieldWithdrawForm = () => {
    const {
        account,
        token,
        receiptToken,
        provider,
        suppliedAmount,
        withdraw: {
            flow,
            approveStep,
            withdrawStep,
            approve,
            approval,
            complete,
            completeWithdraw,
            handleApproveAmountChange,
            handleApprove,
            handleApproveModalConfirm,
            handleSelectApprovalType,
            handleRevoke,
            handleSwitchUnit,
            handleWithdrawAmountChange,
        },
    } = useYieldWithdrawContext();

    const methods = useForm<YieldWithdrawFormValues>({
        defaultValues: {
            amountInput: flow.approveAmount.assetValue,
        },
    });

    const displayedApproveAmount =
        flow.approveAmount.selectedUnit === 'asset'
            ? flow.approveAmount.assetValue
            : flow.approveAmount.receiptTokenValue;
    const switchCurrencyLabel =
        flow.approveAmount.selectedUnit === 'asset' ? receiptToken.symbol : token.symbol;
    const approveToken = flow.approveAmount.selectedUnit === 'asset' ? token : receiptToken;

    return (
        <FormProvider {...methods}>
            <Column width="100%" alignItems="center">
                <Column gap={24} width="100%" maxWidth={500}>
                    {flow.isCompleteStep ? (
                        <YieldFlowComplete
                            flowType="withdraw"
                            input={complete.input}
                            output={complete.output}
                        />
                    ) : (
                        <>
                            <Text typographyStyle="headline-md">
                                <Translation id="TR_EARN_YIELD_WITHDRAW" />
                            </Text>

                            <YieldFlowStepList>
                                <YieldApproveStep
                                    account={account}
                                    token={approveToken}
                                    state={getFlowStepState(flow.currentStepIndex, 0)}
                                    amount={displayedApproveAmount}
                                    maxAmount={suppliedAmount}
                                    balanceToken={token}
                                    balanceLabelTranslationId="TR_EARN_YIELD_SUPPLIED"
                                    amountLabelTranslationId="TR_EARN_YIELD_AMOUNT_TO_WITHDRAW"
                                    balanceValue={`${suppliedAmount} ${token.symbol}`}
                                    switchCurrencyLabel={switchCurrencyLabel}
                                    approveStep={approveStep}
                                    approve={approve}
                                    approval={approval}
                                    onAmountSelect={handleApproveAmountChange}
                                    onSwitchCurrency={handleSwitchUnit}
                                    onApprove={handleApprove}
                                    onRevoke={handleRevoke}
                                />
                                <YieldActionStep
                                    token={token}
                                    state={getFlowStepState(flow.currentStepIndex, 1)}
                                    amount={flow.withdrawAmount}
                                    step={withdrawStep}
                                    titleTranslationId="TR_EARN_YIELD_WITHDRAW"
                                    amountLabelTranslationId="TR_EARN_YIELD_AMOUNT_TO_WITHDRAW"
                                    submitTranslationId="TR_EARN_YIELD_WITHDRAW"
                                    onAmountSelect={handleWithdrawAmountChange}
                                    onSubmit={completeWithdraw}
                                />
                                <BulletList.Item
                                    state={getFlowStepState(flow.currentStepIndex, 2)}
                                    title={<Translation id="TR_EARN_YIELD_WITHDRAW_COMPLETE" />}
                                />
                            </YieldFlowStepList>
                            <YieldApproveModal
                                account={account}
                                provider={provider}
                                amount={flow.approveAmount.assetValue}
                                cryptoId={flow.cryptoId}
                                spender={approval.spender}
                                onSelectApprovalType={handleSelectApprovalType}
                                onConfirm={handleApproveModalConfirm}
                            />
                            <YieldRevokeModal
                                account={account}
                                provider={provider}
                                cryptoId={flow.cryptoId}
                                spender={approval.spender}
                            />
                        </>
                    )}
                </Column>
            </Column>
        </FormProvider>
    );
};
