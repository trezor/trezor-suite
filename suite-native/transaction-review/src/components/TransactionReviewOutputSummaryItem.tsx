import { useMemo } from 'react';

import { VStack } from '@suite-native/atoms';
import { Translation } from '@suite-native/intl';
import { isNetworkWithTokens } from '@suite-native/tokens';
import { BigNumber } from '@trezor/utils';

import { TransactionReviewOutputCard } from './TransactionReviewOutputCard';
import { TransactionReviewOutputItemValues } from './TransactionReviewOutputItemValues';
import { useTransactionReview } from '../hooks/useTransactionReview';

const BitcoinValues = () => {
    const review = useTransactionReview();

    if (!review.summary) return null;

    return (
        <>
            <TransactionReviewOutputItemValues
                accountKey={review.accountKey}
                tokenContract={review.tokenContract}
                value={review.summary.totalSpent}
                translationKey="transactionManagement.review.outputs.summary.totalAmount"
            />

            <TransactionReviewOutputItemValues
                accountKey={review.accountKey}
                tokenContract={review.tokenContract}
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

        if (review.tokenContract) return review.summary.totalSpent;

        return new BigNumber(review.summary.totalSpent).minus(review.summary.fee).toString();
    }, [review.summary, review.tokenContract]);

    if (!review.account || !review.summary) return null;

    return (
        <>
            {!!amount && (
                <TransactionReviewOutputItemValues
                    accountKey={review.account?.key}
                    tokenContract={review.tokenContract}
                    value={amount}
                    translationKey="transactionManagement.review.outputs.summary.amount"
                />
            )}

            <TransactionReviewOutputItemValues
                accountKey={review.account?.key}
                tokenContract={review.tokenContract}
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
