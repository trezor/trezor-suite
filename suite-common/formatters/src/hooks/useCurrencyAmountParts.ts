import { useSelector } from 'react-redux';

import { DISCREET_PLACEHOLDER, useShouldRedactNumbers } from '@suite-common/discreet-mode';
import { selectBaseCurrency, selectIsBaseCurrencyInSats } from '@suite-common/wallet-core';

import { type CurrencyAmountParts, getCurrencyAmountParts } from '../utils/currencyAmountParts';

type UseCurrencyAmountPartsParams = {
    value?: string;
    locale: string;
    isExact?: boolean;
};

/**
 * The locale is a parameter because each platform keeps it in its own slice: native's
 * `selectLocale` resolves the system one, the desktop app's `selectLanguage` reads suite settings.
 */
export const useCurrencyAmountParts = ({
    value = '0',
    locale,
    isExact,
}: UseCurrencyAmountPartsParams): CurrencyAmountParts => {
    const currency = useSelector(selectBaseCurrency);
    const isBaseCurrencyInSats = useSelector(selectIsBaseCurrencyInSats);
    const shouldRedactNumbers = useShouldRedactNumbers({ strict: false });

    const parts = getCurrencyAmountParts({
        value,
        locale,
        currency,
        isSatsValue: isBaseCurrencyInSats && currency === 'btc',
        isExact,
    });

    return shouldRedactNumbers
        ? { ...parts, wholeNumber: DISCREET_PLACEHOLDER, decimalNumber: '' }
        : parts;
};
