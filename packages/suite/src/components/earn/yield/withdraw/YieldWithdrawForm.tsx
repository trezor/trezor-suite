import { useEffect } from 'react';

import { events } from '@suite/analytics';
import { Translation } from '@suite/intl';
import { splitYieldPendingTransaction } from '@suite-common/wallet-core';
import { Banner, Column, Text } from '@trezor/components';

import { FormattedCryptoAmount } from 'src/components/suite/FormattedCryptoAmount';
import { useAnalytics } from 'src/support/useAnalytics';

import { useYieldWithdrawContext } from './useYieldWithdrawContext';
import { YieldActionStep } from '../common/YieldActionStep';
import { YieldActionStepWarning } from '../common/YieldActionStepWarning';
import { YieldFlowCompleteWithdraw } from '../common/YieldFlowCompleteWithdraw';

export const YieldWithdrawForm = () => {
    const analytics = useAnalytics();

    const {
        vault,
        token,
        receiptToken,
        maxAmount,
        completedAmount,
        errorMessage,
        pendingTransaction,
        isAmountEmpty,
        isAmountTooHigh,
        isAmountInvalidDecimals,
        isSubmittingAction,
        inputTokenSymbol,
        otherUnitTokenSymbol,
        canToggleWithdrawUnit,
        withdrawInputUnit,
        setAmountInput,
        toggleWithdrawInputUnit,
        submitAction,
        openPendingTransaction,
        flow,
    } = useYieldWithdrawContext();

    const { actionPendingTransaction: withdrawPendingTransaction } = splitYieldPendingTransaction(
        pendingTransaction,
        'withdraw',
    );

    const handleOnWithdraw = () => {
        analytics.report({
            type: events.yieldWithdrawEvent.name,
            payload: {
                type: 'withdraw',
                action: 'continue',
                networkSymbol: token.networkSymbol,
                vaultId: vault.id,
            },
        });

        submitAction();
    };

    return (
        <Column width="100%" alignItems="center">
            <Column gap={24} width="100%" maxWidth={500}>
                {flow.currentStep === 'complete' ? (
                    <YieldFlowCompleteWithdraw
                        value={{
                            token: withdrawInputUnit === 'shares' ? receiptToken : token,
                            amount: completedAmount,
                        }}
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
                            flowType="withdraw"
                            token={withdrawInputUnit === 'shares' ? receiptToken : token}
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
                                          onClick: toggleWithdrawInputUnit,
                                      }
                                    : undefined
                            }
                            onMaxClick={() => setAmountInput(maxAmount)}
                            onSubmit={handleOnWithdraw}
                            onPendingTxClick={openPendingTransaction}
                        />
                    </>
                )}
            </Column>
        </Column>
    );
};
