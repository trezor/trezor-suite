import { Translation } from '@suite/intl';
import { BulletList, Button, Column, Row, Text } from '@trezor/components';

import { useYieldWithdrawContext } from './useYieldWithdrawContext';
import { YieldActionStep } from '../common/YieldActionStep';
import { YieldApproveStep } from '../common/YieldApproveStep';
import { YieldFlowComplete } from '../common/YieldFlowComplete';

export const YieldWithdrawForm = () => {
    const {
        token,
        receiptToken,
        maxAmount,
        approveAmount,
        withdrawAmount,
        completedAmount,
        setApproveAmount,
        setApproveMaxAmount,
        setWithdrawAmount,
        setWithdrawMaxAmount,
        flow,
    } = useYieldWithdrawContext();
    const {
        approve: approveStepState,
        action: actionStepState,
        complete: completeStepState,
    } = flow.stepStates;

    return (
        <Column width="100%" alignItems="center">
            <Column gap={24} width="100%" maxWidth={500}>
                {flow.currentStep === 'complete' ? (
                    <YieldFlowComplete
                        flowType="withdraw"
                        input={{
                            token: receiptToken,
                            value: `${completedAmount} ${receiptToken.symbol}`,
                        }}
                        output={{
                            token,
                            value: `${completedAmount} ${token.symbol}`,
                        }}
                    />
                ) : (
                    <>
                        <Text typographyStyle="headline-md">
                            <Translation id="TR_EARN_YIELD_WITHDRAW" />
                        </Text>

                        <BulletList bulletSize="small" bulletGap={12} gap={24} titleGap={16}>
                            <BulletList.Item
                                state={approveStepState}
                                title={
                                    <Row
                                        justifyContent="space-between"
                                        alignItems="center"
                                        width="100%"
                                    >
                                        <Translation id="TR_EARN_YIELD_SELECT_AMOUNT_AND_APPROVE" />
                                        {approveStepState === 'done' && (
                                            <Button
                                                size="small"
                                                intent="neutral"
                                                priority="secondary"
                                                onClick={() => flow.goToStep('approve')}
                                            >
                                                <Translation id="TR_MODIFY" />
                                            </Button>
                                        )}
                                    </Row>
                                }
                            >
                                <YieldApproveStep
                                    flowType="withdraw"
                                    token={token}
                                    variant={approveStepState === 'done' ? 'done' : 'active'}
                                    amount={approveAmount}
                                    summaryValue={`${maxAmount} ${token.symbol}`}
                                    approvedAmount={approveAmount}
                                    switchCurrencyLabel={receiptToken.symbol}
                                    isSwitchDisabled
                                    onAmountSelect={setApproveAmount}
                                    onMaxClick={setApproveMaxAmount}
                                    onApprove={flow.goToNextStep}
                                />
                            </BulletList.Item>

                            <BulletList.Item
                                state={actionStepState}
                                title={<Translation id="TR_EARN_YIELD_WITHDRAW" />}
                            >
                                {actionStepState === 'active' && (
                                    <YieldActionStep
                                        flowType="withdraw"
                                        token={token}
                                        amount={withdrawAmount}
                                        summaryValue={`${maxAmount} ${token.symbol}`}
                                        onAmountSelect={setWithdrawAmount}
                                        onMaxClick={setWithdrawMaxAmount}
                                        onSubmit={flow.goToNextStep}
                                    />
                                )}
                            </BulletList.Item>

                            <BulletList.Item
                                state={completeStepState}
                                title={<Translation id="TR_EARN_YIELD_WITHDRAW_COMPLETE" />}
                            />
                        </BulletList>
                    </>
                )}
            </Column>
        </Column>
    );
};
