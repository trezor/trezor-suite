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

    let formattedValue = formatter.format(stringValue, {
        isBalance,
        maxDisplayedDecimals,
        symbol: network,
        isEllipsisAppended: false,
    });

    // due to possible sat <-> btc conversion in previous formatter
    // we need to format the number after the currency was added (e.g. '123903 sat')
    // split value and currency, format value with thousands commas
    const splitValue = formattedValue.split(' ');
    if (splitValue.length > 1) {
        formattedValue = `${formatNumberWithThousandCommas(splitValue[0])} ${splitValue[1]}`;
    } else if (splitValue.length > 0) {
        formattedValue = formatNumberWithThousandCommas(splitValue[0]);
    }

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
