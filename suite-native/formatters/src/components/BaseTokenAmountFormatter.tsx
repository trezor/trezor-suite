import {
    type CryptoAmountFormatterFormatStyle,
    joinAmountWithSymbol,
    useFormatters,
} from '@suite-common/formatters';
import { type SignValue } from '@suite-common/suite-types';
import { type TokenSymbol } from '@suite-common/wallet-types';
import { type TextProps } from '@suite-native/atoms';

import { type DiscreetMode, type FormatterProps } from '../types';
import { type DecimalTokenAmount } from '../utils';
import { FormattedCryptoAmountText } from './FormattedCryptoAmountText';

export type TokenAmountFormatterCommonProps = {
    tokenSymbol: TokenSymbol | null;
    discreetMode?: DiscreetMode;
    isPhishingTransaction?: boolean;
    signValue?: SignValue;
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
    discreetMode = 'auto',
    tokenDecimals,
    maxDisplayedDecimals,
    isPhishingTransaction = false,
    formatStyle,
    ...rest
}: BaseTokenAmountFormatterProps) => {
    // Phishing transactions values may be equal to empty string, so we replace it with 0.
    // These values are hidden by discreet mode, so the exact value does not matter anyway.
    const decimalValue = isPhishingTransaction || !value ? '0' : value.toString();

    const { CryptoAmountFormatter } = useFormatters();
    const formattedValue = (
        <>
            <CryptoAmountFormatter
                value={decimalValue}
                // Token values are already decimal; a ticker matching a network must not change units.
                smallestUnitsOverride={false}
                withSymbol={false}
                maxDisplayedDecimals={maxDisplayedDecimals}
                formatStyle={formatStyle}
                tokenDecimals={tokenDecimals}
            />
            {tokenSymbol ? joinAmountWithSymbol('', tokenSymbol) : null}
        </>
    );

    return (
        <FormattedCryptoAmountText
            formattedValue={formattedValue}
            // Conceal phishing amounts in auto mode while honoring explicit mode overrides.
            discreetMode={
                discreetMode === 'auto' && isPhishingTransaction ? 'enforced' : discreetMode
            }
            {...rest}
        />
    );
};
