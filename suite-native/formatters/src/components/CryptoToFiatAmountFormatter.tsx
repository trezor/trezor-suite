import { TextProps } from '@suite-native/atoms';
import { NetworkSymbol } from '@suite-common/wallet-config';

import { FormatterProps } from '../types';
import { useFiatFromCryptoValue } from '../hooks/useFiatFromCryptoValue';
import { FiatAmountFormatter } from './FiatAmountFormatter';

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
        <FiatAmountFormatter
            symbol={symbol}
            value={fiatValue}
            isLoading={isLoading}
            {...otherProps}
        />
    );
};
