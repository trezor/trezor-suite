import { useFormatters } from '@suite-common/formatters';

import { FormattedCryptoAmountText } from './FormattedCryptoAmountText';
import { type CryptoAmountFormatterProps } from './cryptoAmountFormatterTypes';

export type CompactCryptoAmountFormatterProps = CryptoAmountFormatterProps;

// This should be used when showing a crypto amount alongside a fiat value.
export const CompactCryptoAmountFormatter = ({
    value,
    symbol,
    isBalance = true,
    ...otherProps
}: CompactCryptoAmountFormatterProps) => {
    const { CryptoAmountFormatter } = useFormatters();

    const formattedValue =
        value === null ? null : (
            <CryptoAmountFormatter
                value={typeof value === 'number' ? value.toString() : value}
                isBalance={isBalance}
                symbol={symbol}
                isEllipsisAppended={false}
                formatStyle="compact-balance"
            />
        );

    return <FormattedCryptoAmountText formattedValue={formattedValue} {...otherProps} />;
};
