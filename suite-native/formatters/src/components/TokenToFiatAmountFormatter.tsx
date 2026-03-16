import { useFormatters } from '@suite-common/formatters';
import { type SignValue } from '@suite-common/suite-types';
import { type NetworkSymbol } from '@suite-common/wallet-config';
import { type TokenAddress } from '@suite-common/wallet-types';
import { Box, type TextProps } from '@suite-native/atoms';

import { type FormatterProps } from '../types';
import { AmountText } from './AmountText';
import { EmptyAmountSkeleton } from './EmptyAmountSkeleton';
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
    isForcedDiscreetMode,
    ...rest
}: TokenToFiatAmountFormatterProps) => {
    const { BaseCurrencyAmountFormatter } = useFormatters();
    const fiatValue = useFiatFromCryptoValue({
        cryptoValue: String(value),
        symbol,
        tokenAddress: contract,
        tokenDecimals: decimals,
        historicRate,
        useHistoricRate,
    });

    if (fiatValue === null && !isForcedDiscreetMode) {
        return <EmptyAmountSkeleton />;
    }

    const formattedFiatValue = isForcedDiscreetMode
        ? '$0.00' // in case of isForceDiscreetMode the value is blurred, so the real value does not matter
        : BaseCurrencyAmountFormatter.format(fiatValue!);

    const amountText = (
        <AmountText
            value={formattedFiatValue}
            isDiscreetText={isDiscreetText}
            ellipsizeMode={ellipsizeMode}
            numberOfLines={numberOfLines}
            isForcedDiscreetMode={isForcedDiscreetMode}
            {...rest}
        />
    );

    if (!signValue) {
        return amountText;
    }

    return (
        <Box flexDirection="row">
            <SignValueFormatter value={signValue} />
            {amountText}
        </Box>
    );
};
