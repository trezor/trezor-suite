import { useSelector } from 'react-redux';

import { SUPPORTS_DEVICE_AUTHENTICITY_CHECK } from '@suite-common/suite-constants';
import { selectDeviceModel, selectSelectedDevice } from '@suite-common/wallet-core';
import { Text, VStack } from '@suite-native/atoms';
import { DeviceImage } from '@suite-native/device';
import { useTranslate } from '@suite-native/intl';
import { Screen, ScreenHeader } from '@suite-native/navigation';

import { DeviceAuthenticityCard } from '../components/DeviceAuthenticityCard';
import { DeviceFirmwareCard } from '../components/DeviceFirmwareCard';
import { DevicePinProtectionCard } from '../components/DevicePinProtectionCard';
import { useDeviceChangedCheck } from '../hooks/useDeviceChangedCheck';

export const DeviceSettingsModalScreen = () => {
    useDeviceChangedCheck();
    const { translate } = useTranslate();

    const device = useSelector(selectSelectedDevice);
    const deviceModel = useSelector(selectDeviceModel);

    if (!device || !deviceModel) {
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
                <Text variant="titleMedium">{device.name}</Text>
            </VStack>
            <VStack spacing="sp24">
                <DeviceFirmwareCard />
                <DevicePinProtectionCard />
                {SUPPORTS_DEVICE_AUTHENTICITY_CHECK[deviceModel] && <DeviceAuthenticityCard />}
            </VStack>
        </Screen>
    );
};
