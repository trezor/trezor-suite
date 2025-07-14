import { TitledSection } from '@suite-native/atoms';
import { Translation } from '@suite-native/intl';
import { SettingsStackRoutes } from '@suite-native/navigation';

import { AppSettingsCardWithIconLayout } from './AppSettingsCardWithIconLayout';
import { useSettingsNavigateTo } from '../navigation/useSettingsNavigateTo';

export const GeneralSettings = () => {
    const navigateTo = useSettingsNavigateTo();

    return (
        <TitledSection title={<Translation id="moduleSettings.items.general.title" />}>
            <AppSettingsCardWithIconLayout
                title={<Translation id="moduleSettings.items.general.preferences.title" />}
                subtitle={<Translation id="moduleSettings.items.general.preferences.subtitle" />}
                onPress={() => navigateTo(SettingsStackRoutes.SettingsPreferences)}
                icon="slidersHorizontal"
                testID="@settings/preferences"
            />
            <AppSettingsCardWithIconLayout
                title={<Translation id="moduleSettings.items.general.privacy.title" />}
                subtitle={<Translation id="moduleSettings.items.general.privacy.subtitle" />}
                icon="lock"
                testID="@settings/privacy"
                onPress={() => navigateTo(SettingsStackRoutes.SettingsPrivacy)}
            />
            <AppSettingsCardWithIconLayout
                title="Support"
                subtitle="Troubleshooting, help"
                onPress={() => navigateTo(SettingsStackRoutes.SettingsSupport)}
                icon="lifebuoy"
            />
        </TitledSection>
    );
};
