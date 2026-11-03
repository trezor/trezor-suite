import React from 'react';

import { useFormatters } from '@suite-common/formatters';
import { type NetworkSymbol } from '@suite-common/wallet-config';
import { type BaseCurrencyAmount } from '@suite-common/wallet-types';
import { isTestnet } from '@suite-common/wallet-utils';
import { type TextProps } from '@suite-native/atoms';

import { type DiscreetMode, type FormatterProps } from '../types';
import { DiscreetAmountText } from './DiscreetAmountText';
import { EmptyAmountSkeleton } from './EmptyAmountSkeleton';
import { EmptyAmountText } from './EmptyAmountText';

type FiatAmountFormatterProps = FormatterProps<BaseCurrencyAmount | null> &
    TextProps & {
        symbol?: NetworkSymbol;
        discreetMode?: DiscreetMode;
        isLoading?: boolean;
        maximumFractionDigits?: number;
    };

export const BaseCurrencyAmountFormatter = React.memo(
    ({
        symbol,
        value,
        variant,
        discreetMode = 'auto',
        isLoading = false,
        maximumFractionDigits,
        ...otherProps
    }: FiatAmountFormatterProps) => {
        const formatters = useFormatters();

        if (!!symbol && isTestnet(symbol)) {
            return <EmptyAmountText variant={variant} />;
        }
        if (isLoading || value === null) {
            return <EmptyAmountSkeleton variant={variant} />;
        }

        const formattedValue = (
            <formatters.BaseCurrencyAmountFormatter
                value={value}
                maximumFractionDigits={maximumFractionDigits}
            />
        );

        return (
            <DiscreetAmountText
                value={formattedValue}
                variant={variant}
                discreetMode={discreetMode}
                {...otherProps}
            />
        );
    },
);
