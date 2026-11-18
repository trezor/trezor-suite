import { type BaseCurrencyAmount as BaseCurrencyAmountValue } from '@suite-common/wallet-types';
import { Text } from '@suite-native/atoms';
import { type NativeTypographyStyle } from '@trezor/theme';

import { type FormatterProps } from '../types';
import { AmountText } from './AmountText';
import { BaseCurrencyAmount, type FormattedBaseCurrencyAmount } from './BaseCurrencyAmount';
import { EmptyAmountSkeleton } from './EmptyAmountSkeleton';

type BaseCurrencyAmountHeaderFormatterProps = FormatterProps<BaseCurrencyAmountValue | null> & {
    variant?: NativeTypographyStyle;
    isExact?: boolean;
};

type BaseCurrencyAmountContentProps = FormattedBaseCurrencyAmount & {
    variant: NativeTypographyStyle;
};

const BaseCurrencyAmountContent = ({
    currencySymbol,
    wholeNumber,
    decimalNumber,
    isCryptoCurrency,
    variant,
}: BaseCurrencyAmountContentProps) => {
    const valueElement = (
        <>
            <AmountText value={wholeNumber} variant={variant} />
            <AmountText value={decimalNumber} variant={variant} color="contentSecondary" />
        </>
    );
    const currencyElement = (
        <Text variant={variant} color="contentSecondary">
            {currencySymbol}
        </Text>
    );

    // One text run, so a long amount shrinks as a whole to fit one line.
    return (
        <Text variant={variant} numberOfLines={1} adjustsFontSizeToFit>
            {isCryptoCurrency ? (
                <>
                    {valueElement} {currencyElement}
                </>
            ) : (
                <>
                    {currencyElement}
                    {valueElement}
                </>
            )}
        </Text>
    );
};

export const BaseCurrencyAmountHeaderFormatter = ({
    value,
    variant = 'headline-md',
    isExact,
}: BaseCurrencyAmountHeaderFormatterProps) => {
    if (value === null) {
        return <EmptyAmountSkeleton variant={variant} />;
    }

    return (
        <BaseCurrencyAmount value={value} isExact={isExact}>
            {formattedAmount => (
                <BaseCurrencyAmountContent {...formattedAmount} variant={variant} />
            )}
        </BaseCurrencyAmount>
    );
};
