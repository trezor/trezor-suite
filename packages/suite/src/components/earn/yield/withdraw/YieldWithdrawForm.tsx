import { useEffect, useRef } from 'react';

import { events, selectDesktopAnalyticsDep } from '@suite/analytics';
import { Translation } from '@suite/intl';
import { useServices } from '@suite-common/dependency-injection';
import {
    WRAPPED_NATIVE_TOKEN_DECIMALS,
    getNetworkDisplaySymbol,
} from '@suite-common/wallet-config';
import {
    type YieldFlowCompleteValue,
    splitYieldPendingTransaction,
} from '@suite-common/wallet-core';
import { Banner, Column, Switch, Text } from '@trezor/components';

import { FormattedCryptoAmount } from 'src/components/suite/FormattedCryptoAmount';

import { useYieldWithdrawContext } from './useYieldWithdrawContext';
import { YieldActionStep } from '../common/YieldActionStep';
import { YieldActionStepWarning } from '../common/YieldActionStepWarning';
import { YieldFlowCompleteWithdraw } from '../common/YieldFlowCompleteWithdraw';
import { YieldFlowStepList } from '../common/YieldFlowStepList';
import { YieldUnwrapStep } from '../common/YieldUnwrapStep';
import { getApyBreakdown } from '../yieldFlowUtils';

// Wrapped-native withdrawals gain a trailing unwrap step that is not part of the
// withdraw sequence — it is stitched into the rendered list explicitly.
const UNWRAP_FLOW_LIST_STEPS = ['action', 'unwrap'] as const;

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
        isUnwrapFlow,
        isUnwrapEnabled,
        isSubmittingUnwrap,
        unwrappedAmount,
        setAmountInput,
        setUnwrapEnabled,
        submitUnwrap,
        toggleWithdrawFlowType,
        submitAction,
        openPendingTransaction,
        flow,
    } = useYieldWithdrawContext();

    const { actionPendingTransaction: withdrawPendingTransaction, unwrapPendingTransaction } =
        splitYieldPendingTransaction(pendingTransaction, flowType);
    const withdrawInputUnit = flowType === 'redeem' ? 'shares' : 'asset';

    const nativeSymbol = getNetworkDisplaySymbol(token.networkSymbol);
    // The withdrawn wrapped-native amount the unwrap step converts 1:1.
    const receivedTokenAmount = completedOutput?.amount ?? completedInput.amount;
    // After an unwrap, the complete screen reports the received value in the native coin.
    const unwrappedOutput: YieldFlowCompleteValue | undefined = unwrappedAmount
        ? {
              token: {
                  networkSymbol: token.networkSymbol,
                  symbol: nativeSymbol,
                  decimals: WRAPPED_NATIVE_TOKEN_DECIMALS,
                  contractAddress: null,
              },
              amount: unwrappedAmount,
          }
        : undefined;

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

    const handleUnwrapToggle = (isEnabled: boolean) => {
        analytics.report({
            type: events.yieldInteractionEvent.name,
            payload: {
                element: 'receive-as-native-toggle',
                value: isEnabled ? 'on' : 'off',
                networkSymbol: token.networkSymbol,
                vaultId: vault.id,
            },
        });

        setUnwrapEnabled(isEnabled);
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

        submitUnwrap(receivedTokenAmount);
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

    const renderActionStep = () => (
        <YieldActionStep
            flowType={flowType}
            token={flowType === 'redeem' ? receiptToken : token}
            summaryValue={<FormattedCryptoAmount value={maxAmount} symbol={inputTokenSymbol} />}
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
    );

    const renderComplete = () => (
        <YieldFlowCompleteWithdraw
            input={completedInput}
            output={unwrappedOutput ?? completedOutput}
            vaultId={vault.id}
        />
    );

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
                    flowType={flowType}
                    currentStep={flow.currentStep}
                    hasStepList={isUnwrapFlow}
                    listSteps={isUnwrapFlow ? UNWRAP_FLOW_LIST_STEPS : undefined}
                    steps={{
                        action: {
                            title: <Translation id="TR_EARN_YIELD_WITHDRAW" />,
                            content: renderActionStep,
                        },
                        ...(isUnwrapFlow && {
                            unwrap: {
                                title: (
                                    <Translation
                                        id="TR_EARN_YIELD_RECEIVE_AS_NATIVE"
                                        values={{ nativeSymbol }}
                                    />
                                ),
                                rightContent: () => (
                                    <Switch
                                        isChecked={isUnwrapEnabled}
                                        isDisabled={
                                            isSubmittingUnwrap || !!unwrapPendingTransaction
                                        }
                                        onChange={handleUnwrapToggle}
                                    />
                                ),
                                content: () => (
                                    <YieldUnwrapStep
                                        networkSymbol={token.networkSymbol}
                                        tokenSymbol={token.symbol}
                                        nativeSymbol={nativeSymbol}
                                        unwrapAmount={receivedTokenAmount}
                                        isLoading={isSubmittingUnwrap}
                                        pendingTransaction={unwrapPendingTransaction}
                                        onSubmit={handleOnUnwrap}
                                        onPendingTxClick={openPendingTransaction}
                                    />
                                ),
                            },
                        }),
                        complete: {
                            isListItem: false,
                            content: renderComplete,
                        },
                    }}
                />
            </Column>
        </Column>
    );
};
