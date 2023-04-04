import React from 'react';
import { useSelector } from 'react-redux';

import { TextProps } from '@suite-native/atoms';
import { selectCoins } from '@suite-common/wallet-core';
import { selectFiatCurrency } from '@suite-native/module-settings';
import { toFiatCurrency } from '@suite-common/wallet-utils';
import { useFormatters } from '@suite-common/formatters';
import { EthereumTokenSymbol } from '@suite-native/ethereum-tokens';

import { FormatterProps } from '../types';
import { EmptyAmountText } from './EmptyAmountText';
import { AmountText } from './AmountText';

type EthereumTokenToFiatAmountFormatterProps = {
    ethereumToken: EthereumTokenSymbol;
    isDiscreetText?: boolean;
    decimals?: number;
} & FormatterProps<number | string> &
    TextProps;

export const TokenToFiatAmountFormatter = ({
    value,
    ethereumToken,
    isDiscreetText = true,
    decimals = 0,
    ...rest
}: EthereumTokenToFiatAmountFormatterProps) => {
    const coins = useSelector(selectCoins);
    const fiatCurrency = useSelector(selectFiatCurrency);
    const { FiatAmountFormatter } = useFormatters();

    const rates = coins.find(coin => coin.symbol === ethereumToken)?.current?.rates;

    if (!rates) return <EmptyAmountText />;

    const shiftedValue = Number(value) / 10 ** decimals;
    const amount = toFiatCurrency(shiftedValue.toString(), fiatCurrency.label, rates, 2);

    const formattedFiatValue = FiatAmountFormatter.format(amount ?? 0);

    return <AmountText value={formattedFiatValue} isDiscreetText={isDiscreetText} {...rest} />;
};
