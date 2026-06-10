import { type ReactNode } from 'react';

import { type AccountKey, type TokenSymbol } from '@suite-common/wallet-types';
import { HStack, Text, VStack } from '@suite-native/atoms';
import { CryptoAmountFormatter } from '@suite-native/formatters';
import { type TxKeyPath } from '@suite-native/intl';
import { ReviewOutputItemValues } from '@suite-native/transaction-management';

import { type YieldReviewCard } from './YieldReviewList';

type YieldReviewCardFactoryParams = {
    accountKey: AccountKey;
    amount: string;
    fee: string;
    tokenSymbol: TokenSymbol;
};

type BuildYieldDepositReviewCardsParams = YieldReviewCardFactoryParams & {
    receiveAmount: string;
    receiveTokenSymbol: TokenSymbol;
};

type DetailRowProps = {
    label: string;
    value: ReactNode;
};

type Translate = (id: TxKeyPath) => string;

const DetailRow = ({ label, value }: DetailRowProps) => (
    <HStack justifyContent="space-between" alignItems="center">
        <Text variant="body-sm">{label}</Text>
        {value}
    </HStack>
);

const buildYieldReviewTransactionDetailsCard = (
    { accountKey, amount, fee, tokenSymbol }: YieldReviewCardFactoryParams,
    translate: Translate,
): YieldReviewCard => ({
    content: (
        <VStack spacing="sp16">
            <DetailRow
                label={translate('transactionManagement.review.outputs.summary.amount')}
                value={
                    <CryptoAmountFormatter
                        value={amount}
                        symbol={tokenSymbol}
                        isDiscreetText={false}
                    />
                }
            />
            <ReviewOutputItemValues
                accountKey={accountKey}
                value={fee}
                translationKey="transactionManagement.review.outputs.summary.maxFee"
            />
        </VStack>
    ),
    key: 'details',
    title: translate('earn.yieldReview.transactionDetailsCard.title'),
});

export const buildYieldDepositReviewCards = (
    {
        receiveAmount,
        receiveTokenSymbol,
        ...transactionDetailsParams
    }: BuildYieldDepositReviewCardsParams,
    translate: Translate,
): YieldReviewCard[] => [
    {
        content: (
            <CryptoAmountFormatter
                value={transactionDetailsParams.amount}
                symbol={transactionDetailsParams.tokenSymbol}
                isDiscreetText={false}
            />
        ),
        key: 'deposit',
        title: translate('earn.yieldReview.depositCard.title'),
    },
    {
        content: (
            <CryptoAmountFormatter
                value={receiveAmount}
                symbol={receiveTokenSymbol}
                isDiscreetText={false}
            />
        ),
        key: 'receive',
        title: translate('earn.yieldReview.receiveCard.title'),
    },
    buildYieldReviewTransactionDetailsCard(transactionDetailsParams, translate),
];

export const buildYieldWithdrawReviewCards = (
    params: YieldReviewCardFactoryParams,
    translate: Translate,
): YieldReviewCard[] => [
    {
        content: (
            <CryptoAmountFormatter
                value={params.amount}
                symbol={params.tokenSymbol}
                isDiscreetText={false}
            />
        ),
        key: 'withdraw',
        title: translate('earn.yieldReview.withdrawCard.title'),
    },
    buildYieldReviewTransactionDetailsCard(params, translate),
];
