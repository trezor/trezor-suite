import { TextProps, Text } from '@suite-native/atoms';
import { useFormatters } from '@suite-common/formatters';
import { TokenAddress } from '@suite-common/wallet-types';
import { SignValue } from '@suite-common/suite-types';

import { FormatterProps } from '../types';
import { AmountText } from './AmountText';
import { SignValueFormatter } from './SignValueFormatter';
import { useFiatFromCryptoValue } from '../hooks/useFiatFromCryptoValue';

type EthereumTokenToFiatAmountFormatterProps = {
    contract: TokenAddress;
    isDiscreetText?: boolean;
    decimals?: number;
    signValue?: SignValue;
    historicRate?: number;
    useHistoricRate?: boolean;
} & FormatterProps<number | string> &
    TextProps;

export const EthereumTokenToFiatAmountFormatter = ({
    value,
    contract,
    isDiscreetText = true,
    decimals = 0,
    signValue,
    ellipsizeMode,
    numberOfLines,
    historicRate,
    useHistoricRate,
    ...rest
}: EthereumTokenToFiatAmountFormatterProps) => {
    const { FiatAmountFormatter } = useFormatters();
    const fiatValue = useFiatFromCryptoValue({
        cryptoValue: String(value),
        network: 'eth',
        tokenAddress: contract,
        tokenDecimals: decimals,
        historicRate,
        useHistoricRate,
    });

    const formattedFiatValue = FiatAmountFormatter.format(fiatValue ?? 0);

    return signValue ? (
        <Text ellipsizeMode={ellipsizeMode} numberOfLines={numberOfLines}>
            <SignValueFormatter value={signValue} />
            <AmountText value={formattedFiatValue} isDiscreetText={isDiscreetText} {...rest} />
        </Text>
    ) : (
        <AmountText
            value={formattedFiatValue}
            isDiscreetText={isDiscreetText}
            ellipsizeMode={ellipsizeMode}
            numberOfLines={numberOfLines}
            {...rest}
        />
    );
};
