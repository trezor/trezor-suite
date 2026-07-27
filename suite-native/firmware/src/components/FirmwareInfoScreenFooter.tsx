import { useSelector } from 'react-redux';

import { selectHasDeviceFirmwareInstalled } from '@suite-common/device';
import { selectHasRunningDiscovery } from '@suite-common/wallet-core';
import { Button, VStack } from '@suite-native/atoms';
import { Translation } from '@suite-native/intl';

import { selectIsFirmwareUpdateFeatureEnabled } from '../hooks/useIsFirmwareUpdateFeatureEnabled';

type FirmwareInfoScreenFooterProps = {
    onUpdateConfirmation: () => void;
    onCancel: () => void;
};

export const FirmwareInfoScreenFooter = ({
    onUpdateConfirmation,
    onCancel,
}: FirmwareInfoScreenFooterProps) => {
    const isDiscoveryRunning = useSelector(selectHasRunningDiscovery);
    const hasDeviceFirmwareInstalled = useSelector(selectHasDeviceFirmwareInstalled);
    const isFirmwareUpdateEnabled = useSelector(selectIsFirmwareUpdateFeatureEnabled);

    const confirmButtonTranslationId = hasDeviceFirmwareInstalled
        ? 'firmware.firmwareInfoScreen.updateButton'
        : 'firmware.firmwareInfoScreen.installButton';

    return (
        <VStack spacing="sp12" marginHorizontal="sp16" marginBottom="sp16">
            <Button
                onPress={onUpdateConfirmation}
                isDisabled={isDiscoveryRunning || !isFirmwareUpdateEnabled}
                isLoading={isDiscoveryRunning}
                testID="@firmware-info-footer/update-button"
            >
                <Translation id={confirmButtonTranslationId} />
            </Button>
            <Button
                onPress={onCancel}
                testID="@firmware-info-footer/cancel-button"
                isDisabled={isDiscoveryRunning || !isFirmwareUpdateEnabled}
                isLoading={isDiscoveryRunning}
                intent="neutral"
                priority="secondary"
            >
                <Translation id="firmware.firmwareInfoScreen.cancelButton" />
            </Button>
        </VStack>
    );
};
