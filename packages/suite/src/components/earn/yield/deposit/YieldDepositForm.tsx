import { selectDesktopAnalyticsDep } from '@suite/analytics';
import { Translation } from '@suite/intl';
import { events } from '@suite-common/analytics';
import { useServices } from '@suite-common/dependency-injection';
import { getNetworkDisplaySymbol } from '@suite-common/wallet-config';
import { WETH_WRAP_GAS_RESERVE } from '@suite-common/wallet-constants';
import {
    getYieldFlowStepSequence,
    shouldRecommendWrapReserve,
    splitYieldPendingTransaction,
} from '@suite-common/wallet-core';
import { getApyBreakdown } from '@suite-common/wallet-utils';
import { Banner, Column, Text } from '@trezor/components';

import { FormattedCryptoAmount } from 'src/components/suite/FormattedCryptoAmount';
import { useFetchFees } from 'src/components/wallet/Fees/CollapsibleFees/hooks/useFetchFees';
import { useMessageSystemWrappedNative } from 'src/hooks/suite/useMessageSystemWrappedNative';

import { useYieldDepositContext } from './useYieldDepositContext';
import { YieldActionStep } from '../common/YieldActionStep';
import { YieldActionStepWarning } from '../common/YieldActionStepWarning';
import { YieldApproveModal } from '../common/YieldApproveModal';
import { YieldApproveStep } from '../common/YieldApproveStep';
import { YieldApprovedAmountCard } from '../common/YieldApprovedAmountCard';
import { YieldDisabledBanner } from '../common/YieldDisabledBanner';
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
        wrappedAmount,
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
        amountIssues,
        isApprovalInsufficient,
        isSubmittingApprove,
        isSubmittingAction,
        submitWrap,
        skipWrap,
        returnToWrapStep,
        submitApprovalAction,
        skipApprove,
        submitAction,
        revokeAllowance,
        enterModifyApproval,
        handleApproveModalCancel,
        handleApproveSuccessTxid,
        openPendingTransaction,
        retryInitAllowance,
        fiatToggle,
        setMaxAmount,
        flow,
    } = useYieldDepositContext();

    useFetchFees({ networkSymbol: account.symbol });

    const {
        isDisabled: isWrapDisabled,
        content: wrapDisabledContent,
        variant: wrapDisabledVariant,
    } = useMessageSystemWrappedNative('wrap');

    const { approvalPendingTransaction, actionPendingTransaction: depositPendingTransaction } =
        splitYieldPendingTransaction(pendingTransaction, 'deposit');
    const wrapPendingTransaction =
        pendingTransaction?.type === 'wrap' ? pendingTransaction : undefined;

    const nativeSymbol = getNetworkDisplaySymbol(account.symbol);
    // Approximate fiat value shown under the amount input, from the token's own rate.
    const approxFiat = {
        symbol: token.networkSymbol,
        tokenContractAddress: token.contractAddress,
    };
    const sequence = getYieldFlowStepSequence({
        flowType: 'deposit',
        isWrappedNativeVault: flow.isWrappedNativeVault,
    });
    const hasAllowanceError = allowanceStatus === 'error';
    const isAmountEmpty = amountIssues.includes('amount-empty');
    const isAmountTooHigh = amountIssues.includes('amount-too-high');
    const isAmountInvalidDecimals = amountIssues.includes('amount-invalid-decimals');
    const hasBlockingAmountIssue = amountIssues.length > 0;

    const shouldCheckWrapAmount = !isAmountInvalidDecimals && !!wrapPendingTransaction;
    const shouldCheckApproveAmount = !isAmountInvalidDecimals && !!approvalPendingTransaction;
    const shouldCheckDepositAmount = !isAmountInvalidDecimals && !!depositPendingTransaction;

    // Wrapping into the gas reserve is allowed — Max keeps it aside only while the balance covers
    // it — so recommend keeping it rather than blocking. `isAmountTooHigh` only fires above the
    // full balance, and `shouldRecommendWrapReserve` already excludes that over-balance case.
    const showWrapReserveRecommendation =
        flow.currentStep === 'wrap' &&
        shouldCheckWrapAmount &&
        shouldRecommendWrapReserve(liveAmount, account.formattedBalance);

    const renderWrapWarning = () => {
        if (shouldCheckWrapAmount && isAmountTooHigh) {
            return <YieldActionStepWarning isInsufficientFunds />;
        }

        if (showWrapReserveRecommendation) {
            return (
                <YieldActionStepWarning
                    reserveRecommendation={{
                        amount: WETH_WRAP_GAS_RESERVE.toString(),
                        nativeSymbol,
                    }}
                />
            );
        }

        return null;
    };

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

    const handleOnSkipApprove = () => {
        analytics.report({
            type: events.yieldDepositEvent.name,
            payload: {
                type: 'approve',
                action: 'cancel',
                networkSymbol: token.networkSymbol,
                vaultId: vault.id,
            },
        });

        skipApprove();
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
                wrappedNative: flow.isWrappedNativeVault,
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

        // Fill the exact crypto max (and the rounded-down fiat display in fiat mode) without switching.
        setMaxAmount(maxAmount);
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

                            {hasAllowanceError && (
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
                                // Wrapping may be disabled remotely; skipping it stays available so a
                                // user with a wrapped-token balance can still finish the deposit.
                                content: () => (
                                    <Column gap={16}>
                                        {isWrapDisabled && (
                                            <YieldDisabledBanner
                                                type="wrap"
                                                content={wrapDisabledContent}
                                                variant={wrapDisabledVariant}
                                            />
                                        )}
                                        <YieldWrapStep
                                            token={token}
                                            nativeSymbol={nativeSymbol}
                                            availableAmount={account.formattedBalance}
                                            receivingAmount={liveAmount || '0'}
                                            isSubmitting={isSubmittingAction}
                                            isSubmitDisabled={
                                                isWrapDisabled || hasBlockingAmountIssue
                                            }
                                            warning={renderWrapWarning()}
                                            pendingTransaction={wrapPendingTransaction}
                                            fiatToggle={fiatToggle}
                                            onMaxClick={handleMaxClick}
                                            onSubmit={handleOnWrap}
                                            onSkip={
                                                hasWrappedTokenBalance
                                                    ? handleOnSkipWrap
                                                    : undefined
                                            }
                                            onPendingTxClick={openPendingTransaction}
                                        />
                                    </Column>
                                ),
                            },
                            approve: {
                                // For wrapped-native (WETH) vaults the amount is entered in the
                                // preceding wrap step, so the approve step is just "Approve".
                                // Non-wrapped vaults have no wrap step and select the amount here.
                                title: (
                                    <Translation
                                        id={
                                            flow.isWrappedNativeVault
                                                ? 'TR_EARN_YIELD_APPROVE'
                                                : 'TR_EARN_YIELD_SELECT_AMOUNT_AND_APPROVE'
                                        }
                                    />
                                ),
                                onEdit: handleOnModify,
                                content: () => (
                                    <YieldApproveStep
                                        token={token}
                                        approxFiat={approxFiat}
                                        summaryValue={
                                            <FormattedCryptoAmount
                                                value={maxAmount}
                                                symbol={token.symbol}
                                            />
                                        }
                                        approvedAmount={allowanceAmount || undefined}
                                        isApprovedAmountLoading={allowanceStatus === 'loading'}
                                        hasApprovedAmountError={hasAllowanceError}
                                        approvalAction={approvalAction}
                                        canRevokeAllowance={canRevokeAllowance}
                                        warning={
                                            shouldCheckApproveAmount && isAmountTooHigh ? (
                                                <YieldActionStepWarning isApproveOverBalance />
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
                                        fiatToggle={fiatToggle}
                                        onMaxClick={handleMaxClick}
                                        onApprovalSubmit={handleOnApprovalSubmit}
                                        // An unreadable allowance coerces to '0', which would
                                        // otherwise hide Skip just when it is the only way on.
                                        onSkip={
                                            canRevokeAllowance || hasAllowanceError
                                                ? handleOnSkipApprove
                                                : undefined
                                        }
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
                                            hasError={hasAllowanceError}
                                        />
                                    ),
                            },
                            action: {
                                title: <Translation id="TR_EARN_YIELD_DEPOSIT" />,
                                content: () => (
                                    <YieldActionStep
                                        flowType="deposit"
                                        token={token}
                                        approxFiat={approxFiat}
                                        summaryValue={
                                            <FormattedCryptoAmount
                                                value={maxAmount}
                                                symbol={token.symbol}
                                            />
                                        }
                                        warning={
                                            shouldCheckDepositAmount ? (
                                                <YieldActionStepWarning
                                                    isInsufficientFunds={isAmountTooHigh}
                                                    isApprovalInsufficient={isApprovalInsufficient}
                                                    onModifyApproval={handleOnModify}
                                                />
                                            ) : undefined
                                        }
                                        isDisabled={
                                            hasBlockingAmountIssue ||
                                            isApprovalInsufficient ||
                                            isSubmittingAction ||
                                            !!depositPendingTransaction
                                        }
                                        isPending={isSubmittingAction}
                                        pendingTransaction={depositPendingTransaction}
                                        fiatToggle={fiatToggle}
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
                                            // When the deposit wrapped native → wrapped token, show
                                            // the original native asset (ETH) the user started with;
                                            // a deposit of already-held WETH keeps the token symbol.
                                            token:
                                                wrappedAmount !== null
                                                    ? {
                                                          networkSymbol: account.symbol,
                                                          symbol: nativeSymbol,
                                                          decimals: token.decimals,
                                                      }
                                                    : token,
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
