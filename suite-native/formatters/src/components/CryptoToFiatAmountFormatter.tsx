import { TextProps } from '@suite-native/atoms';
import { NetworkSymbol } from '@suite-common/wallet-config';
import { FiatRates } from '@trezor/blockchain-link';
import { useFormatters } from '@suite-common/formatters';

import { FormatterProps } from '../types';
import { AmountText } from './AmountText';
import { useFiatFromCryptoValue } from '../hooks/useFiatFromCryptoValue';

type CryptoToFiatAmountFormatterProps = FormatterProps<string | null> &
    TextProps & {
        network: NetworkSymbol;
        customRates?: FiatRates;
        isDiscreetText?: boolean;
    };

export const CryptoToFiatAmountFormatter = ({
    value,
    network,
    customRates,
    isDiscreetText = true,
    ...textProps
}: CryptoToFiatAmountFormatterProps) => {
    const { FiatAmountFormatter } = useFormatters();

    const fiatValue = useFiatFromCryptoValue({ cryptoValue: value, network, customRates });

    const formattedFiatValue = FiatAmountFormatter.format(fiatValue ?? '0');

    return <AmountText value={formattedFiatValue} isDiscreetText={isDiscreetText} {...textProps} />;
};
