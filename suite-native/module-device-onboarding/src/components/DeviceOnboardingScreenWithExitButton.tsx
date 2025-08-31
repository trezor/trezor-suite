import React, { ReactNode } from 'react';

import { Box } from '@suite-native/atoms';
import { Translation } from '@suite-native/intl';
import {
    DynamicScreenHeader,
    Screen,
    ScreenProps,
    useOverrideBackNavigation,
} from '@suite-native/navigation';

import { useExitAlert } from '../hooks/useExitAlert';

type DeviceOnboardingExitButtonScreenHeaderProps = {
    screenHeaderRightIcon?: ReactNode;
    onAlertContinueButtonPress?: () => void;
};

export const DeviceOnboardingExitButtonScreenHeader = ({
    screenHeaderRightIcon,
    onAlertContinueButtonPress,
}: DeviceOnboardingExitButtonScreenHeaderProps) => {
    const { handleExitButtonPress } = useExitAlert(onAlertContinueButtonPress);
    useOverrideBackNavigation({ onNavigateBack: handleExitButtonPress });

    return (
        <DynamicScreenHeader
            title={<Translation id="firmware.firmwareUpdateScreen.title" />}
            subtitle={<Translation id="firmware.firmwareUpdateScreen.subtitle" />}
            closeActionType="close"
            closeAction={handleExitButtonPress}
            rightIcon={screenHeaderRightIcon}
        />
    );
};

export const DeviceOnboardingScreenWithExitButton = ({
    children,
    screenHeaderRightIcon,
    onAlertContinueButtonPress,
    ...screenProps
}: ScreenProps & DeviceOnboardingExitButtonScreenHeaderProps) => (
    <Screen
        header={
            <DeviceOnboardingExitButtonScreenHeader
                onAlertContinueButtonPress={onAlertContinueButtonPress}
                screenHeaderRightIcon={screenHeaderRightIcon}
            />
        }
        {...screenProps}
    >
        <Box flex={1} marginTop="sp16">
            {children}
        </Box>
    </Screen>
);
