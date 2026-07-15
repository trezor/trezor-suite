import { useSelector } from 'react-redux';

import { selectIsNetworkReserveSettingsVisible } from '@suite-common/wallet-core';
import { VStack } from '@suite-native/atoms';
import { Translation } from '@suite-native/intl';
import { DynamicScreenHeader, Screen } from '@suite-native/navigation';

import { ToggleAddressDisplayCard } from '../components/ToggleAddressDisplayCard';
import { ToggleDeviceAuthenticityCheckCard } from '../components/ToggleDeviceAuthenticityCheckCard';
import { ToggleFirmwareAuthenticityCheckCard } from '../components/ToggleFirmwareAuthenticityCheckCard';
import { ToggleNetworkReserveCheckCard } from '../components/ToggleNetworkReserveCheckCard';
import { ToggleTestnetsCard } from '../components/ToggleTestnetsCard';

export const SettingsAdvancedScreen = () => {
    const isNetworkReserveSettingsVisible = useSelector(selectIsNetworkReserveSettingsVisible);

    return (
        <Screen
            header={
                <DynamicScreenHeader title={<Translation id="moduleSettings.advanced.title" />} />
            }
        >
            <VStack spacing="sp16">
                <ToggleFirmwareAuthenticityCheckCard />
                <ToggleDeviceAuthenticityCheckCard />
                <ToggleAddressDisplayCard />
                <ToggleTestnetsCard />
                {isNetworkReserveSettingsVisible && <ToggleNetworkReserveCheckCard />}
            </VStack>
        </Screen>
    );
};
