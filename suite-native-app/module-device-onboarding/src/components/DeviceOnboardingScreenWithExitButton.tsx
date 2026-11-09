import React, { type ComponentProps, type ReactElement, type ReactNode } from 'react';

import { Box } from '@suite-native/atoms';
import { type Translation } from '@suite-native/intl';
import {
    DynamicScreenHeader,
    Screen,
    ScreenHeader,
    type ScreenProps,
    useInterceptNativeNavigation,
} from '@suite-native/navigation';

import { useExitAlert } from '../hooks/useExitAlert';

type DeviceOnboardingExitButtonScreenHeaderProps = {
    screenHeaderTitle?: ReactElement<ComponentProps<typeof Translation>> | string;
    screenHeaderSubtitle?: ReactElement<ComponentProps<typeof Translation>> | string;
    screenHeaderRightIcon?: ReactNode;
    onAlertContinueButtonPress?: () => void;
};

export const DeviceOnboardingScreenWithExitButton = ({
    children,
    screenHeaderRightIcon,
    onAlertContinueButtonPress,
    screenHeaderTitle,
    screenHeaderSubtitle,
    ...screenProps
}: ScreenProps & DeviceOnboardingExitButtonScreenHeaderProps) => {
    const { handleExitButtonPress } = useExitAlert(onAlertContinueButtonPress);
    useInterceptNativeNavigation({ onPress: handleExitButtonPress });

    return (
        <Screen
            header={
                screenHeaderTitle ? (
                    <DynamicScreenHeader
                        title={screenHeaderTitle}
                        subtitle={screenHeaderSubtitle}
                        closeActionType="close"
                        closeAction={handleExitButtonPress}
                        rightIcon={screenHeaderRightIcon}
                    />
                ) : (
                    <ScreenHeader
                        closeActionType="close"
                        closeAction={handleExitButtonPress}
                        rightIcon={screenHeaderRightIcon}
                    />
                )
            }
            {...screenProps}
        >
            <Box flex={1} marginTop="sp16">
                {children}
            </Box>
        </Screen>
    );
};
