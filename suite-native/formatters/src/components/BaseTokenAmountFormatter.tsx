import { type CryptoAmountFormatterFormatStyle, useFormatters } from '@suite-common/formatters';
import { type TokenSymbol } from '@suite-common/wallet-types';
import { type TextProps } from '@suite-native/atoms';

import { type FormatterProps } from '../types';
import { type DecimalTokenAmount } from '../utils';
import { AmountText } from './AmountText';

export type TokenAmountFormatterCommonProps = {
    tokenSymbol: TokenSymbol | null;
    isDiscreetText?: boolean;
    isPhishingTransaction?: boolean;
} & FormatterProps<DecimalTokenAmount> &
    TextProps;

export type BaseTokenAmountFormatterProps = TokenAmountFormatterCommonProps & {
    // The token's decimal precision. Used only to decide the display style (e.g. money-like
    // formatting for stablecoins). The `value` is always expected in human-readable units.
    tokenDecimals?: number;
    maxDisplayedDecimals?: number;
    formatStyle?: CryptoAmountFormatterFormatStyle;
};

export const BaseTokenAmountFormatter = ({
    value,
    tokenSymbol,
    isDiscreetText = true,
    tokenDecimals,
    maxDisplayedDecimals,
    variant = 'body-sm',
    color = 'contentSecondary',
    isPhishingTransaction = false,
    formatStyle,
    ...rest
}: BaseTokenAmountFormatterProps) => {
    // Phishing transactions values may be equal to empty string, so we replace it with 0.
    // These values are hidden by discreet mode, so the exact value does not matter anyway.
    const decimalValue = isPhishingTransaction || !value ? '0' : value.toString();

    const { CryptoAmountFormatter: formatter } = useFormatters();
    const formattedValue = formatter.format(decimalValue, {
        symbol: tokenSymbol ?? undefined,
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
            isForcedDiscreetMode={isPhishingTransaction}
            {...rest}
        />
    );
};
