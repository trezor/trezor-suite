import React from 'react';

import { useFormatters } from '@suite-common/formatters';
import { type NetworkSymbol } from '@suite-common/wallet-config';
import { type BaseCurrencyAmount, isTestnet } from '@suite-common/wallet-utils';
import { type TextProps } from '@suite-native/atoms';

import { type FormatterProps } from '../types';
import { AmountText } from './AmountText';
import { EmptyAmountSkeleton } from './EmptyAmountSkeleton';
import { EmptyAmountText } from './EmptyAmountText';

type FiatAmountFormatterProps = FormatterProps<BaseCurrencyAmount | null> &
    TextProps & {
        symbol?: NetworkSymbol;
        isDiscreetText?: boolean;
        isForcedDiscreetMode?: boolean;
        isLoading?: boolean;
    };

export const BaseCurrencyAmountFormatter = React.memo(
    ({
        symbol,
        value,
        variant,
        isDiscreetText = true,
        isLoading = false,
        ...otherProps
    }: FiatAmountFormatterProps) => {
        const { BaseCurrencyAmountFormatter: formatter } = useFormatters();

        if (!!symbol && isTestnet(symbol)) {
            return <EmptyAmountText variant={variant} />;
        }
        if (isLoading || value === null) {
            return <EmptyAmountSkeleton variant={variant} />;
        }

        const formattedValue = formatter.format(value);

        return (
            <AmountText
                value={formattedValue}
                variant={variant}
                isDiscreetText={isDiscreetText}
                {...otherProps}
            />
        );
    },
);
