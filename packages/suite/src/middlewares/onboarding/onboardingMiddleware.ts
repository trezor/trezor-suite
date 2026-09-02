import { type UnknownAction } from '@reduxjs/toolkit';
import { type MiddlewareAPI, type Dispatch as ReduxDispatch } from 'redux';

import { isRecoveryInProgress, recoveryActions, selectRecoveryStatus } from '@suite/recovery';
import { routerAppChanged } from '@suite/router';
import { deviceActions } from '@suite-common/device';
import { firmwareActions } from '@suite-common/firmware';
import { type Dispatch } from '@suite-common/redux-utils';
import { forgetDisconnectedDevices } from '@suite-common/wallet-core';
import { UI_EVENTS, isUiEventOfType } from '@trezor/connect';

import * as onboardingActions from 'src/actions/onboarding/onboardingActions';
import { type AppState } from 'src/types/suite';

const onboardingMiddleware =
    (api: MiddlewareAPI<Dispatch, AppState>) =>
    (next: ReduxDispatch<UnknownAction>) =>
    (action: UnknownAction): UnknownAction => {
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
        if (isUiEventOfType(action, UI_EVENTS.FIRMWARE_TYPE_CHANGED)) {
            api.dispatch(
                forgetDisconnectedDevices({
                    device: firmware.cachedDevice || action.payload.device,
                    forceForget: true,
                }),
            );
        }

        if (routerAppChanged.match(action)) {
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
