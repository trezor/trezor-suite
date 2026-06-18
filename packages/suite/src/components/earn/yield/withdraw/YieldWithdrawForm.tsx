import { useEffect, useRef } from 'react';

import { events, selectDesktopAnalyticsDep } from '@suite/analytics';
import { Translation } from '@suite/intl';
import { useServices } from '@suite-common/dependency-injection';
import { splitYieldPendingTransaction } from '@suite-common/wallet-core';
import { Banner, Column, Text } from '@trezor/components';

import { FormattedCryptoAmount } from 'src/components/suite/FormattedCryptoAmount';

import { useYieldWithdrawContext } from './useYieldWithdrawContext';
import { YieldActionStep } from '../common/YieldActionStep';
import { YieldActionStepWarning } from '../common/YieldActionStepWarning';
import { YieldFlowCompleteWithdraw } from '../common/YieldFlowCompleteWithdraw';
import { getApyBreakdown } from '../yieldFlowUtils';

export const YieldWithdrawForm = () => {
    const { analytics } = useServices(selectDesktopAnalyticsDep);

    const {
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
        setAmountInput,
        toggleWithdrawFlowType,
        submitAction,
        openPendingTransaction,
        flow,
    } = useYieldWithdrawContext();

    const { actionPendingTransaction: withdrawPendingTransaction } = splitYieldPendingTransaction(
        pendingTransaction,
        flowType,
    );
    const withdrawInputUnit = flowType === 'redeem' ? 'shares' : 'asset';

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
                ...(apyBreakdown && { apyBreakdown }),
            },
        });

        submitAction();
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

        setAmountInput(maxAmount);
    };

    return (
        <Column width="100%" alignItems="center">
            <Column gap={24} width="100%" maxWidth={500}>
                {flow.currentStep === 'complete' ? (
                    <YieldFlowCompleteWithdraw
                        input={completedInput}
                        output={completedOutput}
                        vaultId={vault.id}
                    />
                ) : (
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

                        <YieldActionStep
                            flowType={flowType}
                            token={flowType === 'redeem' ? receiptToken : token}
                            summaryValue={
                                <FormattedCryptoAmount
                                    value={maxAmount}
                                    symbol={inputTokenSymbol}
                                />
                            }
                            warning={
                                !isAmountInvalidDecimals && isAmountTooHigh ? (
                                    <YieldActionStepWarning isInsufficientFunds={isAmountTooHigh} />
                                ) : undefined
                            }
                            isDisabled={
                                isAmountEmpty ||
                                isAmountTooHigh ||
                                isAmountInvalidDecimals ||
                                isSubmittingAction ||
                                !!withdrawPendingTransaction
                            }
                            isPending={isSubmittingAction}
                            pendingTransaction={withdrawPendingTransaction}
                            unitToggle={
                                canToggleWithdrawUnit
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
                    </>
                )}
            </Column>
        </Column>
    );
};
