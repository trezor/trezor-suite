import { useSelector } from 'react-redux';

import { selectIsMevProtectionSettingsVisible } from '@suite-common/mev';
import { selectIsNetworkReserveSettingsVisible } from '@suite-common/wallet-core';
import { VStack } from '@suite-native/atoms';
import { ExperimentalFeaturesSettingsCard } from '@suite-native/experimental-features';
import { Translation } from '@suite-native/intl';
import { DynamicScreenHeader, Screen } from '@suite-native/navigation';

import { BitcoinBackendsCard } from '../components/BitcoinBackendsCard';
import { ToggleDeviceAuthenticityCheckCard } from '../components/ToggleDeviceAuthenticityCheckCard';
import { ToggleFirmwareAuthenticityCheckCard } from '../components/ToggleFirmwareAuthenticityCheckCard';
import { ToggleMevProtectionCard } from '../components/ToggleMevProtectionCard';
import { ToggleNetworkReserveCheckCard } from '../components/ToggleNetworkReserveCheckCard';
import { selectIsBitcoinBackendsConfigVisible } from '../selectors';

export const SettingsAdvancedScreen = () => {
    const isMevProtectionSettingsVisible = useSelector(selectIsMevProtectionSettingsVisible);
    const isBitcoinBackendsConfigVisible = useSelector(selectIsBitcoinBackendsConfigVisible);
    const isNetworkReserveSettingsVisible = useSelector(selectIsNetworkReserveSettingsVisible);

    return (
        <Screen
            header={
                <DynamicScreenHeader title={<Translation id="moduleSettings.advanced.title" />} />
            }
        >
            <VStack spacing="sp16">
                {isBitcoinBackendsConfigVisible && <BitcoinBackendsCard />}
                <ExperimentalFeaturesSettingsCard />
                {isMevProtectionSettingsVisible && <ToggleMevProtectionCard />}
                <ToggleFirmwareAuthenticityCheckCard />
                <ToggleDeviceAuthenticityCheckCard />
                {isNetworkReserveSettingsVisible && <ToggleNetworkReserveCheckCard />}
            </VStack>
        </Screen>
    );
};
