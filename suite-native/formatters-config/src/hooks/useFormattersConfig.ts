import { useMemo } from 'react';
import { useSelector } from 'react-redux';

import { getCalendars } from 'expo-localization';

import { type FormatterProviderConfig } from '@suite-common/formatters';
import { type NetworksRootState, selectNetworkDisplaySymbols } from '@suite-common/networks';
import { selectBaseCurrency, selectBitcoinAmountUnit } from '@suite-common/wallet-core';
import { selectLocale } from '@suite-native/intl';

const is24HourFormat = getCalendars()[0].uses24hourClock ?? true;

export const useFormattersConfig = (): FormatterProviderConfig => {
    const baseCurrencyCode = useSelector(selectBaseCurrency);
    const bitcoinAmountUnit = useSelector(selectBitcoinAmountUnit);
    const locale = useSelector(selectLocale);
    const networkDisplaySymbols = useSelector((state: NetworksRootState) =>
        selectNetworkDisplaySymbols(state),
    );

    return useMemo(
        () => ({
            locale,
            bitcoinAmountUnit,
            is24HourFormat,
            baseCurrency: baseCurrencyCode,
            networkDisplaySymbols,
        }),
        [baseCurrencyCode, bitcoinAmountUnit, locale, networkDisplaySymbols],
    );
};
