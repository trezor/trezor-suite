import { G } from '@mobily/ts-belt';

import { TextProps } from '@suite-native/atoms';
import { useFormatters } from '@suite-common/formatters';
import { networks, NetworkSymbol } from '@suite-common/wallet-config';

import { FormatterProps } from '../types';
import { EmptyAmountText } from './EmptyAmountText';
import { AmountText } from './AmountText';
import { formatNumberWithThousandCommas } from '../utils';

type CryptoToFiatAmountFormatterProps = FormatterProps<string | null | number> &
    TextProps & {
        network: NetworkSymbol;
        isBalance?: boolean;
        isDiscreetText?: boolean;
        decimals?: number;
    };

export const CryptoAmountFormatter = ({
    value,
    network,
    isBalance = true,
    isDiscreetText = true,
    variant = 'hint',
    color = 'textSubdued',
    decimals,
    ...textProps
}: CryptoToFiatAmountFormatterProps) => {
    const { CryptoAmountFormatter: formatter } = useFormatters();

    if (G.isNullable(value)) return <EmptyAmountText />;

    const maxDisplayedDecimals = decimals ?? networks[network].decimals;

    const stringValue = G.isNumber(value) ? value.toString() : value;

    const localizedValue = formatNumberWithThousandCommas(stringValue);

    const formattedValue = formatter.format(localizedValue, {
        isBalance,
        maxDisplayedDecimals,
        symbol: network,
        isEllipsisAppended: false,
    });

    return (
        <AmountText
            value={formattedValue}
            isDiscreetText={isDiscreetText}
            variant={variant}
            color={color}
            {...textProps}
        />
    );
};
