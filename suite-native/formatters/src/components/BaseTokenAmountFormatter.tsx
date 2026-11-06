import {
    type CryptoAmountFormatterFormatStyle,
    joinAmountWithSymbol,
    useFormatters,
} from '@suite-common/formatters';
import { type SignValue } from '@suite-common/suite-types';
import { type TokenSymbol } from '@suite-common/tokens';
import { type TextProps } from '@suite-native/atoms';

import { type DiscreetMode, type FormatterProps } from '../types';
import { type DecimalTokenAmount } from '../utils';
import { FormattedCryptoAmountText } from './FormattedCryptoAmountText';

export type TokenAmountFormatterCommonProps = {
    tokenSymbol: TokenSymbol | null;
    discreetMode?: DiscreetMode;
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
    formatStyle,
    ...rest
}: BaseTokenAmountFormatterProps) => {
    const decimalValue = value ? value.toString() : '0';

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
            discreetMode={discreetMode}
            {...rest}
        />
    );
};
