import React, { memo, ReactNode } from 'react';
import { TouchableOpacity } from 'react-native';
import { useSelector } from 'react-redux';

import { RequireExactlyOne } from 'type-fest';
import { useNavigation } from '@react-navigation/native';

import { AccountKey, TransactionType } from '@suite-common/wallet-types';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles';
import {
    HomeStackRoutes,
    RootStackParamList,
    RootStackRoutes,
    StackNavigationProps,
} from '@suite-native/navigation';
import { Badge, Box, HStack, Text } from '@suite-native/atoms';
import { useFormatters } from '@suite-common/formatters';
import { selectTransactionBlockTimeById, TransactionsRootState } from '@suite-common/wallet-core';
import { NetworkSymbol } from '@suite-common/wallet-config';
import { EthereumTokenTransfer } from '@suite-native/ethereum-tokens';

import { TransactionIcon } from './TransactionIcon';

type TransactionListItemContainerProps = RequireExactlyOne<
    {
        children: ReactNode;
        txid: string;
        accountKey: AccountKey;
        includedCoinsCount: number;
        isFirst?: boolean;
        isLast?: boolean;
        networkSymbol: NetworkSymbol;
        tokenTransfer: EthereumTokenTransfer;
        transactionType: TransactionType;
    },
    'networkSymbol' | 'tokenTransfer'
>;

type TransactionListItemStyleProps = {
    isFirst: boolean;
    isLast: boolean;
};

const transactionTitleMap = {
    recv: 'Received',
    sent: 'Sent',
    self: 'Self',
    joint: 'Joined',
    contract: 'Contract',
    failed: 'Failed',
    unknown: 'Unknown',
} as const satisfies Record<TransactionType, string>;

export const transactionListItemContainerStyle = prepareNativeStyle<TransactionListItemStyleProps>(
    (utils, { isFirst, isLast }) => ({
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: utils.colors.backgroundSurfaceElevation1,
        marginHorizontal: utils.spacings.small,
        paddingHorizontal: utils.spacings.medium,
        paddingTop: 12,
        paddingBottom: 12,
        extend: [
            {
                condition: isFirst,
                style: {
                    paddingTop: utils.spacings.medium,
                    borderTopLeftRadius: utils.borders.radii.large / 2,
                    borderTopRightRadius: utils.borders.radii.large / 2,
                },
            },
            {
                condition: isLast,
                style: {
                    paddingBottom: utils.spacings.medium,
                    marginBottom: utils.spacings.small,
                    borderBottomLeftRadius: utils.borders.radii.large / 2,
                    borderBottomRightRadius: utils.borders.radii.large / 2,
                },
            },
        ],
    }),
);

const descriptionBoxStyle = prepareNativeStyle(_ => ({
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
}));

export const valuesContainerStyle = prepareNativeStyle(utils => ({
    flexShrink: 0,
    alignItems: 'flex-end',
    marginLeft: utils.spacings.small,
    maxWidth: '40%',
}));

export const TransactionListItemContainer = memo(
    ({
        children,
        txid,
        accountKey,
        isFirst = false,
        isLast = false,
        includedCoinsCount,
        transactionType,
        networkSymbol,
        tokenTransfer,
    }: TransactionListItemContainerProps) => {
        const { applyStyle } = useNativeStyles();
        const navigation =
            useNavigation<
                StackNavigationProps<RootStackParamList, HomeStackRoutes.AccountDetail>
            >();

        const handleNavigateToTransactionDetail = () => {
            navigation.navigate(RootStackRoutes.TransactionDetail, {
                txid,
                accountKey,
                tokenTransfer,
            });
        };

        const hasIncludedCoins = includedCoinsCount > 0;
        const includedCoinsLabel = `+${includedCoinsCount} coin${
            includedCoinsCount > 1 ? 's' : ''
        }`;

        const { DateTimeFormatter } = useFormatters();
        const transactionBlockTime = useSelector((state: TransactionsRootState) =>
            selectTransactionBlockTimeById(state, txid, accountKey),
        );

        const coinSymbol = tokenTransfer?.symbol ?? networkSymbol;
        return (
            <TouchableOpacity
                onPress={() => handleNavigateToTransactionDetail()}
                style={applyStyle(transactionListItemContainerStyle, { isFirst, isLast })}
            >
                <Box style={applyStyle(descriptionBoxStyle)}>
                    {coinSymbol && (
                        <TransactionIcon symbol={coinSymbol} transactionType={transactionType} />
                    )}
                    <Box marginLeft="medium" flex={1}>
                        <HStack flexDirection="row" alignItems="center" spacing={4}>
                            <Text>{transactionTitleMap[transactionType]}</Text>
                            {hasIncludedCoins && <Badge label={includedCoinsLabel} size="small" />}
                        </HStack>
                        <Text variant="hint" color="textSubdued">
                            <DateTimeFormatter value={transactionBlockTime} />
                        </Text>
                    </Box>
                </Box>
                <Box style={applyStyle(valuesContainerStyle)}>{children}</Box>
            </TouchableOpacity>
        );
    },
);
