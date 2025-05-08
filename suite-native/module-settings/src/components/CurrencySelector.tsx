import { useDispatch, useSelector } from 'react-redux';

import { FiatCurrency, FiatCurrencyCode, fiatCurrencies } from '@suite-common/suite-config';
import { selectLocalCurrency, setLocalCurrency } from '@suite-common/wallet-core';
import { EventType, analytics } from '@suite-native/analytics';
import { Select } from '@suite-native/atoms';
import { Translation } from '@suite-native/intl';

export const transformFiatCurrencyToSelectItem = ({ code, label }: FiatCurrency) => ({
    value: code,
    label: `${code.toUpperCase()} · ${label}`,
});

const fiatCurrencyItems = Object.values(fiatCurrencies).map(transformFiatCurrencyToSelectItem);

export const CurrencySelector = () => {
    const selectedFiatCurrencyCode = useSelector(selectLocalCurrency);
    const dispatch = useDispatch();

    const handleSelectCurrency = (localCurrency: FiatCurrencyCode) => {
        dispatch(setLocalCurrency(localCurrency));
        analytics.report({
            type: EventType.SettingsChangeCurrency,
            payload: { localCurrency },
        });
    };

    return (
        <Select<FiatCurrencyCode>
            items={fiatCurrencyItems}
            selectLabel={<Translation id="moduleSettings.localizations.fiatCurrencyLabel" />}
            selectValue={selectedFiatCurrencyCode}
            onSelectItem={handleSelectCurrency}
            testID="@settings/localization/currency-selector"
        />
    );
};
