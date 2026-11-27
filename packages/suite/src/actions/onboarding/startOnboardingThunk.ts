import { type DesktopAnalyticsDep, events } from '@suite/analytics';
import { type LocksRootState, selectLocks } from '@suite/locks';
import { type ModalRootState, selectHasActiveModal } from '@suite/modal';
import { type RecoveryRootState, selectRecoveryStatus } from '@suite/recovery';
import { type GotoThunkDeps, type GotoThunkState, gotoThunk, selectRouterApp } from '@suite/router';
import { type DeviceRootState, selectSelectedDevice } from '@suite-common/device';
import {
    type PersistentDeviceDataRootState,
    selectDeviceNeedsManualCheck,
} from '@suite-common/persistent-device-data';
import { DeviceModelInternal } from '@trezor/device-utils';
import { type WithServices, createThunk } from '@trezor/redux-utils';

import {
    enableOnboardingReducer,
    goToStep,
    resetOnboarding,
    updateAnalytics,
} from '#src/actions/onboarding/onboardingActions';
import * as STEP from '#src/constants/onboarding/steps';
import { selectIsOnboardingActive } from '#src/reducers/onboarding/onboardingReducer';
import { type OnboardingRootState } from '#src/reducers/onboarding/onboardingState';

// gotoThunk releases foreground router locks; device prompts and modals still block entry.
export const selectCanStartOnboarding = (state: LocksRootState & ModalRootState) =>
    selectLocks(state).ui === 0 && !selectHasActiveModal(state);

export type StartOnboardingThunkState = GotoThunkState &
    DeviceRootState &
    PersistentDeviceDataRootState &
    OnboardingRootState &
    RecoveryRootState;

export type StartOnboardingThunkDeps = GotoThunkDeps & WithServices<DesktopAnalyticsDep>;

export type StartOnboardingParams = {
    shouldRestart?: boolean;
};

export const startOnboardingThunk = createThunk<
    void,
    StartOnboardingParams | undefined,
    { state: StartOnboardingThunkState; extra: StartOnboardingThunkDeps }
>('@suite/onboarding/start', ({ shouldRestart = false } = {}, { dispatch, getState, extra }) => {
    const device = selectSelectedDevice(getState());
    const isOnboardingRoute = selectRouterApp(getState()) === 'onboarding';
    if (
        !device?.features ||
        (device.features.initialized && !isOnboardingRoute) ||
        (isOnboardingRoute && selectIsOnboardingActive(getState()) && !shouldRestart) ||
        !selectCanStartOnboarding(getState())
    ) {
        return;
    }

    if (device.features.initialized) {
        dispatch(gotoThunk({ routeName: 'suite-index' }));
        if (selectRouterApp(getState()) !== 'onboarding') {
            dispatch(resetOnboarding());
        }

        return;
    }

    if (!isOnboardingRoute) {
        dispatch(gotoThunk({ routeName: 'onboarding-index' }));
        if (selectRouterApp(getState()) !== 'onboarding') return;
    }

    // Recovery middleware owns its timing and resume data.
    const isRecoveryInProgress = selectRecoveryStatus(getState()) === 'in-progress';
    if (shouldRestart || !isRecoveryInProgress) {
        dispatch(resetOnboarding());
    }
    dispatch(enableOnboardingReducer(true));

    const initialStepId = selectDeviceNeedsManualCheck(getState(), device)
        ? STEP.ID_SECURITY_CHECK_STEP
        : STEP.ID_FIRMWARE_STEP;
    dispatch(goToStep(initialStepId));
    if (!isRecoveryInProgress || shouldRestart) {
        dispatch(updateAnalytics({ startTime: Date.now() }));

        extra.services.analytics.report(
            {
                type: events.deviceSetupStartedEvent.name,
                payload: {
                    deviceModel: device.features.internal_model ?? DeviceModelInternal.UNKNOWN,
                },
            },
            { force: true },
        );
    }
});
