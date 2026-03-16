import { useFormatters } from '@suite-common/formatters';
import { type TokenSymbol } from '@suite-common/wallet-types';
import { type TextProps } from '@suite-native/atoms';

import { type FormatterProps } from '../types';
import { AmountText } from './AmountText';
import { convertTokenValueToDecimal } from '../utils';

export type TokenAmountFormatterProps = {
    tokenSymbol: TokenSymbol | null;
    isDiscreetText?: boolean;
    decimals?: number;
    isPhishingTransaction?: boolean;
} & FormatterProps<number | string> &
    TextProps;

export const TokenAmountFormatter = ({
    value,
    tokenSymbol,
    isDiscreetText = true,
    decimals = 0,
    variant = 'body-sm',
    color = 'textSubdued',
    isPhishingTransaction = false,
    ...rest
}: TokenAmountFormatterProps) => {
    // Phishing transactions values may be equal to empty string, so we replace it with 0.
    // These values are hidden by discreet mode , so the exact value does not matter anyway.

    const decimalValue =
        isPhishingTransaction || !value ? 0 : convertTokenValueToDecimal(value, decimals);

    const { CryptoAmountFormatter: formatter } = useFormatters();
    const formattedValue = formatter.format(decimalValue.toString(), {
        symbol: tokenSymbol ?? undefined,
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
