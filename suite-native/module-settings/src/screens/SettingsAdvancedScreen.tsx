import { useSelector } from 'react-redux';

import { selectIsMevProtectionSettingsVisible } from '@suite-common/mev';
import { selectIsNetworkReserveSettingsVisible } from '@suite-common/wallet-core';
import { VStack } from '@suite-native/atoms';
import { Translation } from '@suite-native/intl';
import { DynamicScreenHeader, Screen } from '@suite-native/navigation';

import { DustPhishingThresholdCard } from '../components/DustPhishingThresholdCard';
import { ToggleAddressDisplayCard } from '../components/ToggleAddressDisplayCard';
import { ToggleDeviceAuthenticityCheckCard } from '../components/ToggleDeviceAuthenticityCheckCard';
import { ToggleFirmwareAuthenticityCheckCard } from '../components/ToggleFirmwareAuthenticityCheckCard';
import { ToggleMevProtectionCard } from '../components/ToggleMevProtectionCard';
import { ToggleNetworkReserveCheckCard } from '../components/ToggleNetworkReserveCheckCard';

export const SettingsAdvancedScreen = () => {
    const isMevProtectionSettingsVisible = useSelector(selectIsMevProtectionSettingsVisible);
    const isNetworkReserveSettingsVisible = useSelector(selectIsNetworkReserveSettingsVisible);

    return (
        <Screen
            header={
                <DynamicScreenHeader title={<Translation id="moduleSettings.advanced.title" />} />
            }
        >
            <VStack spacing="sp16">
                <ToggleAddressDisplayCard />
                {isMevProtectionSettingsVisible && <ToggleMevProtectionCard />}
                <DustPhishingThresholdCard />
                <ToggleFirmwareAuthenticityCheckCard />
                <ToggleDeviceAuthenticityCheckCard />
                {isNetworkReserveSettingsVisible && <ToggleNetworkReserveCheckCard />}
            </VStack>
        </Screen>
    );
};
