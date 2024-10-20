import { useNavigation } from '@react-navigation/core';

import {
    RootStackParamList,
    SettingsStackParamList,
    SettingsStackRoutes,
    StackToStackCompositeNavigationProps,
} from '@suite-native/navigation';
import { TrezorSuiteLiteHeader } from '@suite-native/atoms';
import { Translation } from '@suite-native/intl';

import { SettingsSection } from './SettingsSection';
import { SettingsSectionItem } from './SettingsSectionItem';

export const SupportSettings = () => {
    const navigation =
        useNavigation<
            StackToStackCompositeNavigationProps<
                SettingsStackParamList,
                SettingsStackRoutes,
                RootStackParamList
            >
        >();

    return (
        <SettingsSection title="Support">
            <SettingsSectionItem
                iconName="question"
                title={<Translation id="moduleSettings.items.support.help.title" />}
                subtitle={<Translation id="moduleSettings.items.support.help.subtitle" />}
                onPress={() => navigation.navigate(SettingsStackRoutes.SettingsFAQ)}
                testID="@settings/help"
            />
            <SettingsSectionItem
                title={
                    <>
                        <Translation id="moduleSettings.items.support.about.title" />
                        <TrezorSuiteLiteHeader textVariant="body" />
                    </>
                }
                iconName="trezorSafe5"
                onPress={() => navigation.navigate(SettingsStackRoutes.SettingsAbout)}
                testID="@settings/about"
            />
        </SettingsSection>
    );
};
