import { PressableCardWithIconLayout } from '@suite-native/atoms';
import { Translation } from '@suite-native/intl';
import { SettingsStackRoutes } from '@suite-native/navigation';

import { useSettingsNavigateTo } from '../navigation/useSettingsNavigateTo';

export const BitcoinBackendsCard = () => {
    const navigateTo = useSettingsNavigateTo();

    return (
        <PressableCardWithIconLayout
            icon="database"
            title={<Translation id="moduleSettings.advanced.bitcoinBackends.title" />}
            description={<Translation id="moduleSettings.advanced.bitcoinBackends.subtitle" />}
            onPress={() => navigateTo(SettingsStackRoutes.BitcoinBackends)}
        />
    );
};
