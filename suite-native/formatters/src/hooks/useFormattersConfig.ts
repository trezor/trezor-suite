import { useMemo } from 'react';
import { useSelector } from 'react-redux';

import { getCalendars } from 'expo-localization';

import { FormatterProviderConfig } from '@suite-common/formatters';
import { selectBaseCurrency, selectBitcoinAmountUnit } from '@suite-common/wallet-core';

const is24HourFormat = getCalendars()[0].uses24hourClock ?? true;

export const useFormattersConfig = (): FormatterProviderConfig => {
    const baseCurrencyCode = useSelector(selectBaseCurrency);
    const bitcoinAmountUnit = useSelector(selectBitcoinAmountUnit);

    return useMemo(
        () => ({
            locale: 'en',
            baseCurrency: baseCurrencyCode,
            bitcoinAmountUnit,
            is24HourFormat,
        }),
        [baseCurrencyCode, bitcoinAmountUnit],
    );
};
