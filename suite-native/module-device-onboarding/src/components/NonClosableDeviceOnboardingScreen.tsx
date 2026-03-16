import React, { type ReactNode } from 'react';

import { Box } from '@suite-native/atoms';
import {
    Screen,
    ScreenHeader,
    type ScreenProps,
    useInterceptNativeNavigation,
} from '@suite-native/navigation';

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
