import { type BaseCurrencyAmount as BaseCurrencyAmountValue } from '@suite-common/wallet-types';
import { Box, HStack, Text } from '@suite-native/atoms';

import { type FormatterProps } from '../types';
import { AmountText } from './AmountText';
import { BaseCurrencyAmount, type FormattedBaseCurrencyAmount } from './BaseCurrencyAmount';

type BaseCurrencyAmountHeaderFormatterProps = FormatterProps<BaseCurrencyAmountValue | null> & {
    isDiscreetText?: boolean;
};

type BaseCurrencyAmountContentProps = FormattedBaseCurrencyAmount & {
    isDiscreetText: boolean;
};

const BaseCurrencyAmountContent = ({
    currencySymbol,
    wholeNumber,
    decimalNumber,
    isCryptoCurrency,
    isDiscreetText,
}: BaseCurrencyAmountContentProps) => {
    const valueElement = (
        <Box flexDirection="row" alignItems="flex-end" flexShrink={1}>
            <AmountText value={wholeNumber} variant="headline-md" isDiscreetText={isDiscreetText} />
            <AmountText
                value={decimalNumber}
                variant="headline-md"
                color="contentSecondary"
                isDiscreetText={isDiscreetText}
            />
        </Box>
    );
    const currencyElement = (
        <Text variant="headline-md" color="contentSecondary">
            {currencySymbol}
        </Text>
    );

    return isCryptoCurrency ? (
        <HStack spacing="sp8" alignItems="flex-end">
            {valueElement}
            {currencyElement}
        </HStack>
    ) : (
        <HStack spacing={0} alignItems="flex-end">
            {currencyElement}
            {valueElement}
        </HStack>
    );
};

export const BaseCurrencyAmountHeaderFormatter = ({
    value,
    isDiscreetText = true,
}: BaseCurrencyAmountHeaderFormatterProps) => (
    <BaseCurrencyAmount value={value}>
        {formattedAmount => (
            <BaseCurrencyAmountContent {...formattedAmount} isDiscreetText={isDiscreetText} />
        )}
    </BaseCurrencyAmount>
);
