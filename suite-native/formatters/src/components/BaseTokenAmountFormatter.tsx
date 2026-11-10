import { type CryptoAmountFormatterFormatStyle, useFormatters } from '@suite-common/formatters';
import { type SignValue } from '@suite-common/suite-types';
import { useTokenMetadata } from '@suite-common/token';
import { type TokenAddress } from '@suite-common/tokens';
import { type TextProps } from '@suite-native/atoms';
import { TokenSymbol } from '@suite-native/tokens';
import { type NetworkSymbol } from '@trezor/network-module-types';

import { type DiscreetMode, type FormatterProps } from '../types';
import { type DecimalTokenAmount } from '../utils';
import { FormattedCryptoAmountText } from './FormattedCryptoAmountText';

export type TokenAmountFormatterCommonProps = {
    networkSymbol: NetworkSymbol;
    contractAddress: TokenAddress;
    isSymbolTruncated?: boolean;
    discreetMode?: DiscreetMode;
    signValue?: SignValue;
} & FormatterProps<DecimalTokenAmount> &
    TextProps;

export type BaseTokenAmountFormatterProps = TokenAmountFormatterCommonProps & {
    maxDisplayedDecimals?: number;
    formatStyle?: CryptoAmountFormatterFormatStyle;
};

export const BaseTokenAmountFormatter = ({
    value,
    networkSymbol,
    contractAddress,
    variant = 'body-sm',
    color = 'contentSecondary',
    discreetMode = 'auto',
    isSymbolTruncated = false,
    maxDisplayedDecimals,
    formatStyle,
    ...rest
}: BaseTokenAmountFormatterProps) => {
    const token = useTokenMetadata(networkSymbol, contractAddress);
    const decimalValue = value ? value.toString() : '0';

    const { CryptoAmountFormatter } = useFormatters();
    const formattedValue = (
        <>
            <CryptoAmountFormatter
                value={decimalValue}
                // Token values are already decimal; a ticker matching a network must not change units.
                smallestUnitsOverride={false}
                withSymbol={false}
                maxDisplayedDecimals={maxDisplayedDecimals ?? token?.decimals}
                formatStyle={formatStyle}
                tokenDecimals={token?.decimals}
            />
            &nbsp;
            {/* A token without a symbol still shows a unit, the unknown-token label. */}
            <TokenSymbol
                isTruncated={isSymbolTruncated}
                networkSymbol={networkSymbol}
                contractAddress={contractAddress}
                variant={variant}
                color={color}
            />
        </>
    );

    return (
        <FormattedCryptoAmountText
            formattedValue={formattedValue}
            discreetMode={discreetMode}
            variant={variant}
            color={color}
            {...rest}
        />
    );
};
