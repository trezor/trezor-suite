import { Translation } from '@suite/intl';
import { Banner, Column, Text } from '@trezor/components';

import { FormattedCryptoAmount } from 'src/components/suite/FormattedCryptoAmount';

import { useYieldWithdrawContext } from './useYieldWithdrawContext';
import { YieldActionStep } from '../common/YieldActionStep';
import { YieldActionStepWarning } from '../common/YieldActionStepWarning';
import { YieldFlowComplete } from '../common/YieldFlowComplete';
import { splitYieldPendingTransaction } from '../yieldFlowUtils';

export const YieldWithdrawForm = () => {
    const {
        token,
        receiptToken,
        maxAmount,
        liveAmount,
        completedAmount,
        completedReceiptAmount,
        errorMessage,
        pendingTransaction,
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

    return (
        <Column width="100%" alignItems="center">
            <Column gap={24} width="100%" maxWidth={500}>
                {flow.currentStep === 'complete' ? (
                    <YieldFlowComplete
                        flowType="withdraw"
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
                            isDisabled={!liveAmount || isAmountTooHigh || isSubmittingAction}
                            pendingTransaction={withdrawPendingTransaction}
                            onMaxClick={() => setAmountInput(maxAmount)}
                            onSubmit={submitAction}
                            onPendingTxClick={openPendingTransaction}
                        />
                    </>
                )}
            </Column>
        </Column>
    );
};
