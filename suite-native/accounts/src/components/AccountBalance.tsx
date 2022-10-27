import React, { useMemo } from 'react';
import { useSelector } from 'react-redux';

import { prepareNativeStyle, useNativeStyles } from '@trezor/styles';
import { Box, Text } from '@suite-native/atoms';
import { CryptoIcon } from '@trezor/icons';
import { AccountsRootState, selectAccountByKey, selectCoins } from '@suite-common/wallet-core';
import { useFormatters } from '@suite-common/formatters';
import { selectFiatCurrency } from '@suite-native/module-settings/libDev/src';
import { formatNetworkAmount, toFiatCurrency } from '@suite-common/wallet-utils/libDev/src';

type AccountBalanceProps = {
    accountKey: string;
    accountName?: string;
};

const accountNameStyle = prepareNativeStyle(utils => ({
    ...utils.typography.titleSmall,
    marginBottom: 13,
}));

const cryptoIconStyle = prepareNativeStyle(_ => ({
    marginRight: 12,
}));

export const AccountBalance = ({ accountKey, accountName }: AccountBalanceProps) => {
    const { applyStyle } = useNativeStyles();
    const account = useSelector((state: AccountsRootState) =>
        selectAccountByKey(state, accountKey),
    );
    const fiatCurrency = useSelector(selectFiatCurrency);
    const coins = useSelector(selectCoins);
    const fiatRates = useMemo(
        () => coins.find(coin => coin.symbol === account?.symbol),
        [account, coins],
    );
    const { FiatAmountFormatter, CryptoAmountFormatter } = useFormatters();

    if (!account) return null;

    const cryptoAmount = formatNetworkAmount(account.availableBalance, account.symbol);
    const fiatAmount = toFiatCurrency(cryptoAmount, fiatCurrency.label, fiatRates?.current?.rates);

    return (
        <Box marginBottom="small">
            <Text style={applyStyle(accountNameStyle)}>{accountName}</Text>
            <Box flexDirection="row" alignItems="center">
                <Box style={applyStyle(cryptoIconStyle)}>
                    <CryptoIcon size="large" name={account.symbol} />
                </Box>
                <Box>
                    <Text color="gray800">
                        {FiatAmountFormatter.format(account.formattedBalance)}
                    </Text>
                    <Text color="gray600" variant="hint">
                        {account.balance} {account.symbol}
                    </Text>
                </Box>
            </Box>
        </Box>
    );
};
