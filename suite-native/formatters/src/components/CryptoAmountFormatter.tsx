import { type RequireAtLeastOne } from 'type-fest';

import { type CryptoAmountFormatterFormatStyle, useFormatters } from '@suite-common/formatters';
import { type NetworkSymbol } from '@suite-common/wallet-config';
import { type TokenSymbol, toTokenSymbol } from '@suite-common/wallet-types';
import { getAccountDecimals } from '@suite-common/wallet-utils';
import { type TextProps } from '@suite-native/atoms';
import { exhaustive } from '@trezor/type-utils';

import { AmountText } from './AmountText';
import { FormattedCryptoAmountText } from './FormattedCryptoAmountText';

type CryptoAmountFormatterCommonProps = {
    value: string | number | null;
    formatStyle: CryptoAmountFormatterFormatStyle;
    isBalance?: boolean;
    isDiscreetText?: boolean;
    isForcedDiscreetMode?: boolean;
    isLoading?: boolean;
    isPhishingTransaction?: boolean;
    maxDisplayedDecimals?: number;
    sign?: '+' | '-' | null;
} & TextProps;

type CoinCryptoAmountFormatterProps = {
    symbol: NetworkSymbol;
} & Partial<TokenCryptoAmountMetadataProps>;

type TokenCryptoAmountMetadataProps = {
    tokenContract: string | null | undefined;
    tokenDecimals: number | undefined;
    tokenSymbol: TokenSymbol | string | null | undefined;
};

type TokenCryptoAmountFormatterProps = {
    symbol?: undefined;
} & RequireAtLeastOne<TokenCryptoAmountMetadataProps>;

export type CryptoAmountFormatterProps = CryptoAmountFormatterCommonProps &
    (CoinCryptoAmountFormatterProps | TokenCryptoAmountFormatterProps);

export const CryptoAmountFormatter = (props: CryptoAmountFormatterProps) => {
    const {
        value,
        symbol,
        formatStyle,
        isBalance = true,
        isDiscreetText,
        isForcedDiscreetMode,
        isLoading = false,
        isPhishingTransaction = false,
        maxDisplayedDecimals,
        sign = null,
        tokenContract,
        tokenDecimals,
        tokenSymbol,
        variant = 'body-sm',
        color = 'contentSecondary',
        ...textProps
    } = props;
    const { CryptoAmountFormatter: formatter } = useFormatters();
    const hasTokenAmountProps =
        'tokenContract' in props || 'tokenSymbol' in props || 'tokenDecimals' in props;
    const isTokenAmount = !!tokenContract || (symbol === undefined && hasTokenAmountProps);

    if (isTokenAmount) {
        const resolvedTokenSymbol = tokenSymbol ? toTokenSymbol(tokenSymbol) : undefined;
        // Phishing transactions values may be equal to empty string, so we replace it with 0.
        // These values are hidden by discreet mode, so the exact value does not matter anyway.
        const decimalValue = isPhishingTransaction || !value ? '0' : value.toString();
        const formattedValue = formatter.format(decimalValue, {
            symbol: resolvedTokenSymbol,
            maxDisplayedDecimals,
            formatStyle,
            tokenDecimals,
        });

        return (
            <AmountText
                value={formattedValue}
                isDiscreetText={isDiscreetText}
                variant={variant}
                color={color}
                isForcedDiscreetMode={isForcedDiscreetMode || isPhishingTransaction}
                {...textProps}
            />
        );
    }

    if (symbol === undefined) {
        return null;
    }

    const resolvedMaxDisplayedDecimals =
        formatStyle === 'exact' ? (maxDisplayedDecimals ?? getAccountDecimals(symbol)) : undefined;

    const formattedValue =
        value === null
            ? null
            : formatter.format(typeof value === 'number' ? value.toString() : value, {
                  isBalance,
                  maxDisplayedDecimals: resolvedMaxDisplayedDecimals,
                  symbol,
                  isEllipsisAppended: false,
                  formatStyle,
              });

    switch (formatStyle) {
        case 'compact-balance':
        case 'exact':
            return (
                <FormattedCryptoAmountText
                    formattedValue={formattedValue}
                    isDiscreetText={isDiscreetText}
                    isForcedDiscreetMode={isForcedDiscreetMode}
                    isLoading={isLoading}
                    sign={sign}
                    variant={variant}
                    color={color}
                    {...textProps}
                />
            );
        default:
            return exhaustive(formatStyle);
    }
};
