import { useSelector } from 'react-redux';
import { useMemo } from 'react';

import { getCalendars } from 'expo-localization';

import { FormatterProviderConfig } from '@suite-common/formatters';
import { selectBitcoinUnits, selectFiatCurrencyCode } from '@suite-native/settings';

const is24HourFormat = getCalendars()[0].uses24hourClock ?? true;

export const useFormattersConfig = (): FormatterProviderConfig => {
    const fiatCurrencyCode = useSelector(selectFiatCurrencyCode);
    const bitcoinAmountUnit = useSelector(selectBitcoinUnits);

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
