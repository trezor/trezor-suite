import { useMemo } from 'react';

import { selectLanguage } from '@suite/settings';
import { type FormatterProviderConfig } from '@suite-common/formatters';
import { selectBaseCurrency, selectBitcoinAmountUnit } from '@suite-common/wallet-core';

import { useSelector } from 'src/hooks/suite';

export const useFormattersConfig = (): FormatterProviderConfig => {
    const locale = useSelector(selectLanguage);
    const bitcoinAmountUnit = useSelector(selectBitcoinAmountUnit);
    const baseCurrency = useSelector(selectBaseCurrency);

    return useMemo(
        () => ({
            locale,
            baseCurrency,
            bitcoinAmountUnit,
            is24HourFormat: true,
        }),
        [locale, baseCurrency, bitcoinAmountUnit],
    );
};
