import { type TextProps } from '@suite-native/atoms';

import { AmountText } from './AmountText';
import { EmptyAmountSkeleton } from './EmptyAmountSkeleton';

type FormattedCryptoAmountTextProps = {
    formattedValue: string | null;
    isDiscreetText?: boolean;
    isForcedDiscreetMode?: boolean;
    isLoading?: boolean;
    sign?: '+' | '-' | null;
} & TextProps;

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
