import { useFormatters } from '@suite-common/formatters';
import { getAccountDecimals } from '@suite-common/wallet-utils';

import { FormattedCryptoAmountText } from './FormattedCryptoAmountText';
import { type CryptoAmountFormatterProps } from './cryptoAmountFormatterTypes';

export type ExactCryptoAmountFormatterProps = CryptoAmountFormatterProps & {
    maxDisplayedDecimals?: number;
};

// This should be used without a nearby fiat value or when exact precision matters.
export const ExactCryptoAmountFormatter = ({
    value,
    symbol,
    isBalance = true,
    maxDisplayedDecimals,
    ...otherProps
}: ExactCryptoAmountFormatterProps) => {
    const { CryptoAmountFormatter: formatter } = useFormatters();

    const resolvedMaxDisplayedDecimals = maxDisplayedDecimals ?? getAccountDecimals(symbol);

    const formattedValue =
        value === null
            ? null
            : formatter.format(typeof value === 'number' ? value.toString() : value, {
                  isBalance,
                  maxDisplayedDecimals: resolvedMaxDisplayedDecimals,
                  symbol,
                  isEllipsisAppended: false,
              });

    return <FormattedCryptoAmountText formattedValue={formattedValue} {...otherProps} />;
};
