import { useSelector } from 'react-redux';
import { useMemo } from 'react';

import { getCalendars } from 'expo-localization';

import { FormatterProviderConfig } from '@suite-common/formatters';
import { selectFiatCurrency, selectBitcoinUnits } from '@suite-native/settings';

const is24HourFormat = getCalendars()[0].uses24hourClock ?? true;

export const useFormattersConfig = (): FormatterProviderConfig => {
    const fiatCurrency = useSelector(selectFiatCurrency);
    const bitcoinAmountUnit = useSelector(selectBitcoinUnits);

    return useMemo(
        () => ({
            locale: 'en',
            fiatCurrency: fiatCurrency.label,
            bitcoinAmountUnit,
            is24HourFormat,
        }),
        [fiatCurrency.label, bitcoinAmountUnit],
    );
};
