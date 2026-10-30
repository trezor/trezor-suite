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
    const { CryptoAmountFormatter } = useFormatters();

    const resolvedMaxDisplayedDecimals = maxDisplayedDecimals ?? getAccountDecimals(symbol);

    const formattedValue =
        value === null ? null : (
            <CryptoAmountFormatter
                value={typeof value === 'number' ? value.toString() : value}
                isBalance={isBalance}
                symbol={symbol}
                isEllipsisAppended={false}
                maxDisplayedDecimals={resolvedMaxDisplayedDecimals}
            />
        );

    return <FormattedCryptoAmountText formattedValue={formattedValue} {...otherProps} />;
};
