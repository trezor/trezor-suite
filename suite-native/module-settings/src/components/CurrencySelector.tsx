import { useDispatch, useSelector } from 'react-redux';

import { Select } from '@suite-native/atoms';
import { FiatCurrency, fiatCurrencies, FiatCurrencyCode } from '@suite-common/suite-config';
import { analytics, EventType } from '@suite-native/analytics';
import { selectFiatCurrency, setFiatCurrency } from '@suite-native/settings';

export const transformFiatCurrencyToSelectItem = (fiatCurrency: FiatCurrency) => ({
    label: fiatCurrency.value,
    value: fiatCurrency.label,
});

const fiatCurrencyItems = Object.values(fiatCurrencies).map(transformFiatCurrencyToSelectItem);

export const CurrencySelector = () => {
    const selectedFiatCurrency = useSelector(selectFiatCurrency);
    const dispatch = useDispatch();

    const handleSelectCurrency = (localCurrency: FiatCurrencyCode) => {
        dispatch(setFiatCurrency({ localCurrency }));
        analytics.report({
            type: EventType.SettingsChangeCurrency,
            payload: { localCurrency },
        });
    };

    return (
        <Select<FiatCurrencyCode>
            items={fiatCurrencyItems}
            selectLabel="Currency"
            selectValue={selectedFiatCurrency.label}
            valueLabel={selectedFiatCurrency.label.toUpperCase()}
            onSelectItem={handleSelectCurrency}
        />
    );
};
