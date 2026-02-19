import { useSelector } from 'react-redux';

import { selectIsMevProtectionSettingsVisible } from '@suite-common/mev';
import { VStack } from '@suite-native/atoms';
import { ExperimentalFeaturesSettingsCard } from '@suite-native/experimental-features';
import { Translation } from '@suite-native/intl';
import { DynamicScreenHeader, Screen } from '@suite-native/navigation';

import { BitcoinBackendsCard } from '../components/BitcoinBackendsCard';
import { TurnOffDeviceAuthenticityCheckCard } from '../components/TurnOffDeviceAuthenticityCheckCard';
import { TurnOffFirmwareAuthenticityCheckCard } from '../components/TurnOffFirmwareAuthenticityCheckCard';
import { TurnOffMevProtectionCard } from '../components/TurnOffMevProtectionCard';
import { TurnOffNetworkReserveCheckCard } from '../components/TurnOffNetworkReserveCheckCard';
import { selectIsBitcoinBackendsConfigVisible } from '../selectors';

export const SettingsAdvancedScreen = () => {
    const isMevProtectionSettingsVisible = useSelector(selectIsMevProtectionSettingsVisible);
    const isBitcoinBackendsConfigVisible = useSelector(selectIsBitcoinBackendsConfigVisible);

    return (
        <Screen
            header={
                <DynamicScreenHeader title={<Translation id="moduleSettings.advanced.title" />} />
            }
        >
            <VStack spacing="sp16">
                {isBitcoinBackendsConfigVisible && <BitcoinBackendsCard />}
                <ExperimentalFeaturesSettingsCard />
                {isMevProtectionSettingsVisible && <TurnOffMevProtectionCard />}
                <TurnOffFirmwareAuthenticityCheckCard />
                <TurnOffDeviceAuthenticityCheckCard />
                <TurnOffNetworkReserveCheckCard />
            </VStack>
        </Screen>
    );
};
