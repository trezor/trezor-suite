import { type ReactNode } from 'react';

import { type NetworkSymbol } from '@suite-common/wallet-config';
import { type YieldFlowCompleteRewardItem } from '@suite-common/wallet-core';
import { HStack, Text, VStack } from '@suite-native/atoms';
import { CryptoIcon, Icon } from '@suite-native/icons';
import { Translation } from '@suite-native/intl';

import { YieldClaimRewardRow, getYieldClaimRewardFiatAmount } from './YieldClaimRewardRow';
import { type YieldCompleteSummaryRow } from './YieldCompleteScreenContent';

type GetYieldDepositCompleteRowsParams = {
    accountSymbol: NetworkSymbol;
    apyValue: ReactNode;
    onApyPress?: () => void;
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
    onApyPress,
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
        onPress: onApyPress,
    },
    {
        key: 'sent',
        label: <Translation id="earn.yieldCompleteScreen.deposited" />,
        value: (
            <HStack spacing="sp4" alignItems="center" flexShrink={1}>
                <CryptoIcon
                    symbol={accountSymbol}
                    contractAddress={sentTokenContract}
                    size="extraSmall"
                />
                <Text variant="body-md-strong" color="contentPrimary" numberOfLines={1}>
                    {sentAmount}
                </Text>
            </HStack>
        ),
    },
    {
        key: 'received',
        label: <Translation id="earn.yieldCompleteScreen.received" />,
        value: (
            <HStack spacing="sp4" alignItems="center" flexShrink={1}>
                <CryptoIcon
                    symbol={accountSymbol}
                    contractAddress={receivedTokenContract}
                    size="extraSmall"
                />
                <Text variant="body-md-strong" color="contentPrimary" numberOfLines={1}>
                    {receivedAmount}
                </Text>
            </HStack>
        ),
    },
];

type GetYieldWithdrawCompleteRowsParams = {
    accountSymbol: NetworkSymbol;
    receivedAmount: string;
    receivedTokenContract?: string;
    withdrawalAmount?: string;
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
        key: 'received',
        label: <Translation id="earn.yieldCompleteScreen.received" />,
        value: (
            <HStack spacing="sp4" alignItems="center" flexShrink={1}>
                <CryptoIcon
                    symbol={accountSymbol}
                    contractAddress={receivedTokenContract}
                    size="extraSmall"
                />
                <Text variant="body-md-strong" color="contentPrimary" numberOfLines={1}>
                    {receivedAmount}
                </Text>
            </HStack>
        ),
    },
    ...(withdrawalAmount
        ? [
              {
                  key: 'sent',
                  label: <Translation id="earn.yieldCompleteScreen.sent" />,
                  value: (
                      <HStack spacing="sp4" alignItems="center" flexShrink={1}>
                          <CryptoIcon
                              symbol={accountSymbol}
                              contractAddress={withdrawalTokenContract}
                              size="extraSmall"
                          />
                          <Text variant="body-md-strong" color="contentPrimary" numberOfLines={1}>
                              -{withdrawalAmount}
                          </Text>
                      </HStack>
                  ),
              },
          ]
        : []),
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
