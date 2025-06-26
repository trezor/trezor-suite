import { Translation } from '@suite-native/intl';
import { SettingsStackRoutes } from '@suite-native/navigation';

import { AppSettingsCardWithIconLayout } from './AppSettingsCardWithIconLayout';
import { SettingsSection } from './SettingsSection';
import { useSettingsNavigateTo } from '../navigation/useSettingsNavigateTo';

export const PreferencesSettings = () => {
    const navigateTo = useSettingsNavigateTo();

    return (
        <SettingsSection title={<Translation id="moduleSettings.items.general.title" />}>
            <AppSettingsCardWithIconLayout
                title={<Translation id="moduleSettings.items.general.preferences.title" />}
                subtitle={<Translation id="moduleSettings.items.general.preferences.subtitle" />}
                onPress={() => navigateTo(SettingsStackRoutes.SettingsPreferences)}
                icon="flag"
                testID="@settings/preferences"
            />
            <AppSettingsCardWithIconLayout
                title={<Translation id="moduleSettings.items.general.privacy.title" />}
                subtitle={<Translation id="moduleSettings.items.general.privacy.subtitle" />}
                icon="flag"
                onPress={() => navigateTo(SettingsStackRoutes.SettingsPrivacyAndSecurity)}
            />
            <AppSettingsCardWithIconLayout
                title="Support"
                subtitle="Troubleshooting, help"
                onPress={() => navigateTo(SettingsStackRoutes.SettingsFAQ)}
                icon="flag"
            />
        </SettingsSection>
    );
};
