import { Translation } from '@suite/intl';
import { BulletList, Button, Column, Row, Text } from '@trezor/components';

import { useYieldSupplyContext } from './useYieldSupplyContext';
import { YieldActionStep } from '../common/YieldActionStep';
import { YieldApproveStep } from '../common/YieldApproveStep';
import { YieldFlowComplete } from '../common/YieldFlowComplete';

export const YieldSupplyForm = () => {
    const {
        token,
        receiptToken,
        apy,
        approveAmount,
        supplyAmount,
        completedAmount,
        maxAmount,
        setApproveAmount,
        setSupplyAmount,
        setApproveMaxAmount,
        setSupplyMaxAmount,
        flow,
    } = useYieldSupplyContext();

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
                        flowType="supply"
                        apy={apy}
                        input={{
                            token,
                            value: `${completedAmount} ${token.symbol}`,
                        }}
                        output={{
                            token: receiptToken,
                            value: `${completedAmount} ${receiptToken.symbol}`,
                        }}
                    />
                ) : (
                    <>
                        <Text typographyStyle="headline-md">
                            <Translation id="TR_EARN_YIELD_SUPPLY" />
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
                                    flowType="supply"
                                    token={token}
                                    variant={approveStepState === 'done' ? 'done' : 'active'}
                                    amount={approveAmount}
                                    summaryValue={`${maxAmount} ${token.symbol}`}
                                    approvedAmount={approveAmount}
                                    onAmountSelect={setApproveAmount}
                                    onMaxClick={setApproveMaxAmount}
                                    onApprove={flow.goToNextStep}
                                />
                            </BulletList.Item>

                            <BulletList.Item
                                state={actionStepState}
                                title={<Translation id="TR_EARN_YIELD_SUPPLY" />}
                            >
                                {actionStepState === 'active' && (
                                    <YieldActionStep
                                        flowType="supply"
                                        token={token}
                                        amount={supplyAmount}
                                        summaryValue={`${maxAmount} ${token.symbol}`}
                                        onAmountSelect={setSupplyAmount}
                                        onMaxClick={setSupplyMaxAmount}
                                        onSubmit={flow.goToNextStep}
                                    />
                                )}
                            </BulletList.Item>

                            <BulletList.Item
                                state={completeStepState}
                                title={<Translation id="TR_EARN_YIELD_SUPPLY_COMPLETE" />}
                            />
                        </BulletList>
                    </>
                )}
            </Column>
        </Column>
    );
};
