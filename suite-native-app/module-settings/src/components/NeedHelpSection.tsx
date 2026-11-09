import { useNavigation } from '@react-navigation/native';

import { CompactCardWithIconLayout, TitledSection } from '@suite-native/atoms';
import { Translation } from '@suite-native/intl';
import {
    type SettingsStackParamList,
    SettingsStackRoutes,
    type StackNavigationProps,
} from '@suite-native/navigation';

import { useContactSupportAlert } from './useContactSupportAlert';

type NavigationProps = StackNavigationProps<
    SettingsStackParamList,
    SettingsStackRoutes.SettingsAppLog
>;

export const NeedHelpSection = () => {
    const navigation = useNavigation<NavigationProps>();
    const { showContactSupportAlert } = useContactSupportAlert();

    const navigateToAppLogs = () => {
        navigation.navigate(SettingsStackRoutes.SettingsAppLog);
    };

    return (
        <TitledSection title={<Translation id="moduleSettings.faq.needHelp.label" />}>
            <CompactCardWithIconLayout
                title={<Translation id="moduleSettings.faq.needHelp.support" />}
                icon="lifebuoy"
                onPress={showContactSupportAlert}
            />
            <CompactCardWithIconLayout
                title={<Translation id="moduleSettings.faq.needHelp.appLog" />}
                icon="fileTxt"
                onPress={navigateToAppLogs}
            />
        </TitledSection>
    );
};
