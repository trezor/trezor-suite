import { injectDesktopAnalytics } from '@suite/analytics';
import { Translation } from '@suite/intl';
import { events } from '@suite-common/analytics';
import { useFormatters } from '@suite-common/formatters';
import { getNetworkDisplaySymbol } from '@suite-common/wallet-config';
import {
    getWrapReserveStatus,
    getYieldFlowStepSequence,
    splitYieldPendingTransaction,
    useFetchFees,
} from '@suite-common/wallet-core';
import { getApyBreakdown } from '@suite-common/wallet-utils';
import { Banner, Column, Text } from '@trezor/components';
import { useServices } from '@trezor/dependency-injection';

import { FormattedCryptoAmount } from 'src/components/suite/FormattedCryptoAmount';
import { useIsFeeRefetchDisabled } from 'src/components/wallet/Fees/CollapsibleFees/hooks/useIsFeeRefetchDisabled';
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
    const { analytics } = useServices(injectDesktopAnalytics);
    const { CryptoAmountFormatter } = useFormatters();

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
        gasReserve,
        nativeFeeStatus,
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

    const isRefetchDisabled = useIsFeeRefetchDisabled();
    useFetchFees({ networkSymbol: account.symbol, isRefetchDisabled });

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

    const shouldCheckWrapAmount = !isAmountInvalidDecimals && !wrapPendingTransaction;
    const shouldCheckApproveAmount = !isAmountInvalidDecimals && !approvalPendingTransaction;
    const shouldCheckDepositAmount = !isAmountInvalidDecimals && !depositPendingTransaction;

    const isNativeFeeInsufficient = nativeFeeStatus === 'insufficient';

    const formatReserve = (reserve: string) =>
        CryptoAmountFormatter.format(reserve, {
            symbol: account.symbol,
            isBalance: true,
            withSymbol: false,
        });
    // The wrap step blocks unless the balance exceeds the recommended reserve, the later steps
    // only below the minimum one, so each quotes the threshold that blocks it.
    const blockingReserve =
        flow.currentStep === 'wrap' ? gasReserve.recommended : gasReserve.minimum;

    const insufficientFeeReserve = isNativeFeeInsufficient
        ? { amount: formatReserve(blockingReserve), nativeSymbol }
        : undefined;

    const feeReserveTopUpRecommendation =
        nativeFeeStatus === 'below-recommended'
            ? { amount: formatReserve(gasReserve.recommended), nativeSymbol }
            : undefined;

    // Max keeps the recommended reserve aside and says so; wrapping into it manually stays
    // allowed with a recommendation, while a balance that does not exceed the reserve blocks the
    // step outright. `isAmountTooHigh` only fires above the full balance, which the status
    // already excludes.
    const wrapReserveStatus =
        flow.currentStep === 'wrap' && shouldCheckWrapAmount
            ? getWrapReserveStatus({
                  amountInput: liveAmount,
                  nativeFormattedBalance: account.formattedBalance,
                  reserve: gasReserve.recommended,
              })
            : 'none';

    const wrapReserveNotice = { amount: formatReserve(gasReserve.recommended), nativeSymbol };

    const renderWrapWarning = () => {
        if (!wrapPendingTransaction && insufficientFeeReserve) {
            return <YieldActionStepWarning insufficientFeeReserve={insufficientFeeReserve} />;
        }

        if (shouldCheckWrapAmount && isAmountTooHigh) {
            return <YieldActionStepWarning isInsufficientFunds />;
        }

        if (wrapReserveStatus === 'kept') {
            return <YieldActionStepWarning reserveKept={wrapReserveNotice} />;
        }

        if (wrapReserveStatus === 'below') {
            return <YieldActionStepWarning reserveRecommendation={wrapReserveNotice} />;
        }

        return null;
    };

    const renderApproveWarning = () => {
        if (approvalPendingTransaction) {
            return undefined;
        }

        if (insufficientFeeReserve) {
            return <YieldActionStepWarning insufficientFeeReserve={insufficientFeeReserve} />;
        }

        if (shouldCheckApproveAmount && isAmountTooHigh) {
            return <YieldActionStepWarning isApproveOverBalance />;
        }

        if (feeReserveTopUpRecommendation) {
            return (
                <YieldActionStepWarning
                    feeReserveTopUpRecommendation={feeReserveTopUpRecommendation}
                />
            );
        }

        return undefined;
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
                                                isWrapDisabled ||
                                                hasBlockingAmountIssue ||
                                                isNativeFeeInsufficient
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
                                        warning={renderApproveWarning()}
                                        isDisabled={
                                            isAmountEmpty ||
                                            isAmountInvalidDecimals ||
                                            isNativeFeeInsufficient ||
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
                                                    insufficientFeeReserve={insufficientFeeReserve}
                                                    feeReserveTopUpRecommendation={
                                                        feeReserveTopUpRecommendation
                                                    }
                                                    onModifyApproval={handleOnModify}
                                                />
                                            ) : undefined
                                        }
                                        isDisabled={
                                            hasBlockingAmountIssue ||
                                            isApprovalInsufficient ||
                                            isNativeFeeInsufficient ||
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
