import { useSelector } from 'react-redux';
import { useMemo } from 'react';

import { getCalendars } from 'expo-localization';

import { FormatterProviderConfig } from '@suite-common/formatters';
import { PROTO } from '@trezor/connect';
import { selectFiatCurrency, selectIsSatsEnabled } from '@suite-native/module-settings';

const is24HourFormat = getCalendars()[0].uses24hourClock ?? true;

export const useFormattersConfig = (): FormatterProviderConfig => {
    const fiatCurrency = useSelector(selectFiatCurrency);
    const isSatsEnabled = useSelector(selectIsSatsEnabled);

    return useMemo(
        () => ({
            locale: 'en',
            fiatCurrency: fiatCurrency.label,
            bitcoinAmountUnit: isSatsEnabled ? PROTO.AmountUnit.SATOSHI : PROTO.AmountUnit.BITCOIN,
            is24HourFormat,
        }),
        [fiatCurrency.label, isSatsEnabled],
    );
};
