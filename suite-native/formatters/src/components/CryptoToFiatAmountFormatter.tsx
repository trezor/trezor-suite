import { NetworkSymbol } from '@suite-common/wallet-config';
import { TextProps } from '@suite-native/atoms';

import { useFiatFromCryptoValue } from '../hooks/useFiatFromCryptoValue';
import { FormatterProps } from '../types';
import { BaseCurrencyAmountFormatter } from './BaseCurrencyAmountFormatter';

type CryptoToFiatAmountFormatterProps = FormatterProps<string | number | null> &
    TextProps & {
        symbol: NetworkSymbol;
        historicRate?: number;
        useHistoricRate?: boolean;
        isBalance?: boolean;
        isForcedDiscreetMode?: boolean;
        isLoading?: boolean;
    };

export const CryptoToFiatAmountFormatter = ({
    value,
    symbol,
    historicRate,
    useHistoricRate,
    isBalance = false,
    isLoading = false,
    ...otherProps
}: CryptoToFiatAmountFormatterProps) => {
    const fiatValue = useFiatFromCryptoValue({
        symbol,
        historicRate,
        useHistoricRate,
        isBalance,
        cryptoValue: value ? value.toString() : null,
    });

    return (
        <BaseCurrencyAmountFormatter
            symbol={symbol}
            value={fiatValue?.toFixed() ?? null}
            isLoading={isLoading}
            {...otherProps}
        />
    );
};
