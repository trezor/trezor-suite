import { useSelector } from 'react-redux';
import { useMemo } from 'react';

import { FormatterProviderConfig } from '@suite-common/formatters';
import { PROTO } from '@trezor/connect';
import { selectFiatCurrency } from '@suite-native/module-settings';

export const useFormattersConfig = (): FormatterProviderConfig => {
    const fiatCurrency = useSelector(selectFiatCurrency);

    return useMemo(
        () => ({
            locale: 'en',
            fiatCurrency: fiatCurrency.label,
            bitcoinAmountUnit: PROTO.AmountUnit.BITCOIN,
        }),
        [fiatCurrency],
    );
};
