import React, { useMemo } from 'react';
import { useSelector } from 'react-redux';

import { networks, NetworkSymbol } from '@suite-common/wallet-config';
import { formatNetworkAmount, toFiatCurrency } from '@suite-common/wallet-utils';
import { useFormatters } from '@suite-common/formatters';
import { Box, Card, Text } from '@suite-native/atoms';
import { TextInputField } from '@suite-native/forms';
import { AccountInfo } from '@trezor/connect';
import { CryptoIcon } from '@trezor/icons';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles';
import { selectFiatCurrency } from '@suite-native/module-settings';
import { selectCoins } from '@suite-common/wallet-core';

type AssetsOverviewProps = {
    accountInfo: AccountInfo;
    currencySymbol: NetworkSymbol;
};

const assetCardStyle = prepareNativeStyle(utils => ({
    padding: utils.spacings.large,
    borderRadius: utils.borders.radii.large,
    marginBottom: utils.spacings.large,
    width: '100%',
}));

export const AccountImportOverview = ({ accountInfo, currencySymbol }: AssetsOverviewProps) => {
    const { applyStyle } = useNativeStyles();
    const fiatCurrency = useSelector(selectFiatCurrency);
    const coins = useSelector(selectCoins);
    const { FiatAmountFormatter, CryptoAmountFormatter } = useFormatters();

    const fiatRates = useMemo(
        () => coins.find(coin => coin.symbol === currencySymbol),
        [currencySymbol, coins],
    );
    const cryptoAmount = formatNetworkAmount(accountInfo.availableBalance, currencySymbol);
    const fiatAmount = toFiatCurrency(cryptoAmount, fiatCurrency.label, fiatRates?.current?.rates);

    return (
        <Card style={applyStyle(assetCardStyle)}>
            <Box flexDirection="row" marginBottom="large">
                <CryptoIcon name={currencySymbol} size="large" />
                <Box marginLeft="medium">
                    <Text>{networks[currencySymbol].name}</Text>
                    <Text variant="label" color="gray1000">
                        {CryptoAmountFormatter.format(cryptoAmount, {
                            symbol: currencySymbol,
                        })}
                    </Text>
                </Box>
            </Box>
            <Box marginBottom="large">
                <Text variant="titleLarge" color="gray1000">
                    {FiatAmountFormatter.format(fiatAmount ?? 0)}
                </Text>
            </Box>
            <Box>
                <TextInputField name="accountLabel" label="Account label" />
            </Box>
        </Card>
    );
};
