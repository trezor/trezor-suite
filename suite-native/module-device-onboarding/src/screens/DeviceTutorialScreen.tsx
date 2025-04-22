import { useEffect } from 'react';
import { useSelector } from 'react-redux';

import { selectSelectedDevice } from '@suite-common/wallet-core';
import { ContinueOnTrezorScreenContent } from '@suite-native/device';
import {
    DeviceOnboardingStackParamList,
    DeviceOnboardingStackRoutes,
    StackProps,
} from '@suite-native/navigation';
import TrezorConnect from '@trezor/connect';

import { DeviceOnboardingScreenWithExitButton } from '../components/DeviceOnboardingScreenWithExitButton';

export const DeviceTutorialScreen = ({
    navigation,
}: StackProps<DeviceOnboardingStackParamList, DeviceOnboardingStackRoutes.DeviceTutorial>) => {
    const device = useSelector(selectSelectedDevice);
    useEffect(() => {
        const showTutorial = async () => {
            const { success, payload } = await TrezorConnect.showDeviceTutorial({ device });

            if (success || payload.code === 'Failure_ActionCancelled') {
                navigation.navigate(DeviceOnboardingStackRoutes.CreateOrRecoverCrossroads);
            }
        };
        showTutorial();

        // This use effect should be triggered only during the first render
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const handleSkipTutorial = () => {
        TrezorConnect.cancel();
        navigation.navigate(DeviceOnboardingStackRoutes.CreateOrRecoverCrossroads);
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
