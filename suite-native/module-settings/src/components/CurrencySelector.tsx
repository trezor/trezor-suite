import { useDispatch, useSelector } from 'react-redux';

import { selectBaseCurrency, setBaseCurrency } from '@suite-common/wallet-core';
import { events } from '@suite-native/analytics';
import { Select } from '@suite-native/atoms';
import { Translation } from '@suite-native/intl';
import { useAnalytics } from '@suite-native/services';
import {
    type BaseCurrency,
    type BaseCurrencyCode,
    baseCurrencies,
} from '@trezor/blockchain-link-types';
import { typedObjectValues } from '@trezor/utils';

import { PreferencesSettingsCard } from './PreferencesSettingsCard';

export const transformFiatCurrencyToSelectItem = ({ code, label }: BaseCurrency) => ({
    value: code,
    label: `${code.toUpperCase()} · ${label}`,
});

const fiatCurrencyItems = typedObjectValues(baseCurrencies).map(transformFiatCurrencyToSelectItem);

export const CurrencySelector = () => {
    const selectedFiatCurrencyCode = useSelector(selectBaseCurrency);
    const dispatch = useDispatch();
    const analytics = useAnalytics();
    const handleSelectCurrency = (baseCurrencyCode: BaseCurrencyCode) => {
        dispatch(setBaseCurrency(baseCurrencyCode));
        analytics.report({
            type: events.settingsChangeCurrencyEvent.name,
            payload: { localCurrency: baseCurrencyCode },
        });
    };

    return (
        <PreferencesSettingsCard
            iconName="coins"
            title={<Translation id="moduleSettings.preferences.fiatCurrencyLabel" />}
        >
            <Select<BaseCurrencyCode>
                items={fiatCurrencyItems}
                value={selectedFiatCurrencyCode}
                onSelectItem={handleSelectCurrency}
                title={<Translation id="moduleSettings.preferences.fiatCurrencyLabel" />}
                testID="@settings/localization/currency-selector"
            />
        </PreferencesSettingsCard>
    );
};
