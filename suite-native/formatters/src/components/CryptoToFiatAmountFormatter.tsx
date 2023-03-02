import React from 'react';
import { useSelector } from 'react-redux';

import { TextProps } from '@suite-native/atoms';
import { NetworkSymbol } from '@suite-common/wallet-config';
import { selectCoins } from '@suite-common/wallet-core';
import { convertCryptoToFiatAmount, useFormatters } from '@suite-common/formatters';
import { selectFiatCurrency } from '@suite-native/module-settings';
import { FiatRates } from '@trezor/blockchain-link';
import { isTestnet } from '@suite-common/wallet-utils';

import { FormatterProps } from '../types';
import { EmptyAmountText } from './EmptyAmountText';
import { AmountText } from './AmountText';

type CryptoToFiatAmountFormatterProps = FormatterProps<string | null> &
    TextProps & {
        network: NetworkSymbol;
        customRates?: FiatRates;
        isDiscreetText?: boolean;
    };

export const CryptoToFiatAmountFormatter = ({
    value,
    network,
    customRates,
    isDiscreetText = true,
    ...textProps
}: CryptoToFiatAmountFormatterProps) => {
    const coins = useSelector(selectCoins);
    const fiatCurrency = useSelector(selectFiatCurrency);
    const { FiatAmountFormatter } = useFormatters();

    const isTestnetCoin = isTestnet(network);
    const rates = customRates ?? coins.find(coin => coin.symbol === network)?.current?.rates;

    if (!value || !rates || isTestnetCoin) return <EmptyAmountText />;

    const fiatValue = convertCryptoToFiatAmount({
        value,
        rates,
        fiatCurrency: fiatCurrency.label,
        network,
    });

    const formattedFiatValue = FiatAmountFormatter.format(fiatValue ?? 0);

    return <AmountText value={formattedFiatValue} isDiscreetText={isDiscreetText} {...textProps} />;
};
