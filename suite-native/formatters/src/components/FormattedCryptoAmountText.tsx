import { type ReactNode } from 'react';

import { useFormatters } from '@suite-common/formatters';

import { DiscreetAmountText } from './DiscreetAmountText';
import { EmptyAmountSkeleton } from './EmptyAmountSkeleton';
import { type CryptoAmountFormatterProps } from './cryptoAmountFormatterTypes';

type FormattedCryptoAmountTextProps = Omit<CryptoAmountFormatterProps, 'value' | 'symbol'> & {
    formattedValue: ReactNode;
};

export const FormattedCryptoAmountText = ({
    formattedValue,
    discreetMode = 'auto',
    variant = 'body-sm',
    color = 'contentSecondary',
    isLoading = false,
    signValue,
    ...otherProps
}: FormattedCryptoAmountTextProps) => {
    const { SignValueFormatter } = useFormatters();

    if (formattedValue === null || isLoading) {
        return <EmptyAmountSkeleton variant={variant} />;
    }

    const valueWithSign = (
        <>
            <SignValueFormatter value={signValue} />
            {formattedValue}
        </>
    );

    return (
        <DiscreetAmountText
            value={valueWithSign}
            discreetMode={discreetMode}
            variant={variant}
            color={color}
            {...otherProps}
        />
    );
};
