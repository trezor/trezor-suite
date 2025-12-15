import type { ReactNode } from 'react';
import React from 'react';

import { Box } from '@suite-native/atoms';
import type { ScreenProps } from '@suite-native/navigation';
import { Screen, ScreenHeader, useInterceptNativeNavigation } from '@suite-native/navigation';

type NonClosableDeviceOnboardingScreenProps = {
    screenHeaderRightIcon?: ReactNode;
} & ScreenProps;

export const NonClosableDeviceOnboardingScreen = ({
    children,
    screenHeaderRightIcon,
    ...screenProps
}: NonClosableDeviceOnboardingScreenProps) => {
    useInterceptNativeNavigation();

    return (
        <Screen
            {...screenProps}
            header={<ScreenHeader leftIcon={null} rightIcon={screenHeaderRightIcon} />}
            isScrollable={false}
        >
            <Box flex={1} marginTop="sp16">
                {children}
            </Box>
        </Screen>
    );
};
