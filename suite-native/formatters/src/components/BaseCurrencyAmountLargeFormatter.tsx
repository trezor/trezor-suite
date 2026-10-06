import React from 'react';

import { type BaseCurrencyAmount as BaseCurrencyAmountValue } from '@suite-common/wallet-types';
import { Box, HStack, Text } from '@suite-native/atoms';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles-native';

import { type FormatterProps } from '../types';
import { AmountText } from './AmountText';
import { BaseCurrencyAmount, type FormattedBaseCurrencyAmount } from './BaseCurrencyAmount';

type BalanceFormatterProps = FormatterProps<BaseCurrencyAmountValue | null> & {
    isForcedDiscreetMode?: boolean;
    testID?: string;
};

const wholeNumberStyle = prepareNativeStyle(utils => ({
    flexShrink: 1,
    marginBottom: -utils.spacings.sp8,
    textAlign: 'center',
}));

type BaseCurrencyAmountLargeContentProps = FormattedBaseCurrencyAmount & {
    isForcedDiscreetMode?: boolean;
    testID?: string;
};

const BaseCurrencyAmountLargeContent = ({
    currencySymbol,
    wholeNumber,
    decimalNumber,
    isCryptoCurrency,
    isForcedDiscreetMode,
    testID,
}: BaseCurrencyAmountLargeContentProps) => {
    const { applyStyle } = useNativeStyles();

    const valueElement = (
        <Box flexDirection="row" alignItems="flex-end" flexShrink={1}>
            <AmountText
                value={wholeNumber}
                variant="headline-lg"
                isDiscreetText
                isForcedDiscreetMode={isForcedDiscreetMode}
                style={applyStyle(wholeNumberStyle)}
            />
            <AmountText
                value={decimalNumber}
                variant={isCryptoCurrency ? 'headline-lg' : 'headline-sm'}
                isDiscreetText
                isForcedDiscreetMode={isForcedDiscreetMode}
                style={isCryptoCurrency ? applyStyle(wholeNumberStyle) : undefined}
            />
        </Box>
    );

    const currencyElement = <Text variant="headline-sm">{currencySymbol}</Text>;

    return (
        <Box flexDirection="row" alignItems="flex-end" flexShrink={1} testID={testID}>
            {isCryptoCurrency ? (
                <HStack spacing="sp8" alignItems="flex-end">
                    {valueElement}
                    {currencyElement}
                </HStack>
            ) : (
                <>
                    {currencyElement}
                    {valueElement}
                </>
            )}
        </Box>
    );
};

export const BaseCurrencyAmountLargeFormatter = ({
    value,
    isForcedDiscreetMode,
    testID,
}: BalanceFormatterProps) => (
    <BaseCurrencyAmount value={value}>
        {formattedAmount => (
            <BaseCurrencyAmountLargeContent
                {...formattedAmount}
                isForcedDiscreetMode={isForcedDiscreetMode}
                testID={testID}
            />
        )}
    </BaseCurrencyAmount>
);
