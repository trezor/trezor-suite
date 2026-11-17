import { useMemo } from 'react';

import { selectLanguage } from '@suite/settings';
import { type FormatterProviderConfig } from '@suite-common/formatters';
import { selectNetworkDisplaySymbols } from '@suite-common/networks';
import { selectBaseCurrency, selectBitcoinAmountUnit } from '@suite-common/wallet-core';

import { useSelector } from './useSelector';

export const useFormattersConfig = (): FormatterProviderConfig => {
    const locale = useSelector(selectLanguage);
    const bitcoinAmountUnit = useSelector(selectBitcoinAmountUnit);
    const baseCurrency = useSelector(selectBaseCurrency);
    const networkDisplaySymbols = useSelector(selectNetworkDisplaySymbols);

    return useMemo(
        () => ({
            locale,
            baseCurrency,
            bitcoinAmountUnit,
            is24HourFormat: true,
            networkDisplaySymbols,
        }),
        [locale, baseCurrency, bitcoinAmountUnit, networkDisplaySymbols],
    );
};
