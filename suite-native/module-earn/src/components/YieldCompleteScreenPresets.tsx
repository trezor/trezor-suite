import { type ReactNode } from 'react';

import { type NetworkSymbol } from '@suite-common/wallet-config';
import { HStack, Text } from '@suite-native/atoms';
import { CryptoIcon, Icon } from '@suite-native/icons';
import { Translation } from '@suite-native/intl';

import { type YieldCompleteSummaryRow } from './YieldCompleteScreenContent';

type GetYieldDepositCompleteRowsParams = {
    accountSymbol: NetworkSymbol;
    apyValue: ReactNode;
    receivedAmount: string;
    receivedTokenContract?: string;
    sentAmount: string;
    sentTokenContract?: string;
};

export const getYieldDepositCompleteRows = ({
    accountSymbol,
    apyValue,
    receivedAmount,
    receivedTokenContract,
    sentAmount,
    sentTokenContract,
}: GetYieldDepositCompleteRowsParams): YieldCompleteSummaryRow[] => [
    {
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
    },
    {
        key: 'apy',
        label: <Translation id="earn.yieldCompleteScreen.apy" />,
        value: (
            <Text variant="body-md" color="contentPrimary">
                {apyValue}
            </Text>
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
    {
        key: 'sent',
        label: <Translation id="earn.yieldCompleteScreen.sent" />,
        value: (
            <HStack spacing="sp4" alignItems="center" flexShrink={1}>
                <CryptoIcon
                    symbol={accountSymbol}
                    contractAddress={sentTokenContract}
                    size="extraSmall"
                />
                <Text variant="body-md-strong" color="contentPrimary" numberOfLines={1}>
                    -{sentAmount}
                </Text>
            </HStack>
        ),
    },
];

type GetYieldWithdrawCompleteRowsParams = {
    accountSymbol: NetworkSymbol;
    apyValue: ReactNode;
    receivedAmount: string;
    receivedTokenContract?: string;
    withdrawalAmount?: string;
    withdrawalTokenContract?: string;
};

export const getYieldWithdrawCompleteRows = ({
    accountSymbol,
    apyValue,
    receivedAmount,
    receivedTokenContract,
    withdrawalAmount,
    withdrawalTokenContract,
}: GetYieldWithdrawCompleteRowsParams): YieldCompleteSummaryRow[] => [
    {
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
    },
    {
        key: 'apy',
        label: <Translation id="earn.yieldCompleteScreen.apy" />,
        value: (
            <Text variant="body-md" color="contentPrimary">
                {apyValue}
            </Text>
        ),
    },
    ...(withdrawalAmount
        ? [
              {
                  key: 'withdrawal-amount',
                  label: <Translation id="earn.yieldCompleteScreen.withdrawalAmount" />,
                  value: (
                      <HStack spacing="sp4" alignItems="center" flexShrink={1}>
                          <CryptoIcon
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
          ]
        : []),
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
