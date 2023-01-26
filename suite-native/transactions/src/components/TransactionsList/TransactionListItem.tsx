import React, { memo } from 'react';
import { TouchableOpacity } from 'react-native';
import { useSelector } from 'react-redux';

import { useNavigation } from '@react-navigation/native';

import { Color } from '@trezor/theme';
import { Box, DiscreetText, Text } from '@suite-native/atoms';
import { TransactionType, WalletAccountTransaction } from '@suite-common/wallet-types';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles';
import { toFiatCurrency, formatNetworkAmount } from '@suite-common/wallet-utils';
import {
    AccountsStackRoutes,
    RootStackParamList,
    RootStackRoutes,
    StackNavigationProps,
} from '@suite-native/navigation';
import { selectFiatCurrency } from '@suite-native/module-settings';
import { useFormatters } from '@suite-common/formatters';

import { TransactionListItemIcon } from './TransactionListItemIcon';

type TransactionListItemProps = {
    transaction: WalletAccountTransaction;
    isFirst?: boolean;
    isLast?: boolean;
};

type TransactionTypeProperties = {
    prefix: string;
    sign?: string;
    signColor?: Color;
};
const transactionTypePropertiesMap = {
    recv: { prefix: 'From', sign: '+', signColor: 'green' },
    sent: { prefix: 'To', sign: undefined, signColor: 'red' },
    self: { prefix: 'Self', sign: undefined, signColor: undefined },
    joint: { prefix: 'Joint', sign: undefined, signColor: undefined },
    failed: { prefix: 'Failed', sign: undefined, signColor: undefined },
    unknown: { prefix: 'Unknown', sign: undefined, signColor: undefined },
} as const satisfies Record<TransactionType, TransactionTypeProperties>;

type TransactionListItemStyleProps = {
    isFirst: boolean;
    isLast: boolean;
};
const transactionListItemStyle = prepareNativeStyle<TransactionListItemStyleProps>(
    (utils, { isFirst, isLast }) => ({
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: utils.colors.gray0,
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

const titleCointainerStyle = prepareNativeStyle(_ => ({
    maxWidth: '50%',
    flexDirection: 'row',
    alignItems: 'center',
}));

const addressStyle = prepareNativeStyle(utils => ({
    backgroundColor: utils.colors.gray100,
    marginLeft: utils.spacings.small,
    paddingHorizontal: utils.spacings.small,
    paddingVertical: 2,
    borderRadius: 10,
}));

export const TransactionListItem = memo(
    ({ transaction, isFirst = false, isLast = false }: TransactionListItemProps) => {
        const { applyStyle } = useNativeStyles();
        const fiatCurrency = useSelector(selectFiatCurrency);
        const navigation =
            useNavigation<
                StackNavigationProps<RootStackParamList, AccountsStackRoutes.AccountDetail>
            >();
        const { FiatAmountFormatter, CryptoAmountFormatter, DateTimeFormatter } = useFormatters();
        const transactionAmount = formatNetworkAmount(transaction.amount, transaction.symbol);
        const fiatAmount = toFiatCurrency(transactionAmount, fiatCurrency.label, transaction.rates);

        // TODO: replace with datetime formater module when ready
        const formatTransactionDate = () => {
            const { blockHeight, blockTime } = transaction;
            if (!blockTime || blockHeight === 0) return null;
            // TODO this is just MVP and should be properly formatted in next PR
            return new Date(blockTime * 1000).toLocaleString('en-US', {
                month: 'short',
                day: 'numeric',
                hour: 'numeric',
                minute: 'numeric',
            });
        };

        const handleNavigateToTransactionDetail = () => {
            navigation.navigate(RootStackRoutes.TransactionDetail, {
                txid: transaction.txid,
            });
        };

        const transactionTypeProperties = transactionTypePropertiesMap[transaction.type];

        return (
            <TouchableOpacity
                onPress={() => handleNavigateToTransactionDetail()}
                style={applyStyle(transactionListItemStyle, { isFirst, isLast })}
            >
                <TransactionListItemIcon
                    cryptoIconName={transaction.symbol}
                    transactionType={transaction.type}
                />
                <Box>
                    <Box style={applyStyle(titleCointainerStyle)}>
                        <Text>{transactionTypeProperties.prefix}</Text>
                        <Box style={applyStyle(addressStyle)}>
                            <Text
                                variant="label"
                                color="gray600"
                                numberOfLines={1}
                                ellipsizeMode="middle"
                            >
                                {transaction.txid}
                            </Text>
                        </Box>
                    </Box>
                    <Text variant="hint" color="gray600">
                        <DateTimeFormatter
                            value={transaction.blockTime ? transaction.blockTime * 1000 : null}
                        />
                    </Text>
                </Box>

                <Box alignItems="flex-end">
                    <Box flexDirection="row">
                        <Text color={transactionTypeProperties.signColor}>
                            {transactionTypeProperties.sign}{' '}
                        </Text>
                        <DiscreetText>{FiatAmountFormatter.format(fiatAmount ?? 0)}</DiscreetText>
                    </Box>
                    <DiscreetText typography="hint" color="gray600">
                        {CryptoAmountFormatter.format(transactionAmount, {
                            symbol: transaction.symbol,
                        })}
                    </DiscreetText>
                </Box>
            </TouchableOpacity>
        );
    },
);
