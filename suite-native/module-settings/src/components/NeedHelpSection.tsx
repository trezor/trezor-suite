import { useNavigation } from '@react-navigation/native';

import { CompactCardWithIconLayout, TitledSection } from '@suite-native/atoms';
import { Translation } from '@suite-native/intl';
import { SUITE_MOBILE_SUPPORT_URL, useOpenLink } from '@suite-native/link';
import {
    SettingsStackParamList,
    SettingsStackRoutes,
    StackNavigationProps,
} from '@suite-native/navigation';

type NavigationProps = StackNavigationProps<
    SettingsStackParamList,
    SettingsStackRoutes.SettingsAppLog
>;

export const NeedHelpSection = () => {
    const navigation = useNavigation<NavigationProps>();

    const openLink = useOpenLink();

    const openContactSupport = () => {
        openLink(SUITE_MOBILE_SUPPORT_URL);
    };

    const navigateToAppLogs = () => {
        navigation.navigate(SettingsStackRoutes.SettingsAppLog);
    };

    return (
        <TitledSection title={<Translation id="moduleSettings.faq.needHelp.label" />}>
            <CompactCardWithIconLayout
                title={<Translation id="moduleSettings.faq.needHelp.support" />}
                icon="lifebuoy"
                onPress={openContactSupport}
            />
            <CompactCardWithIconLayout
                title={<Translation id="moduleSettings.faq.needHelp.appLog" />}
                icon="fileTxt"
                onPress={navigateToAppLogs}
            />
        </TitledSection>
    );
};
