import {
    checkSeedThunk,
    isRecoveryInProgress,
    recoverDeviceThunk,
    recoveryActions,
} from '@suite/recovery';
import { selectSelectedDevice } from '@suite-common/device';
import TrezorConnect from '@trezor/connect';

import * as onboardingActions from 'src/actions/onboarding/onboardingActions';
import * as routerActions from 'src/actions/suite/routerActions';
import { Dispatch, GetState } from 'src/types/suite';

export type RecoveryAction = ReturnType<(typeof recoveryActions)[keyof typeof recoveryActions]>;

// Recovery mode is persistent on T2T1. This means that device stays in recovery mode even after reconnecting.
// In such case, we need to call again the call that brought device into recovery mode (either proper recovery
// or seed check). This way, communication is renewed and host starts receiving messages from device again.
const recoveryRerun = () => async (dispatch: Dispatch, getState: GetState) => {
    const { router } = getState();
    const device = selectSelectedDevice(getState());
    if (!device?.features) {
        return;
    }

    dispatch(recoveryActions.setStatus('in-progress'));

    // user might have proceeded with recovery on screen which means that we need to
    // reload fresh features before deciding what to do
    const response = await TrezorConnect.getFeatures({ device: { path: device.path } });

    if (!response.success) {
        dispatch(recoveryActions.setStatus('finished'));
        dispatch(recoveryActions.setError('failed to rerun recovery'));

        return;
    }

    const features = response.payload;

    if (!isRecoveryInProgress(features)) {
        return;
    }

    if (!features.initialized) {
        if (router.app !== 'onboarding') {
            dispatch(routerActions.goto('onboarding-index'));
        }
        dispatch(onboardingActions.goToStep('recovery'));
        dispatch(onboardingActions.addPath('recovery'));
        dispatch(recoverDeviceThunk());
    }

    if (features.initialized) {
        dispatch(routerActions.goto('recovery-index'));
        dispatch(checkSeedThunk());
    }
};

export { recoveryRerun };
