import { useSelector } from 'react-redux';

import { useServices } from '@suite-common/dependency-injection';
import { selectDispatch } from '@suite-common/redux-utils';
import { Select, type SelectItemType } from '@suite-native/atoms';
import {
    type AppLocaleOption,
    LANGUAGES,
    Translation,
    selectAppLocaleCode,
    setAppLocaleCode,
} from '@suite-native/intl';

import { PreferencesSettingsCard } from './PreferencesSettingsCard';

const languageItems = Object.entries(LANGUAGES).map(
    ([localeCode, language]) =>
        ({
            value: localeCode,
            label: language.name,
        }) as SelectItemType<AppLocaleOption>,
);

languageItems.unshift({
    value: 'system',
    label: 'System',
});

export const LanguageSelector = () => {
    const { dispatch } = useServices(selectDispatch);
    const userSelectedLocaleCode = useSelector(selectAppLocaleCode);

    const handleSelectLanguage = (localeCode: AppLocaleOption) => {
        dispatch(setAppLocaleCode(localeCode));
    };

    return (
        <PreferencesSettingsCard
            iconName="translate"
            title={<Translation id="moduleSettings.preferences.languageLabel" />}
        >
            <Select
                value={userSelectedLocaleCode}
                title={<Translation id="moduleSettings.preferences.languageLabel" />}
                items={languageItems}
                onSelectItem={handleSelectLanguage}
                testID="@settings/localization/language-selector"
            />
        </PreferencesSettingsCard>
    );
};
