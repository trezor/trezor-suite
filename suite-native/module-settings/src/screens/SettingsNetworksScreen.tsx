import { CoinEnablingForm } from '@suite-native/coin-enabling';
import { Translation } from '@suite-native/intl';
import { DynamicScreenHeader, Screen } from '@suite-native/navigation';

export const SettingsNetworksScreen = () => (
    <Screen
        header={
            <DynamicScreenHeader
                title={<Translation id="moduleSettings.networks.title" />}
                subtitle={<Translation id="moduleSettings.networks.subtitle" />}
            />
        }
    >
        <CoinEnablingForm />
    </Screen>
);
