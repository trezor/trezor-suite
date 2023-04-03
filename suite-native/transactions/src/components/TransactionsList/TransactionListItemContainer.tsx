import React, { memo, ReactNode } from 'react';
import { TouchableOpacity } from 'react-native';
import { useSelector } from 'react-redux';

import { useNavigation } from '@react-navigation/native';

import { AccountKey, TransactionType } from '@suite-common/wallet-types';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles';
import {
    AccountsStackRoutes,
    RootStackParamList,
    RootStackRoutes,
    StackNavigationProps,
} from '@suite-native/navigation';
import { Box, Text } from '@suite-native/atoms';
import { useFormatters } from '@suite-common/formatters';
import { selectTransactionBlockTimeById, TransactionsRootState } from '@suite-common/wallet-core';
import { NetworkSymbol } from '@suite-common/wallet-config';
import { EthereumTokenSymbol } from '@suite-native/ethereum-tokens';

import { TransactionIcon } from './TransactionIcon';

type TransactionListItemContainerProps = {
    children: ReactNode;
    txid: string;
    accountKey: AccountKey;
    isFirst?: boolean;
    isLast?: boolean;
    symbol: NetworkSymbol | EthereumTokenSymbol;
    transactionType: TransactionType;
};

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

const transactionListItemContainerStyle = prepareNativeStyle<TransactionListItemStyleProps>(
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
    flexDirection: 'row',
    alignItems: 'center',
    maxWidth: '60%',
}));

export const TransactionListItemContainer = memo(
    ({
        children,
        txid,
        accountKey,
        isFirst = false,
        isLast = false,
        transactionType,
        symbol,
    }: TransactionListItemContainerProps) => {
        const { applyStyle } = useNativeStyles();
        const navigation =
            useNavigation<
                StackNavigationProps<RootStackParamList, AccountsStackRoutes.AccountDetail>
            >();

        const handleNavigateToTransactionDetail = () => {
            navigation.navigate(RootStackRoutes.TransactionDetail, {
                txid,
                accountKey,
            });
        };

        const { DateTimeFormatter } = useFormatters();
        const transactionBlockTime = useSelector((state: TransactionsRootState) =>
            selectTransactionBlockTimeById(state, txid, accountKey),
        );

        return (
            <TouchableOpacity
                onPress={() => handleNavigateToTransactionDetail()}
                style={applyStyle(transactionListItemContainerStyle, { isFirst, isLast })}
            >
                <Box style={applyStyle(descriptionBoxStyle)}>
                    <TransactionIcon symbol={symbol} transactionType={transactionType} />
                    <Box marginLeft="medium" flex={1}>
                        <Box flexDirection="row">
                            <Text>{transactionTitleMap[transactionType]}</Text>
                        </Box>
                        <Text variant="hint" color="textSubdued">
                            <DateTimeFormatter value={transactionBlockTime} />
                        </Text>
                    </Box>
                </Box>
                <Box alignItems="flex-end">{children}</Box>
            </TouchableOpacity>
        );
    },
);
