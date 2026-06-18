import { G } from '@mobily/ts-belt';

import { useFormatters } from '@suite-common/formatters';
import { type NetworkSymbol, isNetworkSymbol } from '@suite-common/wallet-config';
import { type TokenSymbol } from '@suite-common/wallet-types';
import { getAccountDecimals } from '@suite-common/wallet-utils';
import { type TextProps } from '@suite-native/atoms';

import { type FormatterProps } from '../types';
import { AmountText } from './AmountText';
import { EmptyAmountSkeleton } from './EmptyAmountSkeleton';

type CryptoAmountFormatterNonPreciseProps = FormatterProps<string | null | number> &
    TextProps & {
        symbol: NetworkSymbol | TokenSymbol;
        isBalance?: boolean;
        isDiscreetText?: boolean;
        decimals?: number;
        isForcedDiscreetMode?: boolean;
        isLoading?: boolean;
        sign?: '+' | '-' | null;
    };

export const CryptoAmountFormatterNonPrecise = ({
    value,
    symbol,
    isBalance = true,
    isDiscreetText = true,
    variant = 'body-sm',
    color = 'contentSecondary',
    isLoading = false,
    sign = null,
    decimals,
    ...otherProps
}: CryptoAmountFormatterNonPreciseProps) => {
    const { CryptoAmountFormatterNonPrecise: formatter } = useFormatters();

    if (value === null || isLoading) {
        return <EmptyAmountSkeleton variant={variant} />;
    }

    const maxDisplayedDecimals =
        decimals ?? (isNetworkSymbol(symbol) ? getAccountDecimals(symbol) : undefined);

    const stringValue = G.isNumber(value) ? value.toString() : value;

    const formattedValue = formatter.format(stringValue, {
        isBalance,
        maxDisplayedDecimals,
        symbol,
        isEllipsisAppended: false,
    });

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
