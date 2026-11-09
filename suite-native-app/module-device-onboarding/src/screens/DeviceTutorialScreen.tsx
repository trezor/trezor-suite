import { useCallback } from 'react';
import { useSelector } from 'react-redux';

import { useFocusEffect } from '@react-navigation/native';

import { selectSelectedDevice } from '@suite-common/device';
import { ContinueOnTrezorScreenContent } from '@suite-native/device';
import { requestPrioritizedDeviceAccess } from '@suite-native/device-mutex';
import {
    type DeviceOnboardingStackParamList,
    DeviceOnboardingStackRoutes,
    type StackProps,
    useInterceptNativeNavigation,
} from '@suite-native/navigation';
import TrezorConnect from '@trezor/connect';

import { DeviceOnboardingScreenWithExitButton } from '../components/DeviceOnboardingScreenWithExitButton';

export const DeviceTutorialScreen = ({
    navigation,
}: StackProps<DeviceOnboardingStackParamList, DeviceOnboardingStackRoutes.DeviceTutorial>) => {
    const device = useSelector(selectSelectedDevice);
    useInterceptNativeNavigation();

    useFocusEffect(
        useCallback(() => {
            const showTutorial = async () => {
                await requestPrioritizedDeviceAccess(() =>
                    TrezorConnect.showDeviceTutorial({ device }),
                );
                navigation.replace(DeviceOnboardingStackRoutes.CreateOrRecoverCrossroads);
            };
            showTutorial();

            // This use effect should be triggered only during the first render
            // eslint-disable-next-line react-hooks/exhaustive-deps
        }, []),
    );

    const handleSkipTutorial = () => {
        TrezorConnect.cancel();
    };

    return (
        <DeviceOnboardingScreenWithExitButton>
            <ContinueOnTrezorScreenContent
                titleTxKey="moduleDeviceOnboarding.deviceTutorialScreen.title"
                actionLabelTxKey="moduleDeviceOnboarding.deviceTutorialScreen.actionLabel"
                onActionPress={handleSkipTutorial}
            />
        </DeviceOnboardingScreenWithExitButton>
    );
};
