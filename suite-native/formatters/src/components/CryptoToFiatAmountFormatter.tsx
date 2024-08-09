import { TextProps } from '@suite-native/atoms';
import { NetworkSymbol } from '@suite-common/wallet-config';
import { useFormatters } from '@suite-common/formatters';

import { FormatterProps } from '../types';
import { AmountText } from './AmountText';
import { useFiatFromCryptoValue } from '../hooks/useFiatFromCryptoValue';

type CryptoToFiatAmountFormatterProps = FormatterProps<string | null> &
    TextProps & {
        network: NetworkSymbol;
        historicRate?: number;
        useHistoricRate?: boolean;
        isDiscreetText?: boolean;
        isBalance?: boolean;
    };

export const CryptoToFiatAmountFormatter = ({
    value,
    network,
    historicRate,
    useHistoricRate,
    isDiscreetText = true,
    isBalance = false,
    ...textProps
}: CryptoToFiatAmountFormatterProps) => {
    const { FiatAmountFormatter } = useFormatters();

    const fiatValue = useFiatFromCryptoValue({
        network,
        historicRate,
        useHistoricRate,
        isBalance,
        cryptoValue: value,
    });

    const formattedFiatValue = FiatAmountFormatter.format(fiatValue ?? '0');

    return <AmountText value={formattedFiatValue} isDiscreetText={isDiscreetText} {...textProps} />;
};
