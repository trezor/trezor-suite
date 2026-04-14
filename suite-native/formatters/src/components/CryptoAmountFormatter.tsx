import React from 'react';

import { G } from '@mobily/ts-belt';

import { useFormatters } from '@suite-common/formatters';
import { type NetworkSymbol } from '@suite-common/wallet-config';
import { getAccountDecimals } from '@suite-common/wallet-utils';
import { type TextProps } from '@suite-native/atoms';

import { type FormatterProps } from '../types';
import { AmountText } from './AmountText';
import { EmptyAmountSkeleton } from './EmptyAmountSkeleton';

type CryptoToFiatAmountFormatterProps = FormatterProps<string | null | number> &
    TextProps & {
        symbol: NetworkSymbol;
        isBalance?: boolean;
        isDiscreetText?: boolean;
        decimals?: number;
        isForcedDiscreetMode?: boolean;
        isLoading?: boolean;
    };

export const CryptoAmountFormatter = React.memo(
    ({
        value,
        symbol,
        isBalance = true,
        isDiscreetText = true,
        variant = 'body-sm',
        color = 'contentSecondary',
        isLoading = false,
        decimals,
        ...otherProps
    }: CryptoToFiatAmountFormatterProps) => {
        const { CryptoAmountFormatter: formatter } = useFormatters();

        if (value === null || isLoading) {
            return <EmptyAmountSkeleton variant={variant} />;
        }

        const maxDisplayedDecimals = decimals ?? getAccountDecimals(symbol);

        const stringValue = G.isNumber(value) ? value.toString() : value;

        const formattedValue = formatter.format(stringValue, {
            isBalance,
            maxDisplayedDecimals,
            symbol,
            isEllipsisAppended: false,
        });

        return (
            <AmountText
                value={formattedValue}
                isDiscreetText={isDiscreetText}
                variant={variant}
                color={color}
                {...otherProps}
            />
        );
    },
);
