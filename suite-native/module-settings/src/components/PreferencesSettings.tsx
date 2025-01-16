import { Translation } from '@suite-native/intl';
import { SettingsStackRoutes } from '@suite-native/navigation';
import { SettingsSection, SettingsSectionItem } from '@suite-native/settings';

import { useSettingsNavigateTo } from '../navigation/useSettingsNavigateTo';

export const PreferencesSettings = () => {
    const navigateTo = useSettingsNavigateTo();

    return (
        <SettingsSection title={<Translation id="moduleSettings.items.preferences.title" />}>
            <SettingsSectionItem
                iconName="flag"
                title={<Translation id="moduleSettings.items.preferences.localization.title" />}
                subtitle={
                    <Translation id="moduleSettings.items.preferences.localization.subtitle" />
                }
                onPress={() => navigateTo(SettingsStackRoutes.SettingsLocalization)}
                testID="@settings/localization"
            />
            <SettingsSectionItem
                iconName="palette"
                title={<Translation id="moduleSettings.items.preferences.customization.title" />}
                subtitle={
                    <Translation id="moduleSettings.items.preferences.customization.subtitle" />
                }
                onPress={() => navigateTo(SettingsStackRoutes.SettingsCustomization)}
                testID="@settings/customization"
            />
        </SettingsSection>
    );
};
