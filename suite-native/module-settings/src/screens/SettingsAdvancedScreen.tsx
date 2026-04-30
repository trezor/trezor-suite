import { useSelector } from 'react-redux';

import { selectIsMevProtectionSettingsVisible } from '@suite-common/mev';
import {
    selectIsDustPhishingThresholdSettingsVisible,
    selectIsNetworkReserveSettingsVisible,
} from '@suite-common/wallet-core';
import { VStack } from '@suite-native/atoms';
import { Translation } from '@suite-native/intl';
import { DynamicScreenHeader, Screen } from '@suite-native/navigation';

import { BitcoinBackendsCard } from '../components/BitcoinBackendsCard';
import { DustPhishingThresholdCard } from '../components/DustPhishingThresholdCard';
import { ToggleAddressDisplayCard } from '../components/ToggleAddressDisplayCard';
import { ToggleDeviceAuthenticityCheckCard } from '../components/ToggleDeviceAuthenticityCheckCard';
import { ToggleFirmwareAuthenticityCheckCard } from '../components/ToggleFirmwareAuthenticityCheckCard';
import { ToggleMevProtectionCard } from '../components/ToggleMevProtectionCard';
import { ToggleNetworkReserveCheckCard } from '../components/ToggleNetworkReserveCheckCard';
import { selectIsBitcoinBackendsConfigVisible } from '../selectors';

export const SettingsAdvancedScreen = () => {
    const isMevProtectionSettingsVisible = useSelector(selectIsMevProtectionSettingsVisible);
    const isBitcoinBackendsConfigVisible = useSelector(selectIsBitcoinBackendsConfigVisible);
    const isNetworkReserveSettingsVisible = useSelector(selectIsNetworkReserveSettingsVisible);
    const isDustPhishingThresholdSettingsVisible = useSelector(
        selectIsDustPhishingThresholdSettingsVisible,
    );

    return (
        <Screen
            header={
                <DynamicScreenHeader title={<Translation id="moduleSettings.advanced.title" />} />
            }
        >
            <VStack spacing="sp16">
                {isBitcoinBackendsConfigVisible && <BitcoinBackendsCard />}
                <ToggleAddressDisplayCard />
                {isMevProtectionSettingsVisible && <ToggleMevProtectionCard />}
                {isDustPhishingThresholdSettingsVisible && <DustPhishingThresholdCard />}
                <ToggleFirmwareAuthenticityCheckCard />
                <ToggleDeviceAuthenticityCheckCard />
                {isNetworkReserveSettingsVisible && <ToggleNetworkReserveCheckCard />}
            </VStack>
        </Screen>
    );
};
