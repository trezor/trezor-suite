import { selectDesktopAnalyticsDep } from '@suite/analytics';
import { Translation } from '@suite/intl';
import { events } from '@suite-common/analytics';
import { useServices } from '@suite-common/dependency-injection';
import { getNetworkDisplaySymbol } from '@suite-common/wallet-config';
import { getYieldFlowStepSequence, splitYieldPendingTransaction } from '@suite-common/wallet-core';
import { getApyBreakdown } from '@suite-common/wallet-utils';
import { Banner, Column, Text } from '@trezor/components';

import { FormattedCryptoAmount } from 'src/components/suite/FormattedCryptoAmount';

import { useYieldDepositContext } from './useYieldDepositContext';
import { YieldActionStep } from '../common/YieldActionStep';
import { YieldActionStepWarning } from '../common/YieldActionStepWarning';
import { YieldApproveModal } from '../common/YieldApproveModal';
import { YieldApproveStep } from '../common/YieldApproveStep';
import { YieldApprovedAmountCard } from '../common/YieldApprovedAmountCard';
import { YieldFlowCompleteDeposit } from '../common/YieldFlowCompleteDeposit';
import { YieldFlowStepList } from '../common/YieldFlowStepList';
import { YieldWrapStep } from '../common/YieldWrapStep';

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
        liveAmount,
        errorMessage,
        approveModalState,
        pendingTransaction,
        allowanceAmount,
        allowanceStatus,
        approvalAction,
        canRevokeAllowance,
        hasWrappedTokenBalance,
        isAmountEmpty,
        isAmountTooHigh,
        isAmountInvalidDecimals,
        isApprovalInsufficient,
        isSubmittingApprove,
        isSubmittingAction,
        setAmountInput,
        submitWrap,
        skipWrap,
        returnToWrapStep,
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

    const { approvalPendingTransaction, actionPendingTransaction: depositPendingTransaction } =
        splitYieldPendingTransaction(pendingTransaction, 'deposit');
    const wrapPendingTransaction =
        pendingTransaction?.type === 'wrap' ? pendingTransaction : undefined;

    const nativeSymbol = getNetworkDisplaySymbol(account.symbol);
    const sequence = getYieldFlowStepSequence({
        flowType: 'deposit',
        isWrappedNativeVault: flow.isWrappedNativeVault,
    });

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

    const handleOnWrap = () => {
        analytics.report({
            type: events.yieldDepositEvent.name,
            payload: {
                type: 'wrap',
                action: 'continue',
                networkSymbol: token.networkSymbol,
                vaultId: vault.id,
            },
        });

        submitWrap();
    };

    const handleOnSkipWrap = () => {
        analytics.report({
            type: events.yieldDepositEvent.name,
            payload: {
                type: 'wrap',
                action: 'cancel',
                networkSymbol: token.networkSymbol,
                vaultId: vault.id,
            },
        });

        skipWrap();
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
                    {flow.currentStep !== 'complete' && (
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
                        </>
                    )}

                    <YieldFlowStepList
                        sequence={sequence}
                        currentStep={flow.currentStep}
                        hasStepList
                        steps={{
                            wrap: {
                                title: (
                                    <Translation
                                        id="TR_EARN_YIELD_WRAP_TITLE"
                                        values={{ nativeSymbol, tokenSymbol: token.symbol }}
                                    />
                                ),
                                description: (
                                    <Translation
                                        id="TR_EARN_YIELD_WRAP_DESCRIPTION"
                                        values={{ nativeSymbol }}
                                    />
                                ),
                                onEdit: returnToWrapStep,
                                content: () => (
                                    <YieldWrapStep
                                        token={token}
                                        nativeSymbol={nativeSymbol}
                                        availableAmount={maxAmount}
                                        receivingAmount={liveAmount || '0'}
                                        isSubmitting={isSubmittingAction}
                                        isSubmitDisabled={
                                            isAmountEmpty ||
                                            isAmountTooHigh ||
                                            isAmountInvalidDecimals
                                        }
                                        warning={
                                            !isAmountInvalidDecimals && isAmountTooHigh ? (
                                                <YieldActionStepWarning isInsufficientFunds />
                                            ) : undefined
                                        }
                                        pendingTransaction={wrapPendingTransaction}
                                        onMaxClick={handleMaxClick}
                                        onSubmit={handleOnWrap}
                                        onSkip={
                                            hasWrappedTokenBalance ? handleOnSkipWrap : undefined
                                        }
                                        onPendingTxClick={openPendingTransaction}
                                    />
                                ),
                            },
                            approve: {
                                title: <Translation id="TR_EARN_YIELD_SELECT_AMOUNT_AND_APPROVE" />,
                                onEdit: handleOnModify,
                                content: () => (
                                    <YieldApproveStep
                                        token={token}
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
                                            (flow.isWrappedNativeVault && isAmountTooHigh) ||
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
                                ),
                                inactiveContent: view =>
                                    view.state === 'done' && (
                                        <YieldApprovedAmountCard
                                            token={token}
                                            amount={allowanceAmount}
                                            isLoading={allowanceStatus === 'loading'}
                                            hasError={allowanceStatus === 'error'}
                                        />
                                    ),
                            },
                            action: {
                                title: <Translation id="TR_EARN_YIELD_DEPOSIT" />,
                                content: () => (
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
                                                    isApprovalInsufficient={isApprovalInsufficient}
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
                                ),
                            },
                            complete: {
                                isListItem: false,
                                content: () => (
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
                                ),
                            },
                        }}
                    />
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
