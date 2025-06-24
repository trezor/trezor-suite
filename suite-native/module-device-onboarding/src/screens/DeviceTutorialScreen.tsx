import { useEffect } from 'react';
import { useSelector } from 'react-redux';

import { selectSelectedDevice } from '@suite-common/wallet-core';
import { ContinueOnTrezorScreenContent } from '@suite-native/device';
import { requestPrioritizedDeviceAccess } from '@suite-native/device-mutex';
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
            await requestPrioritizedDeviceAccess({
                deviceCallback: () => TrezorConnect.showDeviceTutorial({ device }),
            });
            navigation.navigate(DeviceOnboardingStackRoutes.CreateOrRecoverCrossroads);
        };
        showTutorial();

        // This use effect should be triggered only during the first render
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

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
