import { type MiddlewareAPI } from 'redux';

import { isRecoveryInProgress, recoveryActions, selectRecoveryStatus } from '@suite/recovery';
import { routerAppChanged } from '@suite/router';
import { deviceActions, selectSelectedDevice } from '@suite-common/device';
import { firmwareActions } from '@suite-common/firmware';
import { forgetDisconnectedDevices } from '@suite-common/wallet-core';
import { type PROTO, UI_REQUEST } from '@trezor/connect';

import * as onboardingActions from 'src/actions/onboarding/onboardingActions';
import { type Action, type AppState, type Dispatch } from 'src/types/suite';

const onboardingMiddleware =
    (api: MiddlewareAPI<Dispatch, AppState>) =>
    (next: Dispatch) =>
    (action: Action): Action => {
        const isFwInstallationDone =
            firmwareActions.setStatus.match(action) && action.payload === 'done';

        const { firmware, onboarding } = api.getState();

        if (isFwInstallationDone && onboarding.isActive && firmware.status === 'thp-pairing') {
            // After the THP pairing is finished we want to jump to the next step automatically.
            // User already drifted away from the installation flow and is not aware that THP is actually in the middle
            // of the Firmware installation.
            api.dispatch(onboardingActions.goToNextStep());
            api.dispatch(firmwareActions.resetReducer());
        } else {
            // pass action
            next(action);
        }

        // seed is wiped when switching firmware type so we need to forget all device instances as well
        if (action.type === UI_REQUEST.FIRMWARE_TYPE_CHANGED) {
            api.dispatch(
                forgetDisconnectedDevices({
                    device: firmware.cachedDevice || action.payload.device,
                    forceForget: true,
                }),
            );
        }

        if (action.type === routerAppChanged.type) {
            // here middleware detects that onboarding app is loaded, do following:
            //  1. make reducer to accept actions (enableReducer) and apply changes
            if (action.payload === 'onboarding') {
                api.dispatch(onboardingActions.enableOnboardingReducer(true));
            }
        }

        // Resume an interrupted recovery when the device reports it is mid-recovery. The addButtonRequest
        // trigger is load-bearing for a mid-recovery reload: the router resets the recovery reducer to
        // 'initial' (suiteMiddleware), so the device's next button request must re-initialize it —
        // previously implicit via an updateSelectedDevice re-broadcast when button requests lived on the
        // device object.
        const resumeRecoveryIfInProgress = (features: PROTO.Features | undefined) => {
            if (
                features === undefined ||
                !isRecoveryInProgress(features) ||
                selectRecoveryStatus(api.getState()) === 'in-progress'
            ) {
                return;
            }
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
        };

        if (deviceActions.updateSelectedDevice.match(action)) {
            resumeRecoveryIfInProgress(action.payload?.features);
        }
        if (deviceActions.addButtonRequest.match(action)) {
            // During a recovery the recovering device is the selected one; the guard makes it a no-op
            // otherwise, so reading the selected device's features is fine.
            resumeRecoveryIfInProgress(selectSelectedDevice(api.getState())?.features);
        }

        return action;
    };

export default onboardingMiddleware;
