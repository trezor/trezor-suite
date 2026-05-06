import { useEffect } from 'react';

import { events } from '@suite/analytics';
import { Translation, useTranslation } from '@suite/intl';
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
    const { translationString } = useTranslation();

    const {
        token,
        receiptToken,
        maxAmount,
        completedAmount,
        completedReceiptAmount,
        errorMessage,
        pendingTransaction,
        actionNetworkFeeWarning,
        isAmountEmpty,
        isAmountTooHigh,
        isSubmittingAction,
        setAmountInput,
        submitAction,
        openPendingTransaction,
        flow,
    } = useYieldWithdrawContext();

    const { actionPendingTransaction: withdrawPendingTransaction } = splitYieldPendingTransaction(
        pendingTransaction,
        'withdraw',
    );

    // trigger success analytics event
    useEffect(() => {
        if (flow.currentStep === 'complete') {
            analytics.report({
                type: events.yieldWithdrawEvent.name,
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
                type: events.yieldWithdrawEvent.name,
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

    const handleOnWithdraw = () => {
        analytics.report({
            type: events.yieldWithdrawEvent.name,
            payload: {
                type: 'withdraw',
                action: 'continue',
                networkSymbol: token.networkSymbol,
                contractAddress: token.contractAddress ?? undefined,
            },
        });

        submitAction();
    };

    return (
        <Column width="100%" alignItems="center">
            <Column gap={24} width="100%" maxWidth={500}>
                {flow.currentStep === 'complete' ? (
                    <YieldFlowCompleteWithdraw
                        input={{
                            token: receiptToken,
                            amount: completedReceiptAmount,
                        }}
                        output={{
                            token,
                            amount: completedAmount,
                        }}
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
                            token={token}
                            summaryValue={
                                <FormattedCryptoAmount value={maxAmount} symbol={token.symbol} />
                            }
                            warning={
                                <YieldActionStepWarning isInsufficientFunds={isAmountTooHigh} />
                            }
                            networkFeeWarning={
                                actionNetworkFeeWarning ? (
                                    <YieldActionStepWarning
                                        networkFeeWarning={actionNetworkFeeWarning}
                                    />
                                ) : undefined
                            }
                            isDisabled={isAmountEmpty || isAmountTooHigh || isSubmittingAction}
                            isPending={isSubmittingAction}
                            pendingTransaction={withdrawPendingTransaction}
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
