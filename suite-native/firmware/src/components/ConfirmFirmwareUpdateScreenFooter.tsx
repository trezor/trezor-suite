import { ReactNode, useCallback } from 'react';
import { useSelector } from 'react-redux';

import {
    DeviceRootState,
    DiscoveryRootState,
    selectDeviceState,
    selectIsDiscoveryActiveByDeviceState,
} from '@suite-common/wallet-core';
import { useAlert } from '@suite-native/alerts';
import { Button, VStack } from '@suite-native/atoms';
import { Translation, useTranslate } from '@suite-native/intl';

import { useIsFirmwareUpdateFeatureEnabled } from '../hooks/useIsFirmwareUpdateFeatureEnabled';

type ConfirmFirmwareUpdateScreenProps = {
    onUpdateConfirmation: () => void;
    onSkipUpdate?: () => void;
    header?: ReactNode;
};

type ConfirmFirmwareUpdateScreenFooterProps = Exclude<ConfirmFirmwareUpdateScreenProps, 'header'>;

export const ConfirmFirmwareUpdateScreenFooter = ({
    onUpdateConfirmation,
    onSkipUpdate,
}: ConfirmFirmwareUpdateScreenFooterProps) => {
    const { showAlert } = useAlert();
    const { translate } = useTranslate();

    const deviceState = useSelector(selectDeviceState);

    const isDiscoveryRunning = useSelector((state: DiscoveryRootState & DeviceRootState) =>
        selectIsDiscoveryActiveByDeviceState(state, deviceState),
    );
    const isFirmwareUpdateEnabled = useIsFirmwareUpdateFeatureEnabled();

    const handleShowSeedBottomSheet = useCallback(() => {
        showAlert({
            title: translate('firmware.seedBottomSheet.title'),
            description: translate('firmware.seedBottomSheet.description'),
            primaryButtonTitle: translate('firmware.seedBottomSheet.continueButton'),
            onPressPrimaryButton: onUpdateConfirmation,
            secondaryButtonTitle: translate('firmware.seedBottomSheet.closeButton'),
        });
    }, [showAlert, translate, onUpdateConfirmation]);

    return (
        <VStack spacing="sp12" marginHorizontal="sp16" marginBottom="sp16">
            <Button
                onPress={handleShowSeedBottomSheet}
                isDisabled={isDiscoveryRunning || !isFirmwareUpdateEnabled}
                isLoading={isDiscoveryRunning}
            >
                <Translation id="firmware.firmwareUpdateScreen.updateButton" />
            </Button>
            {onSkipUpdate && (
                <Button
                    onPress={onSkipUpdate}
                    testID="@firmware/skip-button"
                    isDisabled={isDiscoveryRunning || !isFirmwareUpdateEnabled}
                    isLoading={isDiscoveryRunning}
                    colorScheme="tertiaryElevation0"
                >
                    <Translation id="firmware.firmwareUpdateScreen.skipButton" />
                </Button>
            )}
        </VStack>
    );
};
