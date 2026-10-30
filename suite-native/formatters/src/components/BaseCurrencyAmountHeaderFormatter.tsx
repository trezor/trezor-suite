import { type BaseCurrencyAmount as BaseCurrencyAmountValue } from '@suite-common/wallet-types';
import { Box, HStack, Text } from '@suite-native/atoms';

import { type FormatterProps } from '../types';
import { AmountText } from './AmountText';
import { BaseCurrencyAmount, type FormattedBaseCurrencyAmount } from './BaseCurrencyAmount';

type BaseCurrencyAmountHeaderFormatterProps = FormatterProps<BaseCurrencyAmountValue | null>;

const BaseCurrencyAmountContent = ({
    currencySymbol,
    wholeNumber,
    decimalNumber,
    isCryptoCurrency,
}: FormattedBaseCurrencyAmount) => {
    const valueElement = (
        <Box flexDirection="row" alignItems="flex-end" flexShrink={1}>
            <AmountText value={wholeNumber} variant="headline-md" />
            <AmountText value={decimalNumber} variant="headline-md" color="contentSecondary" />
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
}: BaseCurrencyAmountHeaderFormatterProps) => (
    <BaseCurrencyAmount value={value}>
        {formattedAmount => <BaseCurrencyAmountContent {...formattedAmount} />}
    </BaseCurrencyAmount>
);
