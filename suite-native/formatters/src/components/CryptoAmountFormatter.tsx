import React from 'react';

import { G } from '@mobily/ts-belt';

import { useFormatters } from '@suite-common/formatters';
import { type NetworkSymbol, getNetwork } from '@suite-common/wallet-config';
import { TextProps } from '@suite-native/atoms';

import { FormatterProps } from '../types';
import { AmountText } from './AmountText';
import { formatNumberWithThousandCommas } from '../utils';
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
        variant = 'hint',
        color = 'textSubdued',
        isLoading = false,
        decimals,
        ...otherProps
    }: CryptoToFiatAmountFormatterProps) => {
        const { CryptoAmountFormatter: formatter } = useFormatters();

        if (value === null || isLoading) {
            return <EmptyAmountSkeleton variant={variant} />;
        }

        const maxDisplayedDecimals = decimals ?? getNetwork(symbol).decimals;

        const stringValue = G.isNumber(value) ? value.toString() : value;

        let formattedValue = formatter.format(stringValue, {
            isBalance,
            maxDisplayedDecimals,
            symbol,
            isEllipsisAppended: false,
        });

        // due to possible sat <-> btc conversion in previous formatter
        // we need to format the number after the currency was added (e.g. '123903 sat')
        // split value and currency, format value with thousands commas
        const splitValue = formattedValue.split(' ');
        if (splitValue.length > 1) {
            formattedValue = `${formatNumberWithThousandCommas(splitValue[0])} ${splitValue.slice(1).join(' ')}`;
        } else if (splitValue.length > 0) {
            formattedValue = formatNumberWithThousandCommas(splitValue[0]);
        }

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
