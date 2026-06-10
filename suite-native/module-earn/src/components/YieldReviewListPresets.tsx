import { type ReactNode } from 'react';

import { type YieldFlowCompleteRewardItem } from '@suite-common/wallet-core';
import { type AccountKey, type TokenSymbol } from '@suite-common/wallet-types';
import { HStack, Text, VStack } from '@suite-native/atoms';
import { CryptoAmountFormatter } from '@suite-native/formatters';
import { type TxKeyPath } from '@suite-native/intl';
import { ReviewOutputItemValues } from '@suite-native/transaction-management';

import { YieldClaimRewardRow, getYieldClaimRewardFiatAmount } from './YieldClaimRewardRow';
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

type BuildYieldClaimReviewCardsParams = {
    accountKey: AccountKey;
    fee: string;
    rewards: YieldFlowCompleteRewardItem[];
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

const buildYieldClaimReviewTransactionDetailsCard = (
    { accountKey, fee }: Pick<BuildYieldClaimReviewCardsParams, 'accountKey' | 'fee'>,
    translate: Translate,
): YieldReviewCard => ({
    content: (
        <ReviewOutputItemValues
            accountKey={accountKey}
            value={fee}
            translationKey="transactionManagement.review.outputs.summary.maxFee"
        />
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

export const buildYieldClaimReviewCards = (
    { rewards, ...transactionDetailsParams }: BuildYieldClaimReviewCardsParams,
    translate: Translate,
): YieldReviewCard[] => [
    {
        content: (
            <VStack spacing="sp12">
                {rewards.map((reward, index) => (
                    <YieldClaimRewardRow
                        key={`${reward.token.contractAddress ?? reward.token.symbol}:${index}`}
                        amount={reward.value}
                        fiatAmount={getYieldClaimRewardFiatAmount(reward.fiatValue)}
                        networkSymbol={reward.token.networkSymbol}
                        tokenContractAddress={reward.token.contractAddress ?? undefined}
                        tokenDecimals={reward.token.decimals}
                        tokenSymbol={reward.token.symbol}
                    />
                ))}
            </VStack>
        ),
        key: 'rewards',
        title: translate('earn.yieldReview.claimRewardsCard.title'),
    },
    buildYieldClaimReviewTransactionDetailsCard(transactionDetailsParams, translate),
];
