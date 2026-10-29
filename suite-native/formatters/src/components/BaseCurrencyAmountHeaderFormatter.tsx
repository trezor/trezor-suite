import { type BaseCurrencyAmount as BaseCurrencyAmountValue } from '@suite-common/wallet-types';
import { Box, HStack, Text } from '@suite-native/atoms';
import { type NativeTypographyStyle } from '@trezor/theme';

import { type FormatterProps } from '../types';
import { AmountText } from './AmountText';
import { BaseCurrencyAmount, type FormattedBaseCurrencyAmount } from './BaseCurrencyAmount';

type BaseCurrencyAmountHeaderFormatterProps = FormatterProps<BaseCurrencyAmountValue | null> & {
    isDiscreetText?: boolean;
    variant?: NativeTypographyStyle;
};

type BaseCurrencyAmountContentProps = FormattedBaseCurrencyAmount & {
    isDiscreetText: boolean;
    variant: NativeTypographyStyle;
};

const BaseCurrencyAmountContent = ({
    currencySymbol,
    wholeNumber,
    decimalNumber,
    isCryptoCurrency,
    isDiscreetText,
    variant,
}: BaseCurrencyAmountContentProps) => {
    const valueElement = (
        <Box flexDirection="row" alignItems="flex-end" flexShrink={1}>
            <AmountText value={wholeNumber} variant={variant} isDiscreetText={isDiscreetText} />
            <AmountText
                value={decimalNumber}
                variant={variant}
                color="contentSecondary"
                isDiscreetText={isDiscreetText}
            />
        </Box>
    );
    const currencyElement = (
        <Text variant={variant} color="contentSecondary">
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
    variant = 'headline-md',
}: BaseCurrencyAmountHeaderFormatterProps) => (
    <BaseCurrencyAmount value={value}>
        {formattedAmount => (
            <BaseCurrencyAmountContent
                {...formattedAmount}
                isDiscreetText={isDiscreetText}
                variant={variant}
            />
        )}
    </BaseCurrencyAmount>
);
