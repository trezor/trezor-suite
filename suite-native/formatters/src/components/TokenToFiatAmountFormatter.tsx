import { useFormatters } from '@suite-common/formatters';
import { type SignValue } from '@suite-common/suite-types';
import { type NetworkSymbol } from '@suite-common/wallet-config';
import { type TokenAddress } from '@suite-common/wallet-types';
import { type TextProps } from '@suite-native/atoms';

import { useFiatFromCryptoValue } from '../hooks/useFiatFromCryptoValue';
import { type DiscreetMode, type FormatterProps } from '../types';
import { DiscreetAmountText } from './DiscreetAmountText';
import { EmptyAmountSkeleton } from './EmptyAmountSkeleton';
import { SignValueFormatter } from './SignValueFormatter';

type TokenToFiatAmountFormatterProps = {
    symbol: NetworkSymbol;
    contract: TokenAddress;
    discreetMode?: DiscreetMode;
    decimals?: number;
    signValue?: SignValue;
    historicRate?: number;
    useHistoricRate?: boolean;
} & FormatterProps<number | string> &
    TextProps;

export const TokenToFiatAmountFormatter = ({
    symbol,
    value,
    contract,
    discreetMode = 'auto',
    decimals = 0,
    signValue,
    ellipsizeMode,
    numberOfLines,
    historicRate,
    useHistoricRate,
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

    if (fiatValue === null) {
        return <EmptyAmountSkeleton />;
    }

    const formattedFiatValue = (
        <>
            <SignValueFormatter value={signValue} />
            <BaseCurrencyAmountFormatter value={fiatValue} />
        </>
    );

    return (
        <DiscreetAmountText
            value={formattedFiatValue}
            discreetMode={discreetMode}
            ellipsizeMode={ellipsizeMode}
            numberOfLines={numberOfLines}
            {...rest}
        />
    );
};
