import { type UnknownAction } from '@reduxjs/toolkit';
import { type MiddlewareAPI, type Dispatch as ReduxDispatch } from 'redux';

import {
    type RecoveryRootState,
    isRecoveryInProgress,
    recoveryActions,
    selectRecoveryStatus,
} from '@suite/recovery';
import { routerAppChanged } from '@suite/router';
import { type AnalyticsRootState, selectIsAnalyticsConfirmed } from '@suite-common/analytics-redux';
import { deviceActions, selectSelectedDevice } from '@suite-common/device';
import { type FirmwareRootState, firmwareActions, selectFirmware } from '@suite-common/firmware';
import { persistentDeviceDataActions } from '@suite-common/persistent-device-data';
import { forgetDisconnectedDevicesThunk } from '@suite-common/wallet-core';
import { type PROTO, UI_EVENTS, isUiEventOfType } from '@trezor/connect';
import { type Dispatch } from '@trezor/redux-utils';

import { type GoToNextStepThunkState } from '#src/actions/onboarding/onboardingActions';
import * as onboardingActions from '#src/actions/onboarding/onboardingActions';
import { selectIsOnboardingActive } from '#src/reducers/onboarding/onboardingReducer';

type OnboardingMiddlewareState = GoToNextStepThunkState &
    RecoveryRootState &
    AnalyticsRootState &
    FirmwareRootState;

const onboardingMiddleware =
    (api: MiddlewareAPI<Dispatch, OnboardingMiddlewareState>) =>
    (next: ReduxDispatch<UnknownAction>) =>
    (action: UnknownAction): UnknownAction => {
        const isFwInstallationDone =
            firmwareActions.setStatus.match(action) && action.payload === 'done';

        const firmware = selectFirmware(api.getState());
        const isOnboardingActive = selectIsOnboardingActive(api.getState());

        // Having just installed FW, we can mark the device as known, so that Manual Device Check is not seen again.
        // A device without FW has no id, so the check confirmed before the installation couldn't be persisted then.
        // `firmware.cachedDevice` is unusable: it's a snapshot from before the installation, so its id is outdated
        // and its path changes with the reconnection during the installation. The selected device is used instead,
        // relying on the UI not allowing to select a different device while the installation is underway.
        // The logic is duplicated in suite-native/device/src/middlewares/deviceMiddleware.ts for mobile.
        if (isFwInstallationDone) {
            const deviceId = selectSelectedDevice(api.getState())?.id;
            api.dispatch(persistentDeviceDataActions.setManualDeviceCheckSuccess({ deviceId }));
        }

        if (isFwInstallationDone && isOnboardingActive && firmware.status === 'thp-pairing') {
            // After the THP pairing is finished we want to jump to the next step automatically.
            // User already drifted away from the installation flow and is not aware that THP is actually in the middle
            // of the Firmware installation.
            api.dispatch(onboardingActions.goToNextStepThunk());
            api.dispatch(firmwareActions.resetReducer());
        } else {
            // pass action
            next(action);
        }

        // seed is wiped when switching firmware type so we need to forget all device instances as well
        if (isUiEventOfType(action, UI_EVENTS.FIRMWARE_TYPE_CHANGED)) {
            api.dispatch(
                forgetDisconnectedDevicesThunk({
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

        // Resume an interrupted recovery when the device reports it is mid-recovery. After a reload the
        // router resets the recovery state, so the device's next button request has to resume it too.
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
            if (!selectIsAnalyticsConfirmed(api.getState())) {
                // If you connect T2T1 in recovery mode to fresh Suite, you should see analytics opt-out option first.
                api.dispatch(recoveryActions.setStatus('in-progress'));
            } else {
                api.dispatch(onboardingActions.rerunRecoveryThunk());
            }
        };

        if (deviceActions.updateSelectedDevice.match(action)) {
            resumeRecoveryIfInProgress(action.payload?.features);
        }
        if (deviceActions.addButtonRequest.match(action)) {
            // A call running on another device must not drive the selected device's recovery.
            const selectedDevice = selectSelectedDevice(api.getState());
            if (selectedDevice?.path === action.payload.path) {
                resumeRecoveryIfInProgress(selectedDevice.features);
            }
        }

        return action;
    };

export default onboardingMiddleware;
