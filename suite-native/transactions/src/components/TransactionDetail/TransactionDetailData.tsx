import React from 'react';
import { View } from 'react-native';
import { useSelector } from 'react-redux';

import { Box, Card, Divider, Text } from '@suite-native/atoms';
import { WalletAccountTransaction } from '@suite-common/wallet-types';
import { Icon } from '@trezor/icons';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles';
import { formatNetworkAmount, toFiatCurrency } from '@suite-common/wallet-utils';
import { useFormatters } from '@suite-common/formatters';
import { selectFiatCurrency } from '@suite-native/module-settings';

type TransactionDetailDataProps = {
    transaction: WalletAccountTransaction;
};

const cardStyle = prepareNativeStyle(utils => ({
    marginBottom: utils.spacings.small,
}));

export const TransactionDetailData = ({ transaction }: TransactionDetailDataProps) => {
    const { applyStyle } = useNativeStyles();
    const { FiatAmountFormatter, CryptoAmountFormatter } = useFormatters();
    const fiatCurrency = useSelector(selectFiatCurrency);

    const fee = formatNetworkAmount(transaction.fee, transaction.symbol);
    const fiatFeeAmount = toFiatCurrency(fee, fiatCurrency.label, transaction.rates);

    const getBlockTime = () => {
        if (!transaction.blockTime) return '';
        return new Date(transaction.blockTime * 1000).toLocaleTimeString();
    };

    return (
        <View>
            <Card style={applyStyle(cardStyle)}>
                <Box flexDirection="row" justifyContent="space-between" alignItems="center">
                    <Text color="gray600">Date</Text>
                    <Box flexDirection="row">
                        <Text color="gray1000">{getBlockTime()}</Text>
                        <Box marginLeft="small">
                            <Icon name="calendar" color="gray1000" />
                        </Box>
                    </Box>
                </Box>
            </Card>
            <Card>
                <Box flexDirection="row" justifyContent="space-between" alignItems="center">
                    <Text color="gray600">Fee</Text>
                    <Box alignItems="flex-end">
                        <Text color="gray1000">
                            {CryptoAmountFormatter.format(fee, {
                                symbol: transaction.symbol,
                            })}
                        </Text>
                        <Text>
                            {`≈ ${FiatAmountFormatter.format(fiatFeeAmount ?? 0, {
                                currency: fiatCurrency.label,
                            })}`}
                        </Text>
                    </Box>
                </Box>
            </Card>
            <Divider />
        </View>
    );
};
