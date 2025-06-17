import { useSelector } from 'react-redux';

import { SUPPORTS_DEVICE_AUTHENTICITY_CHECK } from '@suite-common/suite-constants';
import {
    selectDeviceLabel,
    selectDeviceModel,
    selectDeviceName,
    selectIsDeviceConnectedViaBluetooth,
} from '@suite-common/wallet-core';
import { VStack } from '@suite-native/atoms';
import { Translation } from '@suite-native/intl';
import { Screen, ScreenHeader } from '@suite-native/navigation';

import { DeviceAuthenticityCard } from '../components/DeviceAuthenticityCard';
import { DeviceBluetoothCard } from '../components/DeviceBluetoothCard';
import { DeviceFirmwareCard } from '../components/DeviceFirmwareCard';
import { DeviceInfo } from '../components/DeviceInfo';
import { DevicePinProtectionCard } from '../components/DevicePinProtectionCard';
import { DeviceSettingsSection } from '../components/DeviceSettingsSection';
import { WipeDeviceCard } from '../components/WipeDeviceCard';
import { useDeviceChangedCheck } from '../hooks/useDeviceChangedCheck';

export const DeviceSettingsModalScreen = () => {
    useDeviceChangedCheck();

    const deviceModel = useSelector(selectDeviceModel);
    const deviceName = useSelector(selectDeviceName);
    const deviceLabel = useSelector(selectDeviceLabel);
    const isDeviceConnectedViaBluetooth = useSelector(selectIsDeviceConnectedViaBluetooth);

    if (!deviceModel || !deviceName) {
        return null;
    }

    return (
        <Screen header={<ScreenHeader closeActionType="close" />}>
            <VStack spacing="sp40">
                <DeviceInfo deviceName={deviceLabel || deviceName} deviceModel={deviceModel} />
                <DeviceSettingsSection
                    title={<Translation id="moduleDeviceSettings.sectionTitles.general" />}
                >
                    <DevicePinProtectionCard />
                    <DeviceFirmwareCard />
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
