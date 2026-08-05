import { useEffect, useRef } from 'react';

import { selectDesktopAnalyticsDep } from '@suite/analytics';
import { Translation } from '@suite/intl';
import { events } from '@suite-common/analytics';
import { useServices } from '@suite-common/dependency-injection';
import { getNetwork, getNetworkDisplaySymbol } from '@suite-common/wallet-config';
import { getYieldFlowStepSequence, splitYieldPendingTransaction } from '@suite-common/wallet-core';
import { getApyBreakdown } from '@suite-common/wallet-utils';
import { Banner, Column, Text } from '@trezor/components';

import { FormattedCryptoAmount } from 'src/components/suite/FormattedCryptoAmount';
import { useMessageSystemWrappedNative } from 'src/hooks/suite/useMessageSystemWrappedNative';

import { useYieldWithdrawContext } from './useYieldWithdrawContext';
import { YieldActionStep } from '../common/YieldActionStep';
import { YieldActionStepWarning } from '../common/YieldActionStepWarning';
import { YieldDisabledBanner } from '../common/YieldDisabledBanner';
import { YieldFlowCompleteWithdraw } from '../common/YieldFlowCompleteWithdraw';
import { YieldFlowStepList } from '../common/YieldFlowStepList';
import { YieldUnwrapStep } from '../common/YieldUnwrapStep';

export const YieldWithdrawForm = () => {
    const { analytics } = useServices(selectDesktopAnalyticsDep);

    const {
        account,
        vault,
        token,
        receiptToken,
        maxAmount,
        errorMessage,
        pendingTransaction,
        isAmountEmpty,
        isAmountTooHigh,
        isAmountInvalidDecimals,
        isSubmittingAction,
        inputTokenSymbol,
        otherUnitTokenSymbol,
        canToggleWithdrawUnit,
        flowType,
        completedInput,
        completedOutput,
        selectMaxWithdraw,
        isMaxWithdrawInfoVisible,
        toggleWithdrawFlowType,
        submitAction,
        submitUnwrap,
        skipUnwrap,
        openPendingTransaction,
        fiatToggle,
        setMaxAmount,
        flow,
    } = useYieldWithdrawContext();

    const {
        isDisabled: isUnwrapDisabled,
        content: unwrapDisabledContent,
        variant: unwrapDisabledVariant,
    } = useMessageSystemWrappedNative('unwrap');

    const { actionPendingTransaction: withdrawPendingTransaction } = splitYieldPendingTransaction(
        pendingTransaction,
        flowType,
    );
    const unwrapPendingTransaction =
        pendingTransaction?.type === 'unwrap' ? pendingTransaction : undefined;
    const withdrawInputUnit = flowType === 'redeem' ? 'shares' : 'asset';

    const nativeSymbol = getNetworkDisplaySymbol(account.symbol);
    const withdrawActionToken = flowType === 'redeem' ? receiptToken : token;
    // Approximate fiat value shown under the amount input, from the token's own rate.
    const actionApproxFiat = {
        symbol: withdrawActionToken.networkSymbol,
        tokenContractAddress: withdrawActionToken.contractAddress,
    };
    const unwrapApproxFiat = {
        symbol: token.networkSymbol,
        tokenContractAddress: token.contractAddress,
    };
    const sequence = getYieldFlowStepSequence({
        flowType,
        isWrappedNativeVault: flow.isWrappedNativeVault,
    });

    const handleOnWithdraw = () => {
        const apyBreakdown = getApyBreakdown(vault.rewardRate?.components);
        analytics.report({
            type: events.yieldWithdrawEvent.name,
            payload: {
                type: 'withdraw',
                operation: flowType,
                action: 'continue',
                networkSymbol: token.networkSymbol,
                vaultId: vault.id,
                wrappedNative: flow.isWrappedNativeVault,
                ...(apyBreakdown && { apyBreakdown }),
            },
        });

        submitAction();
    };

    const handleOnUnwrap = () => {
        analytics.report({
            type: events.yieldWithdrawEvent.name,
            payload: {
                type: 'unwrap',
                operation: flowType,
                action: 'continue',
                networkSymbol: token.networkSymbol,
                vaultId: vault.id,
            },
        });

        submitUnwrap();
    };

    const handleOnSkipUnwrap = () => {
        analytics.report({
            type: events.yieldWithdrawEvent.name,
            payload: {
                type: 'unwrap',
                operation: flowType,
                action: 'cancel',
                networkSymbol: token.networkSymbol,
                vaultId: vault.id,
            },
        });

        skipUnwrap();
    };

    const handleToggleWithdrawInputUnit = () => {
        const nextUnit = withdrawInputUnit === 'shares' ? 'asset' : 'shares';

        analytics.report({
            type: events.yieldInteractionEvent.name,
            payload: {
                element: 'withdraw-unit-toggle',
                value: nextUnit,
                networkSymbol: token.networkSymbol,
                vaultId: vault.id,
            },
        });

        toggleWithdrawFlowType();
    };

    // Fire once per form mount when the user first hits the insufficient-funds banner
    // (no actionable button on this banner, so impression is the only signal available).
    const hasFiredInsufficientFundsRef = useRef(false);
    const showsInsufficientFunds = !isAmountInvalidDecimals && isAmountTooHigh;

    useEffect(() => {
        if (!showsInsufficientFunds || hasFiredInsufficientFundsRef.current) {
            return;
        }
        hasFiredInsufficientFundsRef.current = true;

        analytics.report({
            type: events.yieldInteractionEvent.name,
            payload: {
                element: 'insufficient-funds-banner',
                networkSymbol: token.networkSymbol,
                vaultId: vault.id,
            },
        });
    }, [showsInsufficientFunds, analytics, token.networkSymbol, vault.id]);

    const handleMaxClick = () => {
        analytics.report({
            type: events.yieldInteractionEvent.name,
            payload: {
                element: 'withdraw-max',
                value: withdrawInputUnit,
                networkSymbol: token.networkSymbol,
                vaultId: vault.id,
            },
        });

        selectMaxWithdraw();
    };

    const getWithdrawWarning = () => {
        if (!isAmountInvalidDecimals && isAmountTooHigh) {
            return <YieldActionStepWarning isInsufficientFunds={isAmountTooHigh} />;
        }

        if (isMaxWithdrawInfoVisible) {
            return (
                <Banner
                    intent="info"
                    description={
                        <Translation
                            id="TR_EARN_YIELD_MAX_WITHDRAW_INFO"
                            values={{ receiptTokenSymbol: receiptToken.symbol }}
                        />
                    }
                />
            );
        }

        return undefined;
    };

    return (
        <Column width="100%" alignItems="center">
            <Column gap={24} width="100%" maxWidth={500}>
                {flow.currentStep !== 'complete' && (
                    <>
                        <Text typographyStyle="headline-md">
                            <Translation id="TR_EARN_YIELD_WITHDRAW" />
                        </Text>

                        {errorMessage && (
                            <Banner
                                intent="warning"
                                description={<Translation id={errorMessage} />}
                            />
                        )}
                    </>
                )}

                <YieldFlowStepList
                    sequence={sequence}
                    currentStep={flow.currentStep}
                    hasStepList={sequence.includes('unwrap')}
                    steps={{
                        action: {
                            title: <Translation id="TR_EARN_YIELD_WITHDRAW_ASSETS" />,
                            content: () => (
                                <YieldActionStep
                                    flowType={flowType}
                                    token={withdrawActionToken}
                                    approxFiat={actionApproxFiat}
                                    summaryValue={
                                        <FormattedCryptoAmount
                                            value={maxAmount}
                                            symbol={inputTokenSymbol}
                                            isBalance
                                        />
                                    }
                                    warning={getWithdrawWarning()}
                                    isDisabled={
                                        isAmountEmpty ||
                                        isAmountTooHigh ||
                                        isAmountInvalidDecimals ||
                                        isSubmittingAction ||
                                        !!withdrawPendingTransaction
                                    }
                                    isPending={isSubmittingAction}
                                    pendingTransaction={withdrawPendingTransaction}
                                    // Toggling the unit switches `flowType`, disposing the
                                    // session — mid-submit that drops a broadcast transaction.
                                    unitToggle={
                                        canToggleWithdrawUnit && !isSubmittingAction
                                            ? {
                                                  otherTokenSymbol: otherUnitTokenSymbol,
                                                  onClick: handleToggleWithdrawInputUnit,
                                              }
                                            : undefined
                                    }
                                    onMaxClick={handleMaxClick}
                                    onSubmit={handleOnWithdraw}
                                    onPendingTxClick={openPendingTransaction}
                                />
                            ),
                        },
                        unwrap: {
                            title: (
                                <Translation
                                    id="TR_EARN_YIELD_UNWRAP_TITLE"
                                    values={{ tokenSymbol: token.symbol, nativeSymbol }}
                                />
                            ),
                            description: (
                                <Translation
                                    id="TR_EARN_YIELD_UNWRAP_DESCRIPTION"
                                    values={{
                                        tokenSymbol: token.symbol,
                                        networkName: getNetwork(account.symbol).name,
                                    }}
                                />
                            ),
                            // Unwrapping may be disabled remotely; skipping it stays available so the
                            // user can finish the flow and keep the wrapped token.
                            content: () => (
                                <Column gap={16}>
                                    {isUnwrapDisabled && (
                                        <YieldDisabledBanner
                                            type="unwrap"
                                            content={unwrapDisabledContent}
                                            variant={unwrapDisabledVariant}
                                        />
                                    )}
                                    <YieldUnwrapStep
                                        tokenSymbol={token.symbol}
                                        tokenDecimals={token.decimals}
                                        tokenBalance={token.balance}
                                        approxFiat={unwrapApproxFiat}
                                        fiatToggle={fiatToggle}
                                        onMaxClick={() => setMaxAmount(token.balance)}
                                        isSubmitting={isSubmittingAction}
                                        isSubmitDisabled={
                                            isUnwrapDisabled ||
                                            isAmountEmpty ||
                                            isAmountTooHigh ||
                                            isAmountInvalidDecimals
                                        }
                                        warning={
                                            !isAmountInvalidDecimals && isAmountTooHigh ? (
                                                <YieldActionStepWarning isInsufficientFunds />
                                            ) : undefined
                                        }
                                        pendingTransaction={unwrapPendingTransaction}
                                        onSubmit={handleOnUnwrap}
                                        onSkip={handleOnSkipUnwrap}
                                        onPendingTxClick={openPendingTransaction}
                                    />
                                </Column>
                            ),
                        },
                        complete: {
                            isListItem: false,
                            content: () => (
                                <YieldFlowCompleteWithdraw
                                    input={completedInput}
                                    output={completedOutput}
                                    vaultId={vault.id}
                                />
                            ),
                        },
                    }}
                />
            </Column>
        </Column>
    );
};
