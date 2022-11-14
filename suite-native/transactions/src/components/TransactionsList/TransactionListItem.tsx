import React, { memo } from 'react';
import { TouchableOpacity } from 'react-native';
import { useSelector } from 'react-redux';

import { useNavigation } from '@react-navigation/native';

import { Box, Text } from '@suite-native/atoms';
import { TransactionType, WalletAccountTransaction } from '@suite-common/wallet-types';
import { Icon, IconName } from '@trezor/icons';
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

type AccountTransactionListItemProps = {
    transaction: WalletAccountTransaction;
};

const transactionIconMap: Partial<Record<TransactionType, IconName>> = {
    recv: 'receive',
    sent: 'send',
};

const iconStyle = prepareNativeStyle(utils => ({
    backgroundColor: utils.colors.gray300,
    padding: utils.spacings.small,
    borderRadius: utils.borders.radii.round,
    marginRight: utils.spacings.small,
}));

const transactionListItemStyle = prepareNativeStyle(utils => ({
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: utils.spacings.medium,
    marginHorizontal: utils.spacings.medium,
}));

export const TransactionListItem = memo(({ transaction }: AccountTransactionListItemProps) => {
    const { applyStyle } = useNativeStyles();
    const fiatCurrency = useSelector(selectFiatCurrency);
    const navigation =
        useNavigation<
            StackNavigationProps<RootStackParamList, AccountsStackRoutes.AccountDetail>
        >();
    const { FiatAmountFormatter, CryptoAmountFormatter } = useFormatters();
    const transactionAmount = formatNetworkAmount(transaction.amount, transaction.symbol);
    const fiatAmount = toFiatCurrency(transactionAmount, fiatCurrency.label, transaction.rates);

    const getTransactionTimestamp = () => {
        const { blockHeight, blockTime } = transaction;
        if (!blockTime || blockHeight === 0) return null;
        // TODO this is just MVP and should be properly formatted in next PR
        return new Date(blockTime * 1000);
    };

    const handleNavigateToTransactionDetail = () => {
        navigation.navigate(RootStackRoutes.TransactionDetail, {
            txid: transaction.txid,
        });
    };

    return (
        <TouchableOpacity
            onPress={() => handleNavigateToTransactionDetail()}
            style={applyStyle(transactionListItemStyle)}
        >
            <Box flexDirection="row" alignItems="center">
                <Box style={applyStyle(iconStyle)}>
                    <Icon name={transactionIconMap[transaction.type] ?? 'placeholder'} />
                </Box>
                <Box>
                    <Text>{transaction.type}</Text>
                    <Text>{getTransactionTimestamp()?.toLocaleTimeString()}</Text>
                </Box>
            </Box>
            <Box alignItems="flex-end">
                <Text>{FiatAmountFormatter.format(fiatAmount ?? 0)}</Text>
                <Text variant="hint" color="gray600">
                    {CryptoAmountFormatter.format(transactionAmount, {
                        symbol: transaction.symbol,
                        withSymbol: true,
                    })}
                </Text>
            </Box>
        </TouchableOpacity>
    );
});
