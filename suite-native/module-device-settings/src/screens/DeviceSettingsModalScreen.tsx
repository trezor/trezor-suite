import { useSelector } from 'react-redux';

import { SUPPORTS_DEVICE_AUTHENTICITY_CHECK } from '@suite-common/suite-constants';
import {
    selectDeviceLabel,
    selectDeviceModel,
    selectDeviceName,
    selectIsDeviceConnectedViaBluetooth,
    selectIsDeviceInitialized,
    selectIsThpDevice,
} from '@suite-common/wallet-core';
import { TitledSection, VStack } from '@suite-native/atoms';
import { Translation } from '@suite-native/intl';
import { Screen, ScreenHeader, useNavigateToInitialScreen } from '@suite-native/navigation';

import { BackupAndPassphraseCard } from '../components/BackupAndPassphraseCard';
import { DeviceAuthenticityCard } from '../components/DeviceAuthenticityCard';
import { DeviceAutoConnectCard } from '../components/DeviceAutoConnectCard';
import { DeviceFirmwareCard } from '../components/DeviceFirmwareCard';
import { DeviceInfo } from '../components/DeviceInfo';
import { DevicePinProtectionCard } from '../components/DevicePinProtectionCard';
import { UnpairBluetoothDeviceCard } from '../components/UnpairBluetoothDeviceCard';
import { WipeDeviceCard } from '../components/WipeDeviceCard';
import { useDeviceChangedCheck } from '../hooks/useDeviceChangedCheck';

export const DeviceSettingsModalScreen = () => {
    useDeviceChangedCheck();

    const deviceModel = useSelector(selectDeviceModel);
    const deviceName = useSelector(selectDeviceName);
    const deviceLabel = useSelector(selectDeviceLabel);
    const navigateToInitialScreen = useNavigateToInitialScreen();
    const isDeviceConnectedViaBluetooth = useSelector(selectIsDeviceConnectedViaBluetooth);
    const isDeviceInitialized = useSelector(selectIsDeviceInitialized);
    const isThpDevice = useSelector(selectIsThpDevice);

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
                    <DeviceFirmwareCard />
                    {isThpDevice && <DeviceAutoConnectCard />}
                    {isDeviceConnectedViaBluetooth && <UnpairBluetoothDeviceCard />}
                </TitledSection>
                <TitledSection
                    title={<Translation id="moduleDeviceSettings.sectionTitles.security" />}
                >
                    {isDeviceInitialized && <DevicePinProtectionCard />}
                    {isDeviceInitialized && <BackupAndPassphraseCard />}
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
