import React from 'react';
import { useSelector } from 'react-redux';

import { Text, DiscreetText } from '@suite-native/atoms';
import { NetworkSymbol } from '@suite-common/wallet-config';
import { selectCoins } from '@suite-common/wallet-core';
import { convertCryptoToFiatAmount, useFormatters } from '@suite-common/formatters';
import { selectFiatCurrency } from '@suite-native/module-settings';
import { FiatRates } from '@trezor/blockchain-link';

type CryptoToFiatAmountFormatterProps = {
    value: string | null;
    network: NetworkSymbol;
    customRates?: FiatRates;
    isDiscreetText?: boolean;
};

export const CryptoToFiatAmountFormatter = ({
    value,
    network,
    customRates,
    isDiscreetText = false,
}: CryptoToFiatAmountFormatterProps) => {
    const coins = useSelector(selectCoins);
    const fiatCurrency = useSelector(selectFiatCurrency);
    const { FiatAmountFormatter } = useFormatters();

    const rates = customRates ?? coins.find(coin => coin.symbol === network)?.current?.rates;

    if (!value || !rates) return null;

    const fiatValue = convertCryptoToFiatAmount({
        value,
        rates,
        fiatCurrency: fiatCurrency.label,
        network,
    });

    const formattedFiatValue = FiatAmountFormatter.format(fiatValue ?? 0);

    if (isDiscreetText) {
        return <DiscreetText>{formattedFiatValue}</DiscreetText>;
    }

    return <Text>{formattedFiatValue}</Text>;
};
