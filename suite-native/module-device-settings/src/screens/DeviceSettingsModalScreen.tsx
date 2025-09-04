import { useSelector } from 'react-redux';

import { SUPPORTS_DEVICE_AUTHENTICITY_CHECK } from '@suite-common/suite-constants';
import {
    selectDeviceLabel,
    selectDeviceModel,
    selectDeviceName,
    selectIsBluetoothDevice,
    selectIsDeviceBackupUnfinished,
    selectIsDeviceInitialized,
} from '@suite-common/wallet-core';
import { TitledSection, VStack } from '@suite-native/atoms';
import { Translation } from '@suite-native/intl';
import { Screen, ScreenHeader, useNavigateToInitialScreen } from '@suite-native/navigation';

import { DeviceAuthenticityCard } from '../components/DeviceAuthenticityCard';
import { DeviceAutoConnectCard } from '../components/DeviceAutoConnectCard';
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
    const navigateToInitialScreen = useNavigateToInitialScreen();
    const isBluetoothDevice = useSelector(selectIsBluetoothDevice);
    const isDeviceBackupUnfinished = useSelector(selectIsDeviceBackupUnfinished);
    const isDeviceInitialized = useSelector(selectIsDeviceInitialized);
    const isCheckBackupAvailable = isDeviceInitialized && !isDeviceBackupUnfinished;

    if (!deviceModel || !deviceName) {
        return null;
    }

    return (
        <Screen
            header={<ScreenHeader closeActionType="close" closeAction={navigateToInitialScreen} />}
        >
            <VStack spacing="sp40">
                <DeviceInfo deviceName={deviceLabel || deviceName} deviceModel={deviceModel} />
                <TitledSection
                    title={<Translation id="moduleDeviceSettings.sectionTitles.general" />}
                >
                    {isDeviceInitialized && <DevicePinProtectionCard />}
                    <DeviceFirmwareCard />
                    {isBluetoothDevice && <DeviceBluetoothCard />}
                    {isBluetoothDevice && <DeviceAutoConnectCard />}
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
                    <WipeDeviceCard />
                </TitledSection>
            </VStack>
        </Screen>
    );
};
