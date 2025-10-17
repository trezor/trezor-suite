import React from 'react';

import { useFormatters } from '@suite-common/formatters';
import { NetworkSymbol } from '@suite-common/wallet-config';
import { getAccountDecimals } from '@suite-common/wallet-utils';
import { Box, Text } from '@suite-native/atoms';

import { FormatterProps } from '../types';
import { AmountText } from './AmountText';
import { EmptyAmountText } from './EmptyAmountText';
import { parseBalanceAmount } from '../utils';

type BalanceFormatterProps = FormatterProps<string | null> & {
    symbol: NetworkSymbol;
    isForcedDiscreetMode?: boolean;
    testID?: string;
    isBalance?: boolean;
};

export const CryptoAmountLargeFormatter = ({
    value,
    symbol,
    isBalance = true,
    isForcedDiscreetMode,
    testID,
}: BalanceFormatterProps) => {
    const { CryptoAmountFormatter: formatter } = useFormatters();

    if (!value) return <EmptyAmountText />;

    const maxDisplayedDecimals = getAccountDecimals(symbol);

    const formattedValue = formatter.format(value, {
        isBalance,
        maxDisplayedDecimals,
        symbol,
    });

    if (!formattedValue) return <EmptyAmountText />;

    const { currencySymbol, wholeNumber, decimalNumber } = parseBalanceAmount(formattedValue);

    const valueElement = (
        <>
            <AmountText
                value={wholeNumber}
                variant="titleSmall" // Crypto doesn't look good with bigger leading zero
                isDiscreetText
                isForcedDiscreetMode={isForcedDiscreetMode}
            />
            <AmountText
                value={decimalNumber}
                variant="titleSmall"
                isDiscreetText
                isForcedDiscreetMode={isForcedDiscreetMode}
            />
        </>
    );

    const currencyElement = <Text variant="titleSmall">{currencySymbol}</Text>;

    return (
        <Box flexDirection="row" alignItems="flex-end" flexShrink={1} testID={testID}>
            {valueElement}
            {currencyElement}
        </Box>
    );
};
