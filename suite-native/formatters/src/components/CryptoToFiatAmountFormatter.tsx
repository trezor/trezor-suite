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
    };

export const CryptoToFiatAmountFormatter = ({
    value,
    network,
    historicRate,
    useHistoricRate,
    isDiscreetText = true,
    ...textProps
}: CryptoToFiatAmountFormatterProps) => {
    const { FiatAmountFormatter } = useFormatters();

    const fiatValue = useFiatFromCryptoValue({
        cryptoValue: value,
        network,
        historicRate,
        useHistoricRate,
    });

    const formattedFiatValue = FiatAmountFormatter.format(fiatValue ?? '0');

    return <AmountText value={formattedFiatValue} isDiscreetText={isDiscreetText} {...textProps} />;
};
