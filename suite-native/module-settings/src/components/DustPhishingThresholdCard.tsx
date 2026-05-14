import { PressableCardWithIconLayout } from '@suite-native/atoms';
import { Translation } from '@suite-native/intl';
import { SettingsStackRoutes } from '@suite-native/navigation';

import { useSettingsNavigateTo } from '../navigation/useSettingsNavigateTo';

export const DustPhishingThresholdCard = () => {
    const navigateTo = useSettingsNavigateTo();

    return (
        <PressableCardWithIconLayout
            icon="detective"
            title={<Translation id="moduleSettings.advanced.dustPhishing.title" />}
            description={<Translation id="moduleSettings.advanced.dustPhishing.subtitle" />}
            onPress={() => navigateTo(SettingsStackRoutes.SettingsDustPhishing)}
        />
    );
};
