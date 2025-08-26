import { useSelector } from 'react-redux';

import { SUPPORTS_DEVICE_AUTHENTICITY_CHECK } from '@suite-common/suite-constants';
import {
    selectDeviceLabel,
    selectDeviceModel,
    selectDeviceName,
    selectIsDeviceBackupUnfinished,
    selectIsDeviceConnectedViaBluetooth,
    selectIsDeviceInitialized,
} from '@suite-common/wallet-core';
import { TitledSection, VStack } from '@suite-native/atoms';
import { Translation } from '@suite-native/intl';
import { Screen, ScreenHeader } from '@suite-native/navigation';

import { DeviceAuthenticityCard } from '../components/DeviceAuthenticityCard';
import { DeviceBluetoothCard } from '../components/DeviceBluetoothCard';
import { DeviceCheckBackupCard } from '../components/DeviceCheckBackupCard';
import { DeviceFirmwareCard } from '../components/DeviceFirmwareCard';
import { DeviceInfo } from '../components/DeviceInfo';
import { DevicePinProtectionCard } from '../components/DevicePinProtectionCard';
import { WipeDeviceCard } from '../components/WipeDeviceCard';
import { useDeviceChangedCheck } from '../hooks/useDeviceChangedCheck';

export const DeviceSettingsModalScreen = () => {
    useDeviceChangedCheck();

    const deviceModel = useSelector(selectDeviceModel);
    const deviceName = useSelector(selectDeviceName);
    const deviceLabel = useSelector(selectDeviceLabel);
    const isDeviceConnectedViaBluetooth = useSelector(selectIsDeviceConnectedViaBluetooth);
    const isDeviceBackupUnfinished = useSelector(selectIsDeviceBackupUnfinished);
    const isDeviceInitialized = useSelector(selectIsDeviceInitialized);
    const isCheckBackupAvailable = isDeviceInitialized && !isDeviceBackupUnfinished;

    if (!deviceModel || !deviceName) {
        return null;
    }

    return (
        <Screen header={<ScreenHeader closeActionType="close" />}>
            <VStack spacing="sp40">
                <DeviceInfo deviceName={deviceLabel || deviceName} deviceModel={deviceModel} />
                <TitledSection
                    title={<Translation id="moduleDeviceSettings.sectionTitles.general" />}
                >
                    {isDeviceInitialized && <DevicePinProtectionCard />}
                    <DeviceFirmwareCard />
                </TitledSection>
                <TitledSection
                    title={<Translation id="moduleDeviceSettings.sectionTitles.security" />}
                >
                    {isCheckBackupAvailable && <DeviceCheckBackupCard />}
                    {SUPPORTS_DEVICE_AUTHENTICITY_CHECK[deviceModel] && <DeviceAuthenticityCard />}
                </TitledSection>
                <TitledSection
                    title={<Translation id="moduleDeviceSettings.sectionTitles.dangerZone" />}
                >
                    {isDeviceConnectedViaBluetooth && <DeviceBluetoothCard />}
                    <WipeDeviceCard />
                </TitledSection>
            </VStack>
        </Screen>
    );
};
