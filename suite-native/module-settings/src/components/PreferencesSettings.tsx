import { useNavigation } from '@react-navigation/core';

import {
    SettingsStackRoutes,
    SettingsStackParamList,
    StackToStackCompositeNavigationProps,
    RootStackParamList,
} from '@suite-native/navigation';
import { Translation } from '@suite-native/intl';

import { SettingsSection } from './SettingsSection';
import { SettingsSectionItem } from './SettingsSectionItem';

export const PreferencesSettings = () => {
    const navigation =
        useNavigation<
            StackToStackCompositeNavigationProps<
                SettingsStackParamList,
                SettingsStackRoutes.Settings,
                RootStackParamList
            >
        >();

    const handleNavigation = (routeName: SettingsStackRoutes): void => {
        navigation.navigate(routeName);
    };

    return (
        <SettingsSection title={<Translation id="moduleSettings.items.preferences.title" />}>
            <SettingsSectionItem
                iconName="flag"
                title={<Translation id="moduleSettings.items.preferences.localization.title" />}
                subtitle={
                    <Translation id="moduleSettings.items.preferences.localization.subtitle" />
                }
                onPress={() => handleNavigation(SettingsStackRoutes.SettingsLocalization)}
                testID="@settings/localization"
            />
            <SettingsSectionItem
                iconName="palette"
                title={<Translation id="moduleSettings.items.preferences.customization.title" />}
                subtitle={
                    <Translation id="moduleSettings.items.preferences.customization.subtitle" />
                }
                onPress={() => handleNavigation(SettingsStackRoutes.SettingsCustomization)}
                testID="@settings/customization"
            />
        </SettingsSection>
    );
};
