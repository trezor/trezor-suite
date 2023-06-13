import React from 'react';
import { useSelector } from 'react-redux';

import { TextProps, Text } from '@suite-native/atoms';
import { getFiatRateKey, selectFiatRatesByFiatRateKey } from '@suite-native/fiat-rates';
import { selectFiatCurrencyCode } from '@suite-native/module-settings';
import { toFiatCurrency } from '@suite-common/wallet-utils';
import { useFormatters } from '@suite-common/formatters';
import { TokenAddress } from '@suite-common/wallet-types';
import { SignValue } from '@suite-common/suite-types';

import { FormatterProps } from '../types';
import { EmptyAmountText } from './EmptyAmountText';
import { AmountText } from './AmountText';
import { convertTokenValueToDecimal } from '../utils';
import { SignValueFormatter } from './SignValueFormatter';

type EthereumTokenToFiatAmountFormatterProps = {
    contract: TokenAddress;
    isDiscreetText?: boolean;
    decimals?: number;
    signValue?: SignValue;
} & FormatterProps<number | string> &
    TextProps;

export const EthereumTokenToFiatAmountFormatter = ({
    value,
    contract,
    isDiscreetText = true,
    decimals = 0,
    signValue,
    ellipsizeMode,
    numberOfLines,
    ...rest
}: EthereumTokenToFiatAmountFormatterProps) => {
    const fiatCurrencyCode = useSelector(selectFiatCurrencyCode);
    const { FiatAmountFormatter } = useFormatters();
    const fiatRateKey = getFiatRateKey('eth', fiatCurrencyCode, contract);
    const rate = useSelector((state: any) => selectFiatRatesByFiatRateKey(state, fiatRateKey));

    if (!rate?.rate) return <EmptyAmountText />;

    const rates = { [fiatCurrencyCode]: rate?.rate };

    const decimalValue = convertTokenValueToDecimal(value, decimals);
    const fiatValue = toFiatCurrency(decimalValue.toString(), fiatCurrencyCode, rates, 2);
    const formattedFiatValue = FiatAmountFormatter.format(fiatValue ?? 0);

    return signValue ? (
        <Text ellipsizeMode={ellipsizeMode} numberOfLines={numberOfLines}>
            <SignValueFormatter value={signValue} />
            <AmountText value={formattedFiatValue} isDiscreetText={isDiscreetText} {...rest} />
        </Text>
    ) : (
        <AmountText
            value={formattedFiatValue}
            isDiscreetText={isDiscreetText}
            ellipsizeMode={ellipsizeMode}
            numberOfLines={numberOfLines}
            {...rest}
        />
    );
};
