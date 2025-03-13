import { useEffect } from 'react';
import { useSelector } from 'react-redux';

import { selectSelectedDevice } from '@suite-common/wallet-core';
import { ContinueOnTrezorScreenContent } from '@suite-native/device';
import { useToast } from '@suite-native/toasts';
import TrezorConnect from '@trezor/connect';

import { DeviceOnboardingScreenWithExitButton } from '../components/OnboardingScreenWithExitButton';

export const DeviceTutorialScreen = () => {
    const device = useSelector(selectSelectedDevice);
    const { showToast } = useToast();
    useEffect(() => {
        const showTutorial = async () => {
            await TrezorConnect.showDeviceTutorial({ device });
            showToast({
                message: 'TUTORIAL COMPLETED. TODO: navigate to auth. check screen.',
                variant: 'success',
            });
        };
        showTutorial();

        // This use effect should be triggered only during the first render
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    return (
        <DeviceOnboardingScreenWithExitButton>
            <ContinueOnTrezorScreenContent titleTxKey="moduleDeviceOnboarding.deviceTutorialScreen.title" />
        </DeviceOnboardingScreenWithExitButton>
    );
};
