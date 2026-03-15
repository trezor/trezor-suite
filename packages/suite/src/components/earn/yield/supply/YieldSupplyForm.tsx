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
import type { YieldSupplyFormValues } from '../common/types';
import { useYieldSupplyContext } from '../common/useYieldSupplyContext';

export const YieldSupplyForm = () => {
    const {
        token,
        supply: {
            flow,
            approveStep,
            supplyStep,
            approve,
            approval,
            complete,
            completeSupply,
            handleAmountChange,
            handleApprove,
            handleApproveModalConfirm,
            handleSelectApprovalType,
            handleRevoke,
        },
        account,
        provider,
    } = useYieldSupplyContext();

    const methods = useForm<YieldSupplyFormValues>({
        defaultValues: {
            amountInput: token.balance,
        },
    });

    return (
        <FormProvider {...methods}>
            <Column width="100%" alignItems="center">
                <Column gap={24} width="100%" maxWidth={500}>
                    {flow.isCompleteStep ? (
                        <YieldFlowComplete
                            flowType="supply"
                            input={complete.input}
                            output={complete.output}
                        />
                    ) : (
                        <>
                            <Text typographyStyle="headline-md">
                                <Translation id="TR_EARN_YIELD_SUPPLY" />
                            </Text>

                            <YieldFlowStepList>
                                <YieldApproveStep
                                    account={account}
                                    token={token}
                                    state={getFlowStepState(flow.currentStepIndex, 0)}
                                    amount={flow.amount}
                                    maxAmount={token.balance}
                                    approveStep={approveStep}
                                    approve={approve}
                                    approval={approval}
                                    onAmountSelect={handleAmountChange}
                                    onApprove={handleApprove}
                                    onRevoke={handleRevoke}
                                />
                                <YieldActionStep
                                    token={token}
                                    state={getFlowStepState(flow.currentStepIndex, 1)}
                                    amount={flow.amount}
                                    step={supplyStep}
                                    titleTranslationId="TR_EARN_YIELD_SUPPLY"
                                    amountLabelTranslationId="TR_EARN_YIELD_AMOUNT_TO_SUPPLY"
                                    submitTranslationId="TR_EARN_YIELD_SUPPLY"
                                    onAmountSelect={handleAmountChange}
                                    onSubmit={completeSupply}
                                />
                                <BulletList.Item
                                    state={getFlowStepState(flow.currentStepIndex, 2)}
                                    title={<Translation id="TR_EARN_YIELD_SUPPLY_COMPLETE" />}
                                />
                            </YieldFlowStepList>
                            <YieldApproveModal
                                account={account}
                                provider={provider}
                                amount={flow.amount}
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
