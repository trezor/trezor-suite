import { useDispatch, useSelector } from 'react-redux';

import { Select } from '@suite-native/atoms';
import { FiatCurrency, fiatCurrencies, FiatCurrencyCode } from '@suite-common/suite-config';
import { analytics, EventType } from '@suite-native/analytics';
import { Translation } from '@suite-native/intl';
import { selectFiatCurrencyCode, setFiatCurrency } from '@suite-native/settings';

export const transformFiatCurrencyToSelectItem = ({ code, label }: FiatCurrency) => ({
    value: code,
    label: `${code.toUpperCase()} · ${label}`,
});

const fiatCurrencyItems = Object.values(fiatCurrencies).map(transformFiatCurrencyToSelectItem);

export const CurrencySelector = () => {
    const selectedFiatCurrencyCode = useSelector(selectFiatCurrencyCode);
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
            selectLabel={<Translation id="moduleSettings.localizations.fiatCurrencyLabel" />}
            selectValue={selectedFiatCurrencyCode}
            onSelectItem={handleSelectCurrency}
        />
    );
};
