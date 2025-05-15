import { useEffect } from 'react';

import { useNavigation } from '@react-navigation/core';

import { Box } from '@suite-native/atoms';
import {
    DeviceOnboardingStackParamList,
    DeviceOnboardingStackRoutes,
    RootStackParamList,
    Screen,
    ScreenHeader,
    ScreenProps,
    StackToStackCompositeNavigationProps,
} from '@suite-native/navigation';

import { useExitAlert } from '../hooks/useExitAlert';

type NavigationProps = StackToStackCompositeNavigationProps<
    DeviceOnboardingStackParamList,
    DeviceOnboardingStackRoutes,
    RootStackParamList
>;

type DeviceOnboardingExitButtonScreenHeaderProps = {
    onAlertContinueButtonPress?: () => void;
};

const DeviceOnboardingExitButtonScreenHeader = ({
    onAlertContinueButtonPress,
}: DeviceOnboardingExitButtonScreenHeaderProps) => {
    const navigation = useNavigation<NavigationProps>();
    const { handleExitButtonPress } = useExitAlert(onAlertContinueButtonPress);

    useEffect(() => {
        // Override default navigation GO_BACK action to align it with the exit button behavior.
        const unsubscribe = navigation.addListener('beforeRemove', e => {
            if (e.data.action.type === 'GO_BACK') {
                e.preventDefault();
                handleExitButtonPress();
            }
        });

        return unsubscribe;
    }, [handleExitButtonPress, navigation]);

    return <ScreenHeader closeActionType="close" closeAction={handleExitButtonPress} />;
};

export const DeviceOnboardingScreenWithExitButton = ({
    children,
    onAlertContinueButtonPress,
    ...screenProps
}: ScreenProps & DeviceOnboardingExitButtonScreenHeaderProps) => (
    <Screen
        header={
            <DeviceOnboardingExitButtonScreenHeader
                onAlertContinueButtonPress={onAlertContinueButtonPress}
            />
        }
        {...screenProps}
    >
        <Box flex={1} marginTop="sp16">
            {children}
        </Box>
    </Screen>
);
