import { useFormatters } from '@suite-common/formatters';
import { type NetworkSymbol } from '@suite-common/wallet-config';
import { getAccountDecimals } from '@suite-common/wallet-utils';

import { FormattedCryptoAmountText } from './FormattedCryptoAmountText';
import { type AmountFormatterCommonProps } from './amountFormatterTypes';

/** Props for formatting a network coin amount. */
export type CryptoAmountFormatterProps = AmountFormatterCommonProps & {
    /** Unit represented by `value`. Defaults to the human-readable main unit. */
    valueUnit?: 'main' | 'smallest';
    /** Network whose native coin is being formatted. */
    symbol: NetworkSymbol;
    /** Network coin amount in the unit selected by `valueUnit`. */
    value: string | number | null;
};

/**
 * Formats and renders a network coin amount. Exact formatting is used unless
 * `formatStyle="compact-balance"` is requested.
 */
export const CryptoAmountFormatter = ({
    value,
    symbol,
    valueUnit = 'main',
    formatStyle = 'exact',
    isDiscreetText,
    isForcedDiscreetMode,
    isLoading = false,
    maxDisplayedDecimals,
    sign = null,
    variant = 'body-sm',
    color = 'contentSecondary',
    ...textProps
}: CryptoAmountFormatterProps) => {
    const { CryptoAmountFormatter: formatter } = useFormatters();
    const resolvedMaxDisplayedDecimals =
        formatStyle === 'exact' ? (maxDisplayedDecimals ?? getAccountDecimals(symbol)) : undefined;
    const formattedValue =
        value === null
            ? null
            : formatter.format(typeof value === 'number' ? value.toString() : value, {
                  isBalance: valueUnit === 'main',
                  maxDisplayedDecimals: resolvedMaxDisplayedDecimals,
                  symbol,
                  isEllipsisAppended: false,
                  formatStyle,
              });

    return (
        <FormattedCryptoAmountText
            formattedValue={formattedValue}
            isDiscreetText={isDiscreetText}
            isForcedDiscreetMode={isForcedDiscreetMode}
            isLoading={isLoading}
            sign={sign}
            variant={variant}
            color={color}
            {...textProps}
        />
    );
};
