import React from 'react';

import { useFormatters } from '@suite-common/formatters';
import { NetworkSymbol } from '@suite-common/wallet-config';
import { AmountUnit, getAccountDecimals } from '@suite-common/wallet-utils';
import { Box, Text } from '@suite-native/atoms';

import { FormatterProps } from '../types';
import { AmountText } from './AmountText';
import { EmptyAmountText } from './EmptyAmountText';
import { formatNumberWithThousandCommas, parseBalanceAmount } from '../utils';

type BalanceFormatterProps = FormatterProps<AmountUnit | null> & {
    symbol: NetworkSymbol;
    isForcedDiscreetMode?: boolean;
    testID?: string;
    isBalance?: boolean;
};

export const CryptoAmountLargeFormatter = ({
    value,
    symbol,
    isBalance = true,
    isForcedDiscreetMode,
    testID,
}: BalanceFormatterProps) => {
    const { CryptoAmountFormatter: formatter } = useFormatters();

    if (!value) return <EmptyAmountText />;

    const maxDisplayedDecimals = getAccountDecimals(symbol);

    let formattedValue = formatter.format(value.toFixed(maxDisplayedDecimals), {
        isBalance,
        maxDisplayedDecimals,
        symbol,
        isEllipsisAppended: false,
    });

    // Todo: refactor this madness, it shall be handled by localisation!
    //       same for CryptoAmountFormatter

    // due to possible sat <-> btc conversion in previous formatter,
    // we need to format the number after the currency was added (e.g. '123903 sat')
    // split value and currency, format value with thousands' commas
    const splitValue = formattedValue.split(' ');
    if (splitValue.length > 1) {
        formattedValue = `${formatNumberWithThousandCommas(splitValue[0])} ${splitValue.slice(1).join(' ')}`;
    } else if (splitValue.length > 0) {
        formattedValue = formatNumberWithThousandCommas(splitValue[0]);
    }

    if (!formattedValue) return <EmptyAmountText />;

    const { currencySymbol, wholeNumber, decimalNumber } = parseBalanceAmount(formattedValue);

    const valueElement = (
        <>
            <AmountText
                value={wholeNumber}
                variant="titleSmall" // Crypto doesn't look good with bigger leading zero
                isDiscreetText
                isForcedDiscreetMode={isForcedDiscreetMode}
            />
            <AmountText
                value={decimalNumber}
                variant="titleSmall"
                isDiscreetText
                isForcedDiscreetMode={isForcedDiscreetMode}
            />
        </>
    );

    const currencyElement = <Text variant="titleSmall">{currencySymbol}</Text>;

    return (
        <Box flexDirection="row" alignItems="flex-end" flexShrink={1} testID={testID}>
            {valueElement}
            {currencyElement}
        </Box>
    );
};
