import { Translation } from '@suite-native/intl';
import { SettingsStackRoutes } from '@suite-native/navigation';

import { AppSettingsCardWithIconLayout } from './AppSettingsCardWithIconLayout';
import { useSettingsNavigateTo } from '../navigation/useSettingsNavigateTo';

export const BitcoinBackendsCard = () => {
    const navigateTo = useSettingsNavigateTo();

    return (
        <AppSettingsCardWithIconLayout
            icon="database"
            title={<Translation id="moduleSettings.advanced.bitcoinBackends.title" />}
            subtitle={<Translation id="moduleSettings.advanced.bitcoinBackends.subtitle" />}
            onPress={() => navigateTo(SettingsStackRoutes.BitcoinBackends)}
        />
    );
};
