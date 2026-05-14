import React from 'react';

import { useFormatters } from '@suite-common/formatters';
import { type NetworkSymbol } from '@suite-common/wallet-config';
import { type BaseCurrencyAmount } from '@suite-common/wallet-types';
import { isTestnet } from '@suite-common/wallet-utils';
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
        maximumFractionDigits?: number;
    };

export const BaseCurrencyAmountFormatter = React.memo(
    ({
        symbol,
        value,
        variant,
        isDiscreetText = true,
        isLoading = false,
        isForcedDiscreetMode,
        maximumFractionDigits,
        ...otherProps
    }: FiatAmountFormatterProps) => {
        const { BaseCurrencyAmountFormatter: formatter } = useFormatters();

        if (!!symbol && isTestnet(symbol)) {
            return <EmptyAmountText variant={variant} />;
        }
        if (isLoading || (value === null && !isForcedDiscreetMode)) {
            return <EmptyAmountSkeleton variant={variant} />;
        }

        // in case of isForceDiscreetMode the value is blurred, so the real value does not matter
        const formattedValue = isForcedDiscreetMode
            ? '$0.00'
            : formatter.format(value!, { maximumFractionDigits });

        return (
            <AmountText
                value={formattedValue}
                variant={variant}
                isDiscreetText={isDiscreetText}
                isForcedDiscreetMode={isForcedDiscreetMode}
                {...otherProps}
            />
        );
    },
);
