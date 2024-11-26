import { useState } from 'react';
import { useSelector } from 'react-redux';

import { SUPPORTS_DEVICE_AUTHENTICITY_CHECK } from '@suite-common/suite-constants';
import {
    selectDevice,
    selectDeviceModel,
    selectDeviceReleaseInfo,
} from '@suite-common/wallet-core';
import { Button, Text, VStack } from '@suite-native/atoms';
import { DeviceImage } from '@suite-native/device';
import { Translation, useTranslate } from '@suite-native/intl';
import { Screen, ScreenSubHeader } from '@suite-native/navigation';

import { DeviceAuthenticityCard } from '../components/DeviceAuthenticityCard';
import { DeviceFirmwareCard } from '../components/DeviceFirmwareCard';
import { DevicePinProtectionCard } from '../components/DevicePinProtectionCard';
import { HowToUpdateBottomSheet } from '../components/HowToUpdateBottomSheet';

export const DeviceSettingsModalScreen = () => {
    const { translate } = useTranslate();

    const device = useSelector(selectDevice);
    const deviceModel = useSelector(selectDeviceModel);
    const deviceReleaseInfo = useSelector(selectDeviceReleaseInfo);

    const [isUpdateSheetOpen, setIsUpdateSheetOpen] = useState<boolean>(false);

    const isUpgradable = deviceReleaseInfo?.isNewer ?? false;

    if (!device || !deviceModel) {
        return null;
    }

    const handleUpdateClick = () => setIsUpdateSheetOpen(true);

    return (
        <Screen
            screenHeader={
                <ScreenSubHeader
                    customHorizontalPadding="sp16"
                    content={translate('moduleDeviceSettings.title')}
                    closeActionType="close"
                />
            }
            customHorizontalPadding="sp16"
        >
            <VStack marginVertical="sp32" spacing="sp24" alignItems="center">
                <DeviceImage deviceModel={deviceModel} />
                <Text variant="titleMedium">{device.name}</Text>
            </VStack>
            <VStack spacing="sp24">
                <DeviceFirmwareCard />
                <DevicePinProtectionCard />
                {SUPPORTS_DEVICE_AUTHENTICITY_CHECK[deviceModel] && <DeviceAuthenticityCard />}
                {isUpgradable && (
                    <Button colorScheme="primary" onPress={handleUpdateClick}>
                        <Translation id="moduleDeviceSettings.updateHowTo.title" />
                    </Button>
                )}
            </VStack>
            <HowToUpdateBottomSheet
                isVisible={isUpdateSheetOpen}
                onClose={setIsUpdateSheetOpen}
                title={<Translation id="moduleDeviceSettings.updateHowTo.title" />}
            />
        </Screen>
    );
};
