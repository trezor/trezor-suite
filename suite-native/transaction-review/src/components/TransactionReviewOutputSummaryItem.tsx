import { VStack } from '@suite-native/atoms';
import { Translation } from '@suite-native/intl';
import { isNetworkWithTokens } from '@suite-native/tokens';
import { BigNumber } from '@trezor/utils';
import { useMemo } from 'react';
import { useTransactionReview } from '../hooks/useTransactionReview';
import { TransactionReviewOutputCard } from './TransactionReviewOutputCard';
import { TransactionReviewOutputItemValues } from './TransactionReviewOutputItemValues';

const BitcoinValues = () => {
    const review = useTransactionReview();

    if (!review.account || !review.summary) return null;

    return (
        <>
            <TransactionReviewOutputItemValues
                value={review.summary.totalSpent}
                translationKey="transactionManagement.review.outputs.summary.totalAmount"
            />

            <TransactionReviewOutputItemValues
                value={review.summary.fee}
                translationKey="transactionManagement.review.outputs.summary.fee"
            />
        </>
    );
};

const TokenValues = () => {
    const review = useTransactionReview();

    const amount = useMemo(() => {
        if (!review.summary) return undefined;
        if (!!review.flowType && review.flowType !== 'swap') return undefined;

        if (review.tokenContract) return review.summary.totalSpent;

        return new BigNumber(review.summary.totalSpent).minus(review.summary.fee).toString();
    }, [review.summary, review.flowType]);

    if (!review.account || !review.summary) return null;

    return (
        <>
            {!!amount && !review.isClearSignedTradingSwap && (
                <TransactionReviewOutputItemValues
                    value={amount}
                    translationKey="transactionManagement.review.outputs.summary.amount"
                />
            )}

            <TransactionReviewOutputItemValues
                value={review.summary.fee}
                translationKey="transactionManagement.review.outputs.summary.maxFee"
            />
        </>
    );
};

export const TransactionReviewOutputSummaryItem = () => {
    const review = useTransactionReview();

    if (!review.summary || !review.account) return null;

    const isNetworkSupportingTokens = isNetworkWithTokens(review.account.symbol);

    return (
        <TransactionReviewOutputCard
            title={<Translation id={review.summaryTranslationId} />}
            outputState={review.summary.state}
        >
            <VStack spacing="sp16">
                {isNetworkSupportingTokens ? <TokenValues /> : <BitcoinValues />}
            </VStack>
        </TransactionReviewOutputCard>
    );
};
