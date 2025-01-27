import { TrezorSuiteLiteHeader } from '@suite-native/atoms';
import { Translation } from '@suite-native/intl';
import { SettingsStackRoutes } from '@suite-native/navigation';

import { SettingsSection } from './SettingsSection';
import { SettingsSectionItem } from './SettingsSectionItem';
import { useSettingsNavigateTo } from '../navigation/useSettingsNavigateTo';

export const SupportSettings = () => {
    const navigateTo = useSettingsNavigateTo();

    return (
        <SettingsSection title="Support">
            <SettingsSectionItem
                iconName="question"
                title={<Translation id="moduleSettings.items.support.help.title" />}
                subtitle={<Translation id="moduleSettings.items.support.help.subtitle" />}
                onPress={() => navigateTo(SettingsStackRoutes.SettingsFAQ)}
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
                onPress={() => navigateTo(SettingsStackRoutes.SettingsAbout)}
                testID="@settings/about"
            />
        </SettingsSection>
    );
};
