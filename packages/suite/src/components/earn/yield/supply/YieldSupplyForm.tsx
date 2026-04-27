import { useEffect } from 'react';

import { events } from '@suite/analytics';
import { Translation, useTranslation } from '@suite/intl';
import { splitYieldPendingTransaction } from '@suite-common/wallet-core';
import { Banner, BulletList, Button, Column, Row, Text } from '@trezor/components';

import { FormattedCryptoAmount } from 'src/components/suite/FormattedCryptoAmount';
import { useAnalytics } from 'src/support/useAnalytics';

import { useYieldSupplyContext } from './useYieldSupplyContext';
import { YieldActionStep } from '../common/YieldActionStep';
import { YieldActionStepWarning } from '../common/YieldActionStepWarning';
import { YieldApproveModal } from '../common/YieldApproveModal';
import { YieldApproveStep } from '../common/YieldApproveStep';
import { YieldFlowCompleteSupply } from '../common/YieldFlowCompleteSupply';

export const YieldSupplyForm = () => {
    const analytics = useAnalytics();
    const { translationString } = useTranslation();

    const {
        account,
        token,
        receiptToken,
        apy,
        liveAmount,
        approvedAmount,
        completedAmount,
        completedReceiptAmount,
        maxAmount,
        errorMessage,
        approveModalState,
        pendingTransaction,
        isModifyMode,
        lastApprovedAmount,
        isRevokeRequired,
        isAmountTooHigh,
        isApprovalInsufficient,
        isSubmittingApprove,
        isSubmittingAction,
        setAmountInput,
        submitApprove,
        submitAction,
        submitRevoke,
        enterModifyApproval,
        handleApproveModalCancel,
        handleApproveSuccessTxid,
        openPendingTransaction,
        flow,
    } = useYieldSupplyContext();

    const {
        approve: approveStepState,
        action: actionStepState,
        complete: completeStepState,
    } = flow.stepStates;

    const { approvalPendingTransaction, actionPendingTransaction: supplyPendingTransaction } =
        splitYieldPendingTransaction(pendingTransaction, 'supply');

    // trigger success analytics event
    useEffect(() => {
        if (flow.currentStep === 'complete') {
            analytics.report({
                type: events.yieldSupplyEvent.name,
                payload: {
                    type: 'success',
                    action: 'continue',
                    networkSymbol: token.networkSymbol,
                    contractAddress: token.contractAddress ?? undefined,
                },
            });
        }
    }, [flow.currentStep, analytics, token.networkSymbol, token.contractAddress]);

    // trigger error analytics event
    useEffect(() => {
        if (errorMessage) {
            analytics.report({
                type: events.yieldSupplyEvent.name,
                payload: {
                    type: 'error',
                    action: 'continue',
                    networkSymbol: token.networkSymbol,
                    contractAddress: token.contractAddress ?? undefined,
                    errorMessage: translationString(errorMessage),
                },
            });
        }
    }, [analytics, errorMessage, token.networkSymbol, token.contractAddress, translationString]);

    const handleOnApprove = () => {
        analytics.report({
            type: events.yieldSupplyEvent.name,
            payload: {
                type: 'approve',
                action: 'continue',
                networkSymbol: token.networkSymbol,
                contractAddress: token.contractAddress ?? undefined,
            },
        });

        submitApprove();
    };

    const handleOnRevoke = () => {
        analytics.report({
            type: events.yieldSupplyEvent.name,
            payload: {
                type: 'revoke',
                action: 'continue',
                networkSymbol: token.networkSymbol,
                contractAddress: token.contractAddress ?? undefined,
            },
        });

        submitRevoke();
    };

    const handleOnModify = () => {
        analytics.report({
            type: events.yieldSupplyEvent.name,
            payload: {
                type: 'modify',
                action: 'continue',
                networkSymbol: token.networkSymbol,
                contractAddress: token.contractAddress ?? undefined,
            },
        });

        enterModifyApproval();
    };

    const handleOnSupply = () => {
        analytics.report({
            type: events.yieldSupplyEvent.name,
            payload: {
                type: 'supply',
                action: 'continue',
                networkSymbol: token.networkSymbol,
                contractAddress: token.contractAddress ?? undefined,
            },
        });

        submitAction();
    };

    return (
        <>
            <Column width="100%" alignItems="center">
                <Column gap={24} width="100%" maxWidth={500}>
                    {flow.currentStep === 'complete' ? (
                        <YieldFlowCompleteSupply
                            apy={apy}
                            input={{
                                token,
                                amount: completedAmount,
                            }}
                            output={{
                                token: receiptToken,
                                amount: completedReceiptAmount,
                            }}
                        />
                    ) : (
                        <>
                            <Text typographyStyle="headline-md">
                                <Translation id="TR_EARN_YIELD_SUPPLY" />
                            </Text>

                            {errorMessage && (
                                <Banner
                                    intent="warning"
                                    description={<Translation id={errorMessage} />}
                                />
                            )}

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
                                                    onClick={handleOnModify}
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
                                        amount={liveAmount}
                                        summaryValue={
                                            <FormattedCryptoAmount
                                                value={maxAmount}
                                                symbol={token.symbol}
                                            />
                                        }
                                        approvedAmount={approvedAmount ?? undefined}
                                        isModifyMode={isModifyMode}
                                        previousApprovedAmount={lastApprovedAmount || undefined}
                                        isRevokeRequired={isRevokeRequired}
                                        warning={
                                            isAmountTooHigh ? (
                                                <YieldActionStepWarning isInsufficientFunds />
                                            ) : undefined
                                        }
                                        isDisabled={
                                            !liveAmount || isAmountTooHigh || isSubmittingApprove
                                        }
                                        pendingApproveTransaction={approvalPendingTransaction}
                                        onMaxClick={() => setAmountInput(maxAmount)}
                                        onApprove={handleOnApprove}
                                        onRevoke={handleOnRevoke}
                                        onPendingTxClick={openPendingTransaction}
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
                                            summaryValue={
                                                <FormattedCryptoAmount
                                                    value={maxAmount}
                                                    symbol={token.symbol}
                                                />
                                            }
                                            warning={
                                                <YieldActionStepWarning
                                                    isInsufficientFunds={isAmountTooHigh}
                                                    isApprovalInsufficient={isApprovalInsufficient}
                                                    onModifyApproval={enterModifyApproval}
                                                />
                                            }
                                            isDisabled={
                                                isAmountTooHigh ||
                                                isApprovalInsufficient ||
                                                isSubmittingAction
                                            }
                                            pendingTransaction={supplyPendingTransaction}
                                            onMaxClick={() => setAmountInput(maxAmount)}
                                            onSubmit={handleOnSupply}
                                            onPendingTxClick={openPendingTransaction}
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

            {approveModalState && (
                <YieldApproveModal
                    {...approveModalState}
                    account={account}
                    onCancel={handleApproveModalCancel}
                    onSuccess={handleApproveSuccessTxid}
                />
            )}
        </>
    );
};
