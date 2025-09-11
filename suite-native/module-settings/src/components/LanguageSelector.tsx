import { useDispatch, useSelector } from 'react-redux';

import { NATIVE_LANGUAGES } from '@suite-common/suite-types';
import { Select, SelectItemType } from '@suite-native/atoms';
import { FeatureFlag, useFeatureFlag } from '@suite-native/feature-flags';
import { LanguageOption, Translation, selectLanguage, setLanguage } from '@suite-native/intl';

import { PreferencesSettingsCard } from './PreferencesSettingsCard';

const languageItems = Object.entries(NATIVE_LANGUAGES).map(
    ([localeCode, language]) =>
        ({
            value: localeCode,
            label: language.name,
        }) as SelectItemType<LanguageOption>,
);

languageItems.unshift({
    value: 'system',
    label: 'System',
});

export const LanguageSelector = () => {
    const dispatch = useDispatch();
    const language = useSelector(selectLanguage);
    const isLocalizationEnabled = useFeatureFlag(FeatureFlag.IsLocalizationEnabled);

    const handleSelectLanguage = (localeCode: LanguageOption) => {
        dispatch(setLanguage(localeCode));
    };

    if (!isLocalizationEnabled) {
        return null;
    }

    return (
        <PreferencesSettingsCard
            iconName="translate"
            title={<Translation id="moduleSettings.preferences.languageLabel" />}
        >
            <Select
                selectValue={language}
                selectLabel={<Translation id="moduleSettings.preferences.languageLabel" />}
                items={languageItems}
                onSelectItem={handleSelectLanguage}
                testID="@settings/localization/bitcoin-units-selector"
            />
        </PreferencesSettingsCard>
    );
};
