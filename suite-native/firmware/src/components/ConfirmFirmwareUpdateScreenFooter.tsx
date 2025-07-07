import { ReactNode } from 'react';
import { useSelector } from 'react-redux';

import { selectHasRunningDiscovery } from '@suite-common/wallet-core';
import { Button, VStack } from '@suite-native/atoms';
import { Translation } from '@suite-native/intl';

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
    const isDiscoveryRunning = useSelector(selectHasRunningDiscovery);
    const isFirmwareUpdateEnabled = useIsFirmwareUpdateFeatureEnabled();

    return (
        <VStack spacing="sp12" marginHorizontal="sp16" marginBottom="sp16">
            <Button
                onPress={onUpdateConfirmation}
                colorScheme="blueBold"
                isDisabled={isDiscoveryRunning || !isFirmwareUpdateEnabled}
                isLoading={isDiscoveryRunning}
            >
                <Translation id="firmware.firmwareUpdateScreen.updateFirmware" />
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
