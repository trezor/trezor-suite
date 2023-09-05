import { TextProps } from '@suite-native/atoms';
import { TokenSymbol } from '@suite-common/wallet-types';
import { localizeNumber } from '@suite-common/wallet-utils';

import { FormatterProps } from '../types';
import { AmountText } from './AmountText';
import { convertTokenValueToDecimal } from '../utils';

type EthereumTokenAmountFormatterProps = {
    symbol: TokenSymbol | null;
    isDiscreetText?: boolean;
    decimals?: number;
} & FormatterProps<number | string> &
    TextProps;

export const EthereumTokenAmountFormatter = ({
    value,
    symbol,
    isDiscreetText = true,
    decimals = 0,
    variant = 'hint',
    color = 'textSubdued',
    ...rest
}: EthereumTokenAmountFormatterProps) => {
    const decimalValue = convertTokenValueToDecimal(value, decimals);

    const formattedValue = `${localizeNumber(decimalValue)} ${symbol}`;

    return (
        <AmountText
            value={formattedValue}
            isDiscreetText={isDiscreetText}
            variant={variant}
            color={color}
            {...rest}
        />
    );
};
