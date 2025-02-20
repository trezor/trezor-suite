import { useCallback } from 'react';
import { useSelector } from 'react-redux';

import {
    DeviceRootState,
    DiscoveryRootState,
    selectDeviceState,
    selectIsDiscoveryActiveByDeviceState,
} from '@suite-common/wallet-core';
import { useAlert } from '@suite-native/alerts';
import { Box, Button, Text, VStack } from '@suite-native/atoms';
import { useIsFirmwareUpdateFeatureEnabled } from '@suite-native/firmware';
import { Translation, useTranslate } from '@suite-native/intl';
import { Screen, ScreenHeader } from '@suite-native/navigation';

import { FirmwareChangelogButton } from './FirmwareChangelogButton';
import { FirmwareUpdateVersionCard } from './FirmwareVersionCard';

type ConfirmFirmwareUpdateScreenProps = {
    onUpdateConfirmation: () => void;
    onSkipUpdate?: () => void;
};

export const ConfirmFirmwareUpdateScreenContent = ({
    onUpdateConfirmation,
    onSkipUpdate,
}: ConfirmFirmwareUpdateScreenProps) => {
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
        <Screen
            header={<ScreenHeader closeActionType="close" />}
            footer={
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
                            isDisabled={isDiscoveryRunning || !isFirmwareUpdateEnabled}
                            isLoading={isDiscoveryRunning}
                            colorScheme="tertiaryElevation0"
                        >
                            <Translation id="firmware.firmwareUpdateScreen.skipButton" />
                        </Button>
                    )}
                </VStack>
            }
        >
            <Box paddingTop="sp16">
                <Text variant="titleMedium">
                    <Translation id="firmware.firmwareUpdateScreen.title" />
                </Text>
            </Box>
            <Box paddingTop="sp8">
                <Text variant="body" color="textSubdued">
                    <Translation id="firmware.firmwareUpdateScreen.subtitle" />
                </Text>
            </Box>
            <FirmwareUpdateVersionCard marginTop="sp32" marginBottom="sp12" />
            <FirmwareChangelogButton />
        </Screen>
    );
};
