import { useSelector } from 'react-redux';

import { getFormattedCurrencySymbol } from '@suite-common/formatters';
import { selectBaseCurrency, selectIsBaseCurrencyInSats } from '@suite-common/wallet-core';
import { getDecimalsForBaseCurrency } from '@suite-common/wallet-utils';
import { selectLocale } from '@suite-native/intl';

export const useBaseCurrencyAmountPlaceholder = () => {
    const locale = useSelector(selectLocale);
    const baseCurrency = useSelector(selectBaseCurrency);
    const isBaseCurrencyInSats = useSelector(selectIsBaseCurrencyInSats);

    const baseCurrencyLabel = getFormattedCurrencySymbol({
        locale,
        currency: baseCurrency,
        isSatsValue: isBaseCurrencyInSats,
    });
    const baseCurrencyDecimals = getDecimalsForBaseCurrency({
        code: baseCurrency,
        isInSats: isBaseCurrencyInSats,
    });

    return {
        baseCurrencyLabel,
        baseCurrencyDecimals,
        placeholder: baseCurrencyDecimals > 0 ? '0.0' : '0',
    };
};
