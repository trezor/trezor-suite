import { events, selectDesktopAnalyticsDep } from '@suite/analytics';
import { Translation } from '@suite/intl';
import { useServices } from '@suite-common/dependency-injection';
import { splitYieldPendingTransaction } from '@suite-common/wallet-core';
import { Banner, Button, Column, Row, StepList, Text } from '@trezor/components';

import { FormattedCryptoAmount } from 'src/components/suite/FormattedCryptoAmount';

import { useYieldDepositContext } from './useYieldDepositContext';
import { YieldActionStep } from '../common/YieldActionStep';
import { YieldActionStepWarning } from '../common/YieldActionStepWarning';
import { YieldApproveModal } from '../common/YieldApproveModal';
import { YieldApproveStep } from '../common/YieldApproveStep';
import { YieldFlowCompleteDeposit } from '../common/YieldFlowCompleteDeposit';
import { getApyBreakdown } from '../yieldFlowUtils';

export const YieldDepositForm = () => {
    const { analytics } = useServices(selectDesktopAnalyticsDep);

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
    } = useYieldDepositContext();

    const { approve: approveStepState, action: actionStepState } = flow.stepStates;

    const { approvalPendingTransaction, actionPendingTransaction: depositPendingTransaction } =
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

    const handleOnDeposit = () => {
        const apyBreakdown = getApyBreakdown(vault.rewardRate?.components);
        analytics.report({
            type: events.yieldDepositEvent.name,
            payload: {
                type: 'deposit',
                action: 'continue',
                networkSymbol: token.networkSymbol,
                vaultId: vault.id,
                ...(apyBreakdown && { apyBreakdown }),
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
                        <YieldFlowCompleteDeposit
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
                                <Translation id="TR_EARN_YIELD_DEPOSIT" />
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

                            <StepList
                                isOrdered
                                bulletSize="large"
                                bulletGap={12}
                                gap={24}
                                titleGap={16}
                            >
                                <StepList.Item
                                    state={approveStepState}
                                    title={
                                        <Column gap={8} width="100%">
                                            <Text
                                                typographyStyle="body-xs"
                                                intent="neutral"
                                                priority="secondary"
                                                case="uppercase"
                                            >
                                                <Translation
                                                    id="TR_STEP_OF_TOTAL"
                                                    values={{
                                                        index: 1,
                                                        total: 2,
                                                    }}
                                                />
                                            </Text>

                                            <Row
                                                justifyContent="space-between"
                                                alignItems="center"
                                                width="100%"
                                                gap={16}
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
                                        </Column>
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
                                </StepList.Item>

                                <StepList.Item
                                    state={actionStepState}
                                    title={
                                        <Column gap={8} width="100%">
                                            <Text
                                                typographyStyle="body-xs"
                                                intent="neutral"
                                                priority="secondary"
                                                case="uppercase"
                                            >
                                                <Translation
                                                    id="TR_STEP_OF_TOTAL"
                                                    values={{
                                                        index: 2,
                                                        total: 2,
                                                    }}
                                                />
                                            </Text>

                                            <Row
                                                justifyContent="space-between"
                                                alignItems="center"
                                                width="100%"
                                                gap={16}
                                            >
                                                <Translation id="TR_EARN_YIELD_DEPOSIT" />
                                            </Row>
                                        </Column>
                                    }
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
                                                !!depositPendingTransaction
                                            }
                                            isPending={isSubmittingAction}
                                            pendingTransaction={depositPendingTransaction}
                                            onMaxClick={handleMaxClick}
                                            onSubmit={handleOnDeposit}
                                            onPendingTxClick={openPendingTransaction}
                                        />
                                    )}
                                </StepList.Item>
                            </StepList>
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
                    preapprovedAmount={allowanceAmount}
                />
            )}
        </>
    );
};
