import { useSelector } from 'react-redux';

import { SUPPORTS_DEVICE_AUTHENTICITY_CHECK } from '@suite-common/suite-constants';
import {
    selectDeviceModel,
    selectDeviceName,
    selectIsDeviceConnectedViaBluetooth,
} from '@suite-common/wallet-core';
import { Text, VStack } from '@suite-native/atoms';
import { DeviceImage } from '@suite-native/device';
import { Translation } from '@suite-native/intl';
import { Screen, ScreenHeader } from '@suite-native/navigation';

import { DeviceAuthenticityCard } from '../components/DeviceAuthenticityCard';
import { DeviceBluetoothCard } from '../components/DeviceBluetoothCard';
import { DeviceFirmwareCard } from '../components/DeviceFirmwareCard';
import { DevicePinProtectionCard } from '../components/DevicePinProtectionCard';
import { DeviceSettingsSection } from '../components/DeviceSettingsSection';
import { WipeDeviceCard } from '../components/WipeDeviceCard';
import { useDeviceChangedCheck } from '../hooks/useDeviceChangedCheck';

export const DeviceSettingsModalScreen = () => {
    useDeviceChangedCheck();

    const deviceModel = useSelector(selectDeviceModel);
    const deviceName = useSelector(selectDeviceName);
    const isDeviceConnectedViaBluetooth = useSelector(selectIsDeviceConnectedViaBluetooth);

    if (!deviceModel || !deviceName) {
        return null;
    }

    return (
        <Screen header={<ScreenHeader closeActionType="close" />}>
            <VStack spacing="sp40">
                <VStack marginTop="sp24" spacing="sp24" alignItems="center">
                    <DeviceImage deviceModel={deviceModel} />
                    <Text variant="titleMedium">{deviceName}</Text>
                </VStack>
                <DeviceSettingsSection
                    title={<Translation id="moduleDeviceSettings.sectionTitles.general" />}
                >
                    <DeviceFirmwareCard />
                    <DevicePinProtectionCard />
                </DeviceSettingsSection>
                <DeviceSettingsSection
                    title={<Translation id="moduleDeviceSettings.sectionTitles.checks" />}
                >
                    {SUPPORTS_DEVICE_AUTHENTICITY_CHECK[deviceModel] && <DeviceAuthenticityCard />}
                </DeviceSettingsSection>
                {isDeviceConnectedViaBluetooth && <DeviceBluetoothCard />}
                <DeviceSettingsSection
                    title={<Translation id="moduleDeviceSettings.sectionTitles.dangerZone" />}
                >
                    <WipeDeviceCard />
                </DeviceSettingsSection>
            </VStack>
        </Screen>
    );
};
