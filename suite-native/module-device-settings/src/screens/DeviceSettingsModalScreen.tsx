import { useSelector } from 'react-redux';

import { SUPPORTS_DEVICE_AUTHENTICITY_CHECK } from '@suite-common/suite-constants';
import {
    selectDeviceModel,
    selectDeviceName,
    selectIsDeviceConnectedViaBluetooth,
} from '@suite-common/wallet-core';
import { Text, TextDivider, VStack } from '@suite-native/atoms';
import { DeviceImage } from '@suite-native/device';
import { useTranslate } from '@suite-native/intl';
import { Screen, ScreenHeader } from '@suite-native/navigation';

import { DeviceAuthenticityCard } from '../components/DeviceAuthenticityCard';
import { DeviceBluetoothCard } from '../components/DeviceBluetoothCard';
import { DeviceFirmwareCard } from '../components/DeviceFirmwareCard';
import { DevicePinProtectionCard } from '../components/DevicePinProtectionCard';
import { WipeDeviceCard } from '../components/WipeDeviceCard';
import { useDeviceChangedCheck } from '../hooks/useDeviceChangedCheck';

export const DeviceSettingsModalScreen = () => {
    useDeviceChangedCheck();
    const { translate } = useTranslate();

    const deviceModel = useSelector(selectDeviceModel);
    const deviceName = useSelector(selectDeviceName);
    const isDeviceConnectedViaBluetooth = useSelector(selectIsDeviceConnectedViaBluetooth);

    if (!deviceModel || !deviceName) {
        return null;
    }

    return (
        <Screen
            header={
                <ScreenHeader
                    content={translate('moduleDeviceSettings.title')}
                    closeActionType="close"
                />
            }
        >
            <VStack marginVertical="sp32" spacing="sp24" alignItems="center">
                <DeviceImage deviceModel={deviceModel} />
                <Text variant="titleMedium">{deviceName}</Text>
            </VStack>
            <VStack spacing="sp16">
                <DeviceFirmwareCard />
                <DevicePinProtectionCard />
                {SUPPORTS_DEVICE_AUTHENTICITY_CHECK[deviceModel] && <DeviceAuthenticityCard />}
                {isDeviceConnectedViaBluetooth && <DeviceBluetoothCard />}
                <TextDivider title="moduleDeviceSettings.dangerZoneDivider" />
                <WipeDeviceCard />
            </VStack>
        </Screen>
    );
};
