import React from 'react';

import { useFormatters } from '@suite-common/formatters';
import { BaseCurrencyAmount } from '@suite-common/wallet-utils';
import { Box, Text } from '@suite-native/atoms';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles';

import { FormatterProps } from '../types';
import { AmountText } from './AmountText';
import { EmptyAmountText } from './EmptyAmountText';
import { parseBalanceAmount } from '../utils';

type BalanceFormatterProps = FormatterProps<BaseCurrencyAmount | null> & {
    isForcedDiscreetMode?: boolean;
    testID?: string;
};

const wholeNumberStyle = prepareNativeStyle(utils => ({
    flexShrink: 1,
    marginBottom: -utils.spacings.sp8,
    textAlign: 'center',
}));

export const FiatBalanceFormatter = ({
    value,
    isForcedDiscreetMode,
    testID,
}: BalanceFormatterProps) => {
    const { applyStyle } = useNativeStyles();
    const { BaseCurrencyAmountFormatter: formatter } = useFormatters();

    if (!value) return <EmptyAmountText />;

    const formattedValue = formatter.format(value);

    if (!formattedValue) return <EmptyAmountText />;

    const { currencySymbol, wholeNumber, decimalNumber } = parseBalanceAmount(formattedValue);

    const valueElement = (
        <>
            <AmountText
                value={wholeNumber}
                variant="titleLarge"
                isDiscreetText
                isForcedDiscreetMode={isForcedDiscreetMode}
                style={applyStyle(wholeNumberStyle)}
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

    const isBehind = currencySymbol === 'sat';

    return (
        <Box flexDirection="row" alignItems="flex-end" flexShrink={1} testID={testID}>
            {isBehind ? (
                <>
                    {valueElement}
                    {currencyElement}
                </>
            ) : (
                <>
                    {currencyElement}
                    {valueElement}
                </>
            )}
        </Box>
    );
};
