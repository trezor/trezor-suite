import { type DesktopAnalyticsDep, events } from '@suite/analytics';
import { Translation } from '@suite/intl';
import { useServices } from '@suite-common/dependency-injection';
import { splitYieldPendingTransaction } from '@suite-common/wallet-core';
import { Banner, BulletList, Button, Column, Row, Text } from '@trezor/components';

import { FormattedCryptoAmount } from 'src/components/suite/FormattedCryptoAmount';

import { useYieldSupplyContext } from './useYieldSupplyContext';
import { YieldActionStep } from '../common/YieldActionStep';
import { YieldActionStepWarning } from '../common/YieldActionStepWarning';
import { YieldApproveModal } from '../common/YieldApproveModal';
import { YieldApproveStep } from '../common/YieldApproveStep';
import { YieldFlowCompleteSupply } from '../common/YieldFlowCompleteSupply';

export const YieldSupplyForm = () => {
    const { analytics } = useServices<DesktopAnalyticsDep>();

    const {
        account,
        vault,
        token,
        receiptToken,
        apy,
        completedAmount,
        completedReceiptAmount,
        maxAmount,
        errorMessage,
        approveModalState,
        pendingTransaction,
        allowanceAmount,
        allowanceStatus,
        approvalAction,
        canRevokeAllowance,
        isAmountEmpty,
        isAmountTooHigh,
        isAmountInvalidDecimals,
        isApprovalInsufficient,
        isSubmittingApprove,
        isSubmittingAction,
        setAmountInput,
        submitApprovalAction,
        submitAction,
        revokeAllowance,
        enterModifyApproval,
        handleApproveModalCancel,
        handleApproveSuccessTxid,
        openPendingTransaction,
        retryInitAllowance,
        flow,
    } = useYieldSupplyContext();

    const {
        approve: approveStepState,
        action: actionStepState,
        complete: completeStepState,
    } = flow.stepStates;

    const { approvalPendingTransaction, actionPendingTransaction: supplyPendingTransaction } =
        splitYieldPendingTransaction(pendingTransaction, 'deposit');

    const handleOnApprovalSubmit = () => {
        analytics.report({
            type: events.yieldDepositEvent.name,
            payload: {
                type: approvalAction === 'revoke' ? 'revoke' : 'approve',
                action: 'continue',
                networkSymbol: token.networkSymbol,
                vaultId: vault.id,
            },
        });

        submitApprovalAction();
    };

    const handleOnRevoke = () => {
        analytics.report({
            type: events.yieldDepositEvent.name,
            payload: {
                type: 'revoke',
                action: 'continue',
                networkSymbol: token.networkSymbol,
                vaultId: vault.id,
            },
        });

        revokeAllowance();
    };

    const handleOnModify = () => {
        analytics.report({
            type: events.yieldDepositEvent.name,
            payload: {
                type: 'modify-allowance',
                action: 'continue',
                networkSymbol: token.networkSymbol,
                vaultId: vault.id,
            },
        });

        enterModifyApproval();
    };

    const handleOnSupply = () => {
        analytics.report({
            type: events.yieldDepositEvent.name,
            payload: {
                type: 'deposit',
                action: 'continue',
                networkSymbol: token.networkSymbol,
                vaultId: vault.id,
            },
        });

        submitAction();
    };

    const handleMaxClick = () => {
        analytics.report({
            type: events.yieldInteractionEvent.name,
            payload: {
                element: 'deposit-max',
                networkSymbol: token.networkSymbol,
                vaultId: vault.id,
            },
        });

        setAmountInput(maxAmount);
    };

    const handleRetryAllowance = () => {
        analytics.report({
            type: events.yieldInteractionEvent.name,
            payload: {
                element: 'allowance-retry',
                networkSymbol: token.networkSymbol,
                vaultId: vault.id,
            },
        });

        retryInitAllowance();
    };

    return (
        <>
            <Column width="100%" alignItems="center">
                <Column gap={24} width="100%" maxWidth={500}>
                    {flow.currentStep === 'complete' ? (
                        <YieldFlowCompleteSupply
                            apy={apy}
                            vault={vault}
                            networkSymbol={account.symbol}
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

                            {allowanceStatus === 'error' && (
                                <Banner
                                    icon
                                    intent="warning"
                                    description={
                                        <Translation id="TR_EARN_YIELD_ALLOWANCE_FETCH_FAILED" />
                                    }
                                    rightContent={
                                        <Banner.Button onClick={handleRetryAllowance}>
                                            <Translation id="TR_RETRY" />
                                        </Banner.Button>
                                    }
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
                                        flowType="deposit"
                                        token={token}
                                        variant={approveStepState === 'done' ? 'done' : 'active'}
                                        summaryValue={
                                            <FormattedCryptoAmount
                                                value={maxAmount}
                                                symbol={token.symbol}
                                            />
                                        }
                                        approvedAmount={allowanceAmount || undefined}
                                        isApprovedAmountLoading={allowanceStatus === 'loading'}
                                        hasApprovedAmountError={allowanceStatus === 'error'}
                                        approvalAction={approvalAction}
                                        canRevokeAllowance={canRevokeAllowance}
                                        warning={
                                            !isAmountInvalidDecimals && isAmountTooHigh ? (
                                                <YieldActionStepWarning
                                                    isApproveOverBalance={isAmountTooHigh}
                                                />
                                            ) : undefined
                                        }
                                        isDisabled={
                                            isAmountEmpty ||
                                            isAmountInvalidDecimals ||
                                            isSubmittingApprove ||
                                            !!approvalPendingTransaction
                                        }
                                        isLoading={isSubmittingApprove}
                                        pendingApproveTransaction={approvalPendingTransaction}
                                        onMaxClick={handleMaxClick}
                                        onApprovalSubmit={handleOnApprovalSubmit}
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
                                            flowType="deposit"
                                            token={token}
                                            summaryValue={
                                                <FormattedCryptoAmount
                                                    value={maxAmount}
                                                    symbol={token.symbol}
                                                />
                                            }
                                            warning={
                                                !isAmountInvalidDecimals ? (
                                                    <YieldActionStepWarning
                                                        isInsufficientFunds={isAmountTooHigh}
                                                        isApprovalInsufficient={
                                                            isApprovalInsufficient
                                                        }
                                                        onModifyApproval={handleOnModify}
                                                    />
                                                ) : undefined
                                            }
                                            isDisabled={
                                                isAmountEmpty ||
                                                isAmountTooHigh ||
                                                isAmountInvalidDecimals ||
                                                isApprovalInsufficient ||
                                                isSubmittingAction ||
                                                !!supplyPendingTransaction
                                            }
                                            isPending={isSubmittingAction}
                                            pendingTransaction={supplyPendingTransaction}
                                            onMaxClick={handleMaxClick}
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
                    vaultId={vault.id}
                    onCancel={handleApproveModalCancel}
                    onSuccess={handleApproveSuccessTxid}
                />
            )}
        </>
    );
};
