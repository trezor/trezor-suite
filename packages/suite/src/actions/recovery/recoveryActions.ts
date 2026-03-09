import { asTypedDesktopAnalytics, events } from '@suite/analytics';
import { recoveryActions } from '@suite/recovery';
import { selectSelectedDevice } from '@suite-common/device';
import { ExtraDependencies } from '@suite-common/redux-utils';
import TrezorConnect, { PROTO, RecoveryDevice, UI_RESPONSE } from '@trezor/connect';
import { DeviceModelInternal } from '@trezor/device-utils';

import * as onboardingActions from 'src/actions/onboarding/onboardingActions';
import * as routerActions from 'src/actions/suite/routerActions';
import { DEFAULT_PASSPHRASE_PROTECTION } from 'src/constants/suite/device';
import { Dispatch, GetState } from 'src/types/suite';

import { isRecoveryInProgress } from '../../utils/device/isRecoveryInProgress';

export type RecoveryAction = ReturnType<(typeof recoveryActions)[keyof typeof recoveryActions]>;

const submit = (word: string) => () => {
    TrezorConnect.uiResponse({ type: UI_RESPONSE.RECEIVE_WORD, payload: word });
};

const checkSeed =
    () => async (dispatch: Dispatch, getState: GetState, extra: ExtraDependencies) => {
        const { advancedRecovery, wordsCount } = getState().recovery;
        const device = selectSelectedDevice(getState());

        if (!device?.features) return;

        dispatch(recoveryActions.setError(undefined));

        if (device.features.internal_model === DeviceModelInternal.T1B1) {
            dispatch(recoveryActions.setStatus('waiting-for-confirmation'));
        } else {
            dispatch(recoveryActions.setStatus('in-progress'));
        }

        const response = await TrezorConnect.recoveryDevice({
            type: device.features.recovery_type ?? 'DryRun', // For old firmware, we assume DryRun as it was the only option before
            input_method: advancedRecovery
                ? PROTO.RecoveryDeviceInputMethod.Matrix
                : PROTO.RecoveryDeviceInputMethod.ScrambledWords,
            word_count: wordsCount,
            enforce_wordlist: true,
            device: {
                path: device.path,
            },
        });

        if (!response.success) {
            dispatch(recoveryActions.setError(response.error.message));
            asTypedDesktopAnalytics(extra.services.analytics).report({
                type: events.settingsDeviceCheckSeedEvent.name,
                payload: {
                    status: 'error',
                    error: response.error.code,
                },
            });
        } else {
            asTypedDesktopAnalytics(extra.services.analytics).report({
                type: events.settingsDeviceCheckSeedEvent.name,
                payload: {
                    status: 'finished',
                },
            });
        }

        dispatch(recoveryActions.setStatus('finished'));
    };

const recoverDevice = () => async (dispatch: Dispatch, getState: GetState) => {
    const { advancedRecovery, wordsCount } = getState().recovery;
    const device = selectSelectedDevice(getState());

    if (!device?.features) {
        return;
    }
    dispatch(recoveryActions.setError(undefined));

    if (device.features.internal_model === DeviceModelInternal.T1B1) {
        dispatch(recoveryActions.setStatus('waiting-for-confirmation'));
    } else {
        dispatch(recoveryActions.setStatus('in-progress'));
    }

    const params: RecoveryDevice = {
        type: device.features.recovery_type ?? 'NormalRecovery', // For old firmware, we assume NormalRecovery as it was the only option before
        input_method: advancedRecovery
            ? PROTO.RecoveryDeviceInputMethod.Matrix
            : PROTO.RecoveryDeviceInputMethod.ScrambledWords,
        word_count: wordsCount,
        passphrase_protection: DEFAULT_PASSPHRASE_PROTECTION,
        enforce_wordlist: true,
    };

    if (device.features.capabilities?.includes('Capability_U2F')) {
        params.u2f_counter = Math.floor(Date.now() / 1000);
    }

    const response = await TrezorConnect.recoveryDevice({
        ...params,
        device: {
            path: device.path,
        },
    });

    if (!response.success) {
        dispatch(recoveryActions.setError(response.error.message));
    }

    dispatch(recoveryActions.setStatus('finished'));
};

// Recovery mode is persistent on T2T1. This means that device stays in recovery mode even after reconnecting.
// In such case, we need to call again the call that brought device into recovery mode (either proper recovery
// or seed check). This way, communication is renewed and host starts receiving messages from device again.
const rerun = () => async (dispatch: Dispatch, getState: GetState) => {
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
        dispatch(recoverDevice());
    }

    if (features.initialized) {
        dispatch(routerActions.goto('recovery-index'));
        dispatch(checkSeed());
    }
};

export { submit, checkSeed, recoverDevice, rerun };
