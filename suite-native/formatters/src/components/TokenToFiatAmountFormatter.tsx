import { useSelector } from 'react-redux';

import { useFormatters } from '@suite-common/formatters';
import { type SignValue } from '@suite-common/suite-types';
import { useTokenMetadata } from '@suite-common/token';
import { type TokenAddress } from '@suite-common/tokens';
import { type NetworkSymbol } from '@suite-common/wallet-config';
import { selectIsTokenFiatRateDisallowed } from '@suite-common/wallet-core';
import { type TextProps } from '@suite-native/atoms';
import { type TokensRootState } from '@suite-native/tokens';

import { useFiatFromCryptoValue } from '../hooks/useFiatFromCryptoValue';
import { type DiscreetMode, type FormatterProps } from '../types';
import { DiscreetAmountText } from './DiscreetAmountText';
import { EmptyAmountSkeleton } from './EmptyAmountSkeleton';
import { SignValueFormatter } from './SignValueFormatter';

type TokenToFiatAmountFormatterProps = {
    symbol: NetworkSymbol;
    contract: TokenAddress;
    /**
     * The value is in whole token units, as in account balances, instead of base units.
     *
     * @deprecated A boolean switch does not say which unit a value is in, so every caller has to
     * know it and branch on it. The unit scale belongs in the value's type: branded types such as
     * `DecimalTokenAmount` for whole units and a counterpart for base units, converted once at
     * the data boundary. Unify token amounts on those types and accept only one of them here.
     */
    isBalance?: boolean;
    discreetMode?: DiscreetMode;
    signValue?: SignValue;
    historicRate?: number;
    useHistoricRate?: boolean;
} & FormatterProps<number | string> &
    TextProps;

export const TokenToFiatAmountFormatter = ({
    symbol,
    value,
    contract,
    isBalance = false,
    discreetMode = 'auto',
    signValue,
    ellipsizeMode,
    numberOfLines,
    historicRate,
    useHistoricRate,
    ...rest
}: TokenToFiatAmountFormatterProps) => {
    const { BaseCurrencyAmountFormatter } = useFormatters();
    const token = useTokenMetadata(symbol, contract);
    const fiatValue = useFiatFromCryptoValue({
        cryptoValue: String(value),
        symbol,
        tokenAddress: contract,
        tokenDecimals: isBalance ? 0 : (token?.decimals ?? 0),
        historicRate,
        useHistoricRate,
    });
    const isFiatRateDisallowed = useSelector((state: TokensRootState) =>
        selectIsTokenFiatRateDisallowed(state, symbol, contract),
    );

    if (fiatValue === null) {
        return isFiatRateDisallowed ? null : <EmptyAmountSkeleton />;
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
