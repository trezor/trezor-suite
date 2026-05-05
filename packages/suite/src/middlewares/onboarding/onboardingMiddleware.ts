import { type MiddlewareAPI } from 'redux';

import { isRecoveryInProgress, recoveryActions, selectRecoveryStatus } from '@suite/recovery';
import { routerAppChanged } from '@suite/router';
import { deviceActions } from '@suite-common/device';
import { firmwareActions } from '@suite-common/firmware';

import * as onboardingActions from 'src/actions/onboarding/onboardingActions';
import { type Action, type AppState, type Dispatch } from 'src/types/suite';

const onboardingMiddleware =
    (api: MiddlewareAPI<Dispatch, AppState>) =>
    (next: Dispatch) =>
    (action: Action): Action => {
        const isFwInstallationDone =
            firmwareActions.setStatus.match(action) && action.payload === 'done';
        const isOnboardingActive = api.getState().onboarding.isActive;
        const doesDeviceNeedPairing = api.getState().firmware.status === 'thp-pairing';

        // Firmware installation finished = it is not a device that just connected with FW already install, we can
        // consider it known and skip the "Firmware already installed, have you used this device before?" modal.
        if (isFwInstallationDone && isOnboardingActive) {
            const device = api.getState().device.selectedDevice;
            api.dispatch(deviceActions.setManualDeviceCheckSuccess({ deviceId: device?.id }));
        }

        if (isFwInstallationDone && isOnboardingActive && doesDeviceNeedPairing) {
            // After the THP pairing is finished we want to jump to the next step automatically.
            // User already drifted away from the installation flow and is not aware that THP is actually in the middle
            // of the Firmware installation.
            api.dispatch(onboardingActions.goToNextStep());
            api.dispatch(firmwareActions.resetReducer());
        } else {
            // pass action
            next(action);
        }

        if (action.type === routerAppChanged.type) {
            // here middleware detects that onboarding app is loaded, do following:
            //  1. make reducer to accept actions (enableReducer) and apply changes
            if (action.payload === 'onboarding') {
                api.dispatch(onboardingActions.enableOnboardingReducer(true));
            }
        }

        if (
            deviceActions.updateSelectedDevice.match(action) &&
            action.payload?.features !== undefined &&
            isRecoveryInProgress(action.payload?.features) &&
            selectRecoveryStatus(api.getState()) !== 'in-progress'
        ) {
            api.dispatch(
                onboardingActions.updateAnalytics({
                    startTime: Date.now(),
                    seed: 'recovery-in-progress',
                }),
            );
            if (!api.getState().analytics.confirmed) {
                // If you connect T2T1 in recovery mode to fresh Suite, you should see analytics opt-out option first.
                api.dispatch(recoveryActions.setStatus('in-progress'));
            } else {
                api.dispatch(onboardingActions.recoveryRerun());
            }
        }

        return action;
    };

export default onboardingMiddleware;
