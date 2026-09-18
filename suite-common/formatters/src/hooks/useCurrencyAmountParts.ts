import { useSelector } from 'react-redux';

import { selectBaseCurrency, selectIsBaseCurrencyInSats } from '@suite-common/wallet-core';

import { type CurrencyAmountParts, getCurrencyAmountParts } from '../utils/currencyAmountParts';

type UseCurrencyAmountPartsParams = {
    value?: string;
    locale: string;
};

/**
 * The locale is a parameter because each platform keeps it in its own slice: native's
 * `selectLocale` resolves the system one, the desktop app's `selectLanguage` reads suite settings.
 */
export const useCurrencyAmountParts = ({
    value = '0',
    locale,
}: UseCurrencyAmountPartsParams): CurrencyAmountParts => {
    const currency = useSelector(selectBaseCurrency);
    const isBaseCurrencyInSats = useSelector(selectIsBaseCurrencyInSats);

    return getCurrencyAmountParts({
        value,
        locale,
        currency,
        isSatsValue: isBaseCurrencyInSats && currency === 'btc',
    });
};
