import { useFormatters } from '@suite-common/formatters';
import { type TokenSymbol } from '@suite-common/wallet-types';

import { FormattedCryptoAmountText } from './FormattedCryptoAmountText';
import { type AmountFormatterCommonProps } from './amountFormatterTypes';
import { type DecimalTokenAmount } from '../utils';

/** Props for formatting a token amount expressed in human-readable decimal units. */
export type TokenAmountFormatterProps = AmountFormatterCommonProps & {
    /** Native decimal precision used to select money-like compact formatting. */
    decimals?: number;
    /** Forces discreet rendering for a potentially malicious token value. */
    isPhishingTransaction?: boolean;
    /** Token display symbol. */
    symbol?: TokenSymbol;
    /** Token amount in human-readable decimal units. */
    value: DecimalTokenAmount;
};

/**
 * Formats and renders a decimal token amount. Exact formatting is used unless
 * `formatStyle="compact-balance"` is requested.
 */
export const TokenAmountFormatter = ({
    value,
    decimals,
    symbol,
    isPhishingTransaction = false,
    formatStyle = 'exact',
    isDiscreetText,
    isForcedDiscreetMode,
    isLoading = false,
    maxDisplayedDecimals,
    sign = null,
    variant = 'body-sm',
    color = 'contentSecondary',
    ...textProps
}: TokenAmountFormatterProps) => {
    const { CryptoAmountFormatter: formatter } = useFormatters();

    // Phishing transaction values may be empty. They are always hidden, so their exact
    // replacement value is not observable.
    const decimalValue = isPhishingTransaction || !value ? '0' : value;
    const formattedValue = formatter.format(decimalValue, {
        symbol,
        maxDisplayedDecimals,
        formatStyle,
        tokenDecimals: decimals,
    });

    return (
        <FormattedCryptoAmountText
            formattedValue={formattedValue}
            isDiscreetText={isDiscreetText}
            isForcedDiscreetMode={isForcedDiscreetMode || isPhishingTransaction}
            isLoading={isLoading}
            sign={sign}
            variant={variant}
            color={color}
            {...textProps}
        />
    );
};
