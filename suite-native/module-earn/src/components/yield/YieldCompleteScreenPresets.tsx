import { type ReactNode } from 'react';

import { type NetworkSymbol } from '@suite-common/wallet-config';
import { type YieldFlowCompleteRewardItem } from '@suite-common/wallet-core';
import { Box, HStack, Text, VStack } from '@suite-native/atoms';
import { Icon, TokenIcon } from '@suite-native/icons';
import { Translation } from '@suite-native/intl';

import { YieldClaimRewardRow, getYieldClaimRewardFiatAmount } from './YieldClaimRewardRow';
import { YieldFormattedAmount, type YieldFormattedAmountValue } from './YieldFormattedAmount';
import { type EarnCompleteSummaryRow } from '../earn/EarnCompleteScreenContent';

type YieldCompleteAmountValueParams = {
    accountSymbol: NetworkSymbol;
    amount: YieldFormattedAmountValue;
    numberOfLines?: 1 | 2;
};

const getYieldCompleteAmountValue = ({
    accountSymbol,
    amount,
    numberOfLines = 2,
}: YieldCompleteAmountValueParams): ReactNode => (
    <HStack spacing="sp4" alignItems="center" flexShrink={1}>
        <TokenIcon
            symbol={accountSymbol}
            contractAddress={amount.tokenContract ?? undefined}
            size="extraSmall"
        />
        <Box flexShrink={1}>
            <YieldFormattedAmount
                {...amount}
                networkSymbol={accountSymbol}
                variant="body-md-strong"
                color="contentPrimary"
                numberOfLines={numberOfLines}
                textAlign="right"
            />
        </Box>
    </HStack>
);

type GetYieldDepositCompleteRowsParams = {
    accountSymbol: NetworkSymbol;
    apyValue: ReactNode;
    receivedAmount: YieldFormattedAmountValue;
    sentAmount: YieldFormattedAmountValue;
};

export const getYieldCompleteStatusRow = (): EarnCompleteSummaryRow => ({
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
    sentAmount,
}: GetYieldDepositCompleteRowsParams): EarnCompleteSummaryRow[] => [
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
        }),
    },
    {
        key: 'received',
        label: <Translation id="earn.yieldCompleteScreen.received" />,
        value: getYieldCompleteAmountValue({
            accountSymbol,
            amount: receivedAmount,
        }),
    },
];

type GetYieldWithdrawCompleteRowsParams = {
    accountSymbol: NetworkSymbol;
    receivedAmount: YieldFormattedAmountValue;
    withdrawalAmount: YieldFormattedAmountValue;
};

export const getYieldWithdrawCompleteRows = ({
    accountSymbol,
    receivedAmount,
    withdrawalAmount,
}: GetYieldWithdrawCompleteRowsParams): EarnCompleteSummaryRow[] => [
    getYieldCompleteStatusRow(),
    {
        key: 'sent',
        label: <Translation id="earn.yieldCompleteScreen.sent" />,
        value: getYieldCompleteAmountValue({
            accountSymbol,
            amount: withdrawalAmount,
            numberOfLines: 1,
        }),
    },
    {
        key: 'received',
        label: <Translation id="earn.yieldCompleteScreen.received" />,
        value: getYieldCompleteAmountValue({
            accountSymbol,
            amount: receivedAmount,
        }),
    },
];

type GetWrappedNativeCompleteRowsParams = {
    accountSymbol: NetworkSymbol;
    receivedAmount: YieldFormattedAmountValue;
    sentAmount: YieldFormattedAmountValue;
};

export const getWrappedNativeCompleteRows = ({
    accountSymbol,
    receivedAmount,
    sentAmount,
}: GetWrappedNativeCompleteRowsParams): EarnCompleteSummaryRow[] => [
    getYieldCompleteStatusRow(),
    {
        key: 'sent',
        label: <Translation id="earn.yieldCompleteScreen.sent" />,
        value: getYieldCompleteAmountValue({
            accountSymbol,
            amount: sentAmount,
        }),
    },
    {
        key: 'received',
        label: <Translation id="earn.yieldCompleteScreen.received" />,
        value: getYieldCompleteAmountValue({
            accountSymbol,
            amount: receivedAmount,
        }),
    },
];

export const getYieldClaimCompleteRows = (
    rewards: YieldFlowCompleteRewardItem[],
): EarnCompleteSummaryRow[] => [
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
