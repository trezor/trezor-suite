import { useDispatch, useSelector } from 'react-redux';

import { Select, SelectItemType } from '@suite-native/atoms';
import {
    LANGUAGES,
    LocaleTag,
    Translation,
    selectUserSelectedLocaleTag,
    setLocale,
} from '@suite-native/intl';

import { PreferencesSettingsCard } from './PreferencesSettingsCard';

const languageItems = Object.entries(LANGUAGES).map(
    ([localeCode, language]) =>
        ({
            value: localeCode,
            label: language.name,
        }) as SelectItemType<LocaleTag>,
);

languageItems.unshift({
    value: 'system',
    label: 'System',
});

export const LanguageSelector = () => {
    const dispatch = useDispatch();
    const userSelectedLocaleTag = useSelector(selectUserSelectedLocaleTag);

    const handleSelectLanguage = (localeCode: LocaleTag) => {
        dispatch(setLocale(localeCode));
    };

    return (
        <PreferencesSettingsCard
            iconName="translate"
            title={<Translation id="moduleSettings.preferences.languageLabel" />}
        >
            <Select
                selectValue={userSelectedLocaleTag}
                selectLabel={<Translation id="moduleSettings.preferences.languageLabel" />}
                items={languageItems}
                onSelectItem={handleSelectLanguage}
                testID="@settings/localization/bitcoin-units-selector"
            />
        </PreferencesSettingsCard>
    );
};
