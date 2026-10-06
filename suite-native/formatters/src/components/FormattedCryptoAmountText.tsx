import { AmountText } from './AmountText';
import { EmptyAmountSkeleton } from './EmptyAmountSkeleton';
import { type CryptoAmountFormatterProps } from './cryptoAmountFormatterTypes';

type FormattedCryptoAmountTextProps = Omit<CryptoAmountFormatterProps, 'value' | 'symbol'> & {
    formattedValue: string | null;
};

export const FormattedCryptoAmountText = ({
    formattedValue,
    isDiscreetText = true,
    variant = 'body-sm',
    color = 'contentSecondary',
    isLoading = false,
    sign = null,
    ...otherProps
}: FormattedCryptoAmountTextProps) => {
    if (formattedValue === null || isLoading) {
        return <EmptyAmountSkeleton variant={variant} />;
    }

    const valueWithSign = !sign ? formattedValue : `${sign}${formattedValue}`;

    return (
        <AmountText
            value={valueWithSign}
            isDiscreetText={isDiscreetText}
            variant={variant}
            color={color}
            {...otherProps}
        />
    );
};
