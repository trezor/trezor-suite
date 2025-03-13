import React from 'react';

import { useFormatters } from '@suite-common/formatters';
import { NetworkSymbol } from '@suite-common/wallet-config';
import { isTestnet } from '@suite-common/wallet-utils';
import { TextProps } from '@suite-native/atoms';

import { FormatterProps } from '../types';
import { AmountText } from './AmountText';
import { EmptyAmountSkeleton } from './EmptyAmountSkeleton';
import { EmptyAmountText } from './EmptyAmountText';

type FiatAmountFormatterProps = FormatterProps<string | null> &
    TextProps & {
        symbol?: NetworkSymbol;
        isDiscreetText?: boolean;
        isForcedDiscreetMode?: boolean;
        isLoading?: boolean;
    };

export const FiatAmountFormatter = React.memo(
    ({
        symbol,
        value,
        variant,
        isDiscreetText = true,
        isLoading = false,
        ...otherProps
    }: FiatAmountFormatterProps) => {
        const { FiatAmountFormatter: formatter } = useFormatters();

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
