import { type ReactNode } from 'react';

import { type NetworkSymbol } from '@suite-common/wallet-config';
import { type YieldFlowCompleteRewardItem } from '@suite-common/wallet-core';
import { Box, HStack, Text, VStack } from '@suite-native/atoms';
import { Icon, TokenIcon } from '@suite-native/icons';
import { Translation } from '@suite-native/intl';

import { YieldClaimRewardRow, getYieldClaimRewardFiatAmount } from './YieldClaimRewardRow';
import { type YieldCompleteSummaryRow } from './YieldCompleteScreenContent';

type YieldCompleteAmountValueParams = {
    accountSymbol: NetworkSymbol;
    amount: string;
    tokenContract?: string;
};

const getYieldCompleteAmountValue = ({
    accountSymbol,
    amount,
    tokenContract,
}: YieldCompleteAmountValueParams): ReactNode => (
    <HStack spacing="sp4" alignItems="center" flexShrink={1}>
        <TokenIcon symbol={accountSymbol} contractAddress={tokenContract} size="extraSmall" />
        <Box flexShrink={1}>
            <Text
                variant="body-md-strong"
                color="contentPrimary"
                numberOfLines={2}
                textAlign="right"
            >
                {amount}
            </Text>
        </Box>
    </HStack>
);

type GetYieldDepositCompleteRowsParams = {
    accountSymbol: NetworkSymbol;
    apyValue: ReactNode;
    receivedAmount: string;
    receivedTokenContract?: string;
    sentAmount: string;
    sentTokenContract?: string;
};

const getYieldCompleteStatusRow = (): YieldCompleteSummaryRow => ({
    key: 'status',
    label: <Translation id="earn.yieldCompleteScreen.status" />,
    value: (
        <HStack spacing="sp4" alignItems="center">
            <Icon name="checkCircle" size="mediumLarge" color="contentBrand" />
            <Text variant="body-md" color="contentBrand">
                <Translation id="earn.yieldCompleteScreen.completed" />
            </Text>
        </HStack>
    ),
});

export const getYieldDepositCompleteRows = ({
    accountSymbol,
    apyValue,
    receivedAmount,
    receivedTokenContract,
    sentAmount,
    sentTokenContract,
}: GetYieldDepositCompleteRowsParams): YieldCompleteSummaryRow[] => [
    getYieldCompleteStatusRow(),
    {
        key: 'apy',
        label: <Translation id="earn.yieldCompleteScreen.apy" />,
        value: apyValue,
    },
    {
        key: 'sent',
        label: <Translation id="earn.yieldCompleteScreen.deposited" />,
        value: getYieldCompleteAmountValue({
            accountSymbol,
            amount: sentAmount,
            tokenContract: sentTokenContract,
        }),
    },
    {
        key: 'received',
        label: <Translation id="earn.yieldCompleteScreen.received" />,
        value: getYieldCompleteAmountValue({
            accountSymbol,
            amount: receivedAmount,
            tokenContract: receivedTokenContract,
        }),
    },
];

type GetYieldWithdrawCompleteRowsParams = {
    accountSymbol: NetworkSymbol;
    receivedAmount: string;
    receivedTokenContract?: string;
    withdrawalAmount: string;
    withdrawalTokenContract?: string;
};

export const getYieldWithdrawCompleteRows = ({
    accountSymbol,
    receivedAmount,
    receivedTokenContract,
    withdrawalAmount,
    withdrawalTokenContract,
}: GetYieldWithdrawCompleteRowsParams): YieldCompleteSummaryRow[] => [
    getYieldCompleteStatusRow(),
    {
        key: 'sent',
        label: <Translation id="earn.yieldCompleteScreen.sent" />,
        value: (
            <HStack spacing="sp4" alignItems="center" flexShrink={1}>
                <TokenIcon
                    symbol={accountSymbol}
                    contractAddress={withdrawalTokenContract}
                    size="extraSmall"
                />
                <Text variant="body-md-strong" color="contentPrimary" numberOfLines={1}>
                    {withdrawalAmount}
                </Text>
            </HStack>
        ),
    },
    {
        key: 'received',
        label: <Translation id="earn.yieldCompleteScreen.received" />,
        value: getYieldCompleteAmountValue({
            accountSymbol,
            amount: receivedAmount,
            tokenContract: receivedTokenContract,
        }),
    },
];

type GetWrappedNativeCompleteRowsParams = {
    accountSymbol: NetworkSymbol;
    receivedAmount: string;
    receivedTokenContract?: string;
    sentAmount: string;
    sentTokenContract?: string;
};

export const getWrappedNativeCompleteRows = ({
    accountSymbol,
    receivedAmount,
    receivedTokenContract,
    sentAmount,
    sentTokenContract,
}: GetWrappedNativeCompleteRowsParams): YieldCompleteSummaryRow[] => [
    getYieldCompleteStatusRow(),
    {
        key: 'sent',
        label: <Translation id="earn.yieldCompleteScreen.sent" />,
        value: getYieldCompleteAmountValue({
            accountSymbol,
            amount: sentAmount,
            tokenContract: sentTokenContract,
        }),
    },
    {
        key: 'received',
        label: <Translation id="earn.yieldCompleteScreen.received" />,
        value: getYieldCompleteAmountValue({
            accountSymbol,
            amount: receivedAmount,
            tokenContract: receivedTokenContract,
        }),
    },
];

export const getYieldClaimCompleteRows = (
    rewards: YieldFlowCompleteRewardItem[],
): YieldCompleteSummaryRow[] => [
    getYieldCompleteStatusRow(),
    {
        key: 'rewards',
        label: <Translation id="earn.yieldCompleteScreen.rewards" />,
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
    },
];
