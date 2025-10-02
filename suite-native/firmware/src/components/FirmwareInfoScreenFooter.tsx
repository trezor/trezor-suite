import { useSelector } from 'react-redux';

import {
    selectHasDeviceFirmwareInstalled,
    selectHasRunningDiscovery,
} from '@suite-common/wallet-core';
import { Button, VStack } from '@suite-native/atoms';
import { Translation } from '@suite-native/intl';

import { useIsFirmwareUpdateFeatureEnabled } from '../hooks/useIsFirmwareUpdateFeatureEnabled';

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
    const isFirmwareUpdateEnabled = useIsFirmwareUpdateFeatureEnabled();

    const confirmButtonTranslationId = hasDeviceFirmwareInstalled
        ? 'firmware.firmwareInfoScreen.list.updateButton'
        : 'firmware.firmwareInfoScreen.list.installButton';

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
                colorScheme="tertiaryElevation0"
            >
                <Translation id="firmware.firmwareInfoScreen.list.cancelButton" />
            </Button>
        </VStack>
    );
};
