import { TextProps, Box } from '@suite-native/atoms';
import { useFormatters } from '@suite-common/formatters';
import { TokenAddress } from '@suite-common/wallet-types';
import { SignValue } from '@suite-common/suite-types';
import { NetworkSymbol } from '@suite-common/wallet-config';

import { FormatterProps } from '../types';
import { AmountText } from './AmountText';
import { SignValueFormatter } from './SignValueFormatter';
import { useFiatFromCryptoValue } from '../hooks/useFiatFromCryptoValue';

type TokenToFiatAmountFormatterProps = {
    symbol: NetworkSymbol;
    contract: TokenAddress;
    isDiscreetText?: boolean;
    decimals?: number;
    signValue?: SignValue;
    historicRate?: number;
    useHistoricRate?: boolean;
    isForcedDiscreetMode?: boolean;
} & FormatterProps<number | string> &
    TextProps;

export const TokenToFiatAmountFormatter = ({
    symbol,
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
}: TokenToFiatAmountFormatterProps) => {
    const { FiatAmountFormatter } = useFormatters();
    const fiatValue = useFiatFromCryptoValue({
        cryptoValue: String(value),
        symbol,
        tokenAddress: contract,
        tokenDecimals: decimals,
        historicRate,
        useHistoricRate,
    });

    const formattedFiatValue = FiatAmountFormatter.format(fiatValue ?? 0);

    return signValue ? (
        <Box flexDirection="row">
            <SignValueFormatter value={signValue} />
            <AmountText
                value={formattedFiatValue}
                isDiscreetText={isDiscreetText}
                ellipsizeMode={ellipsizeMode}
                numberOfLines={numberOfLines}
                {...rest}
            />
        </Box>
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
