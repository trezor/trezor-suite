import React, { useMemo } from 'react';
import { useSelector } from 'react-redux';

import { prepareNativeStyle, useNativeStyles } from '@trezor/styles';
import { Box, Divider, Text } from '@suite-native/atoms';
import { CryptoIcon } from '@trezor/icons';
import { AccountsRootState, selectAccountByKey, selectCoins } from '@suite-common/wallet-core';
import { useFormatters } from '@suite-common/formatters';
import { formatNetworkAmount, toFiatCurrency } from '@suite-common/wallet-utils';
import { selectFiatCurrency } from '@suite-native/module-settings';

type AccountBalanceProps = {
    accountKey: string;
};

const cryptoIconStyle = prepareNativeStyle(utils => ({
    marginRight: utils.spacings.small / 2,
}));

export const AccountBalance = ({ accountKey }: AccountBalanceProps) => {
    const { applyStyle } = useNativeStyles();
    const account = useSelector((state: AccountsRootState) =>
        selectAccountByKey(state, accountKey),
    );
    const fiatCurrency = useSelector(selectFiatCurrency);
    const coins = useSelector(selectCoins);
    const { FiatAmountFormatter, CryptoAmountFormatter } = useFormatters();

    const fiatRates = useMemo(
        () => coins.find(coin => coin.symbol === account?.symbol),
        [account, coins],
    );

    if (!account) return null;

    // TODO this should be done with formatters once they're prepared
    const cryptoAmount = formatNetworkAmount(account.availableBalance, account.symbol);
    const fiatAmount = toFiatCurrency(cryptoAmount, fiatCurrency.label, fiatRates?.current?.rates);

    return (
        <Box>
            <Box marginBottom="large" justifyContent="center" alignItems="center">
                <Box flexDirection="row" alignItems="center" marginBottom="small">
                    <Box style={applyStyle(cryptoIconStyle)}>
                        <CryptoIcon name={account.symbol} />
                    </Box>
                    <Text color="gray600" variant="hint">
                        {CryptoAmountFormatter.format(cryptoAmount, {
                            symbol: account.symbol,
                        })}
                    </Text>
                </Box>
                <Box>
                    <Text variant="titleLarge" color="gray800">
                        {FiatAmountFormatter.format(fiatAmount ?? 0)}
                    </Text>
                </Box>
            </Box>
            <Box marginBottom="large">
                <Divider />
            </Box>
        </Box>
    );
};
