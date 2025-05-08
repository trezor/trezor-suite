import { useMemo } from 'react';
import { useSelector } from 'react-redux';

import { getCalendars } from 'expo-localization';

import { FormatterProviderConfig } from '@suite-common/formatters';
import { selectBitcoinAmountUnit, selectLocalCurrency } from '@suite-common/wallet-core';

const is24HourFormat = getCalendars()[0].uses24hourClock ?? true;

export const useFormattersConfig = (): FormatterProviderConfig => {
    const fiatCurrencyCode = useSelector(selectLocalCurrency);
    const bitcoinAmountUnit = useSelector(selectBitcoinAmountUnit);

    return useMemo(
        () => ({
            locale: 'en',
            fiatCurrency: fiatCurrencyCode,
            bitcoinAmountUnit,
            is24HourFormat,
        }),
        [fiatCurrencyCode, bitcoinAmountUnit],
    );
};
