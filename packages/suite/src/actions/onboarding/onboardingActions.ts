import { type Dispatch, type UnknownAction, createAction } from '@reduxjs/toolkit';
import { type ThunkDispatch } from 'redux-thunk';

import { type DesktopAnalyticsDep, type OnboardingAnalytics, events } from '@suite/analytics';
import { initialRunCompletedThunk } from '@suite/flags';
import { closeModal } from '@suite/modal';
import { type RecoveryState, recoveryRerunForDeviceThunk } from '@suite/recovery';
import {
    type GotoThunkState,
    type SuiteRouterHistoryDep,
    closeModalAppThunk,
    gotoThunk,
    selectRouterApp,
} from '@suite/router';
import { type SuiteSettingsRootState } from '@suite/settings';
import {
    selectIsDeviceAuthenticityCheckEnabled,
    selectIsUnlockedBootloaderAllowed,
} from '@suite/settings';
import {
    type DeviceRootState,
    getIsOnlyDeviceRefCandidate,
    selectConnectedDevices,
    selectDeviceThunk,
    selectHasBitcoinOnlyFirmware,
} from '@suite-common/device';
import { type WithServices } from '@suite-common/redux-utils';
import { type BackupType, type TrezorDevice } from '@suite-common/suite-types';
import {
    type StartDiscoveryThunkDeps,
    type StartDiscoveryThunkState,
    type WalletSettingsRootState,
    changeCoinVisibilityThunk,
    selectEnabledNetworks,
    startDiscoveryThunk,
} from '@suite-common/wallet-core';
import TrezorConnect, { type Device } from '@trezor/connect';

import { ONBOARDING } from 'src/actions/onboarding/constants';
import { stepCategories } from 'src/config/onboarding/steps';
import * as STEP from 'src/constants/onboarding/steps';
import { type OnboardingRootState } from 'src/reducers/onboarding/onboardingReducer';
import {
    selectOnboardedDeviceRef,
    selectOnboardingActiveStepId,
    selectOnboardingAnalytics,
    selectOnboardingPath,
} from 'src/selectors/onboarding/onboardingSelectors';
import { type AnyPath, type AnyStepId, type BackupMedium } from 'src/types/onboarding';
import {
    findNextStep,
    findPrevStep,
    isStepUsed,
    resolveNextAvailableStep,
} from 'src/utils/onboarding/steps';

const goToStep = createAction<AnyStepId>(ONBOARDING.SET_STEP_ACTIVE);

const addPath = createAction<AnyPath>(ONBOARDING.ADD_PATH);

const removePath = createAction<AnyPath[]>(ONBOARDING.REMOVE_PATH);

/**
 * Pins onboarding to one physical device, so every step addresses that device rather than
 * whichever one happens to be selected. See `selectOnboardedDevice`.
 */
const armOnboardedDeviceTracking = createAction<Device | TrezorDevice>(
    ONBOARDING.ARM_DEVICE_TRACKING,
);

const onboardedDeviceConnected = createAction<{ device: Device; isOnlyCandidate: boolean }>(
    ONBOARDING.DEVICE_CONNECTED,
);

const onboardedDeviceDisconnected = createAction<Device>(ONBOARDING.DEVICE_DISCONNECTED);

type HandleOnboardedDeviceConnectThunkState = DeviceRootState & OnboardingRootState;

/**
 * Feeds a connect device event into the tracking state machine, so the ref keeps pointing at the
 * onboarded device after it comes back with a new path and a freshly generated `device_id`.
 *
 * The ambiguity guard needs to know what else is plugged in, and that lives in the store, so it is
 * resolved here rather than by the caller. Disconnect needs nothing from the store and stays a
 * plain action.
 */
const handleOnboardedDeviceConnectThunk =
    (device: Device) =>
    (dispatch: Dispatch<UnknownAction>, getState: () => HandleOnboardedDeviceConnectThunkState) => {
        const ref = selectOnboardedDeviceRef(getState());

        if (!ref) {
            return;
        }

        dispatch(
            onboardedDeviceConnected({
                device,
                isOnlyCandidate: getIsOnlyDeviceRefCandidate({
                    device,
                    connectedDevices: selectConnectedDevices(getState()),
                    ref,
                }),
            }),
        );
    };

type GetAllStepsInPathState = DeviceRootState & OnboardingRootState & SuiteSettingsRootState;

const getAllStepsInPath = (
    getState: () => GetAllStepsInPathState,
    onboardedDevice: TrezorDevice | undefined,
) => {
    const allSteps = stepCategories.flatMap(({ steps }) => steps);

    const isStepUsedProps = {
        device: onboardedDevice,
        onboardingPath: selectOnboardingPath(getState()),
        isDeviceAuthenticityCheckEnabled: selectIsDeviceAuthenticityCheckEnabled(getState()),
        isUnlockedBootloaderAllowed: selectIsUnlockedBootloaderAllowed(getState()),
    };

    return allSteps.filter(step => isStepUsed(step, isStepUsedProps));
};

type GoToPreviousStepThunkState = DeviceRootState & OnboardingRootState & SuiteSettingsRootState;

const goToPreviousStepThunk =
    (onboardedDevice: TrezorDevice | undefined, stepId?: AnyStepId) =>
    (dispatch: Dispatch<UnknownAction>, getState: () => GoToPreviousStepThunkState) => {
        if (stepId) {
            return dispatch(goToStep(stepId));
        }
        const stepsInPath = getAllStepsInPath(getState, onboardedDevice);
        const prevStep = findPrevStep(selectOnboardingActiveStepId(getState()), stepsInPath);

        if (!prevStep) {
            return;
        }

        // steps listed in case statements contain path decisions, so we need
        // to remove saved paths from reducers to let user change it again.
        switch (prevStep.id) {
            case STEP.ID_CREATE_OR_RECOVER:
                dispatch(removePath([STEP.PATH_CREATE, STEP.PATH_RECOVERY]));
                break;
            default:
            // nothing
        }

        dispatch(goToStep(prevStep.id));
    };

const resetOnboarding = createAction(ONBOARDING.RESET_ONBOARDING);

type GoToSuiteThunkState = DeviceRootState &
    GotoThunkState &
    OnboardingRootState &
    StartDiscoveryThunkState &
    WalletSettingsRootState;

type GoToSuiteThunkDeps = WithServices<DesktopAnalyticsDep & SuiteRouterHistoryDep> &
    StartDiscoveryThunkDeps;

export type GoToSuiteOptions = {
    skipDeviceSetupCompletedEvent?: boolean;
};

const goToSuiteThunk =
    (
        onboardedDevice: TrezorDevice | undefined,
        { skipDeviceSetupCompletedEvent }: GoToSuiteOptions = {},
    ) =>
    (
        dispatch: ThunkDispatch<GoToSuiteThunkState, GoToSuiteThunkDeps, UnknownAction>,
        getState: () => GoToSuiteThunkState,
        extra: GoToSuiteThunkDeps,
    ) => {
        const device = onboardedDevice;
        const onboardingAnalytics = selectOnboardingAnalytics(getState());
        // Clear modals that might block navigation. They aren't relevant anyway, as there is no <ModalSwitcher /> in onboarding.
        // After device interaction, Connect sends UI_EVENTS.CLOSE_UI_WINDOW to close any open modal. On Web this is
        // instant, so nothing blocks navigation, but on Desktop there is delay, so we must clear the modal manually to
        // ensure navigation to 'suite-index'. Particularly, setting PIN leaves ButtonRequest_Success hanging for a moment.
        dispatch(closeModal());

        // A non-empty onboarding path means the user went through a create or recovery flow, i.e. set up
        // a device from scratch. Pairing an already set up device leaves the path empty.
        const isFreshDeviceSetup = selectOnboardingPath(getState()).length > 0;

        dispatch(initialRunCompletedThunk({ isFreshDeviceSetup }));
        dispatch(resetOnboarding());
        dispatch(closeModalAppThunk(true));

        // For Bitcoin-only firmware, pre-activate BTC so the user lands on a populated dashboard
        // instead of the empty "activate assets" state. Only do this on initial setup, when no
        // networks have been explicitly enabled yet, to avoid overriding user's previous choices.
        const isBitcoinOnlyFirmware = selectHasBitcoinOnlyFirmware(getState());
        const enabledNetworks = selectEnabledNetworks(getState());
        if (isBitcoinOnlyFirmware && enabledNetworks.length === 0) {
            dispatch(changeCoinVisibilityThunk({ symbol: 'btc', shouldBeVisible: true }));
        }

        // there must be a device to progress with onboarding
        if (device?.features === undefined) return;

        // Handing over to Suite is where the onboarded device becomes the selected one. Onboarding
        // itself addresses it through the ref, so this is the only point that needs the selection
        // to be right — in particular the firmware update does not have to have restored it.
        dispatch(selectDeviceThunk({ device }));
        dispatch(startDiscoveryThunk({ device }));
        const reportAnalytics = () => {
            const { analytics } = extra.services;
            const { startTime, ...onboardingAttributes } = onboardingAnalytics;
            const fullPayload = {
                ...onboardingAttributes,
                duration: Date.now() - startTime!,
                device: device.features.internal_model,
                unitPackaging: device.features.unit_packaging ?? 0,
            };

            const hasConsent = analytics.isEnabled();
            const payload = hasConsent
                ? fullPayload
                : {
                      duration: fullPayload.duration,
                      device: fullPayload.device,
                      unitPackaging: fullPayload.unitPackaging,
                  };

            analytics.report(
                {
                    type: events.deviceSetupCompletedEvent.name,
                    payload,
                },
                { force: true },
            );
        };

        // Skipped when "Yes, I have used it before" is pressed on the security check page, as no
        // setup happens on that flow.
        if (!skipDeviceSetupCompletedEvent) {
            reportAnalytics();
        }
    };

type GoToNextStepThunkState = DeviceRootState &
    GotoThunkState &
    OnboardingRootState &
    StartDiscoveryThunkState &
    SuiteSettingsRootState &
    WalletSettingsRootState;

type GoToNextStepThunkDeps = {
    services: DesktopAnalyticsDep & SuiteRouterHistoryDep;
} & StartDiscoveryThunkDeps;

const goToNextStepThunk =
    (onboardedDevice: TrezorDevice | undefined, nextStepId?: AnyStepId) =>
    (
        dispatch: ThunkDispatch<GoToNextStepThunkState, GoToNextStepThunkDeps, UnknownAction>,
        getState: () => GoToNextStepThunkState,
    ) => {
        if (nextStepId) {
            return dispatch(goToStep(nextStepId));
        }
        const stepsInPath = getAllStepsInPath(getState, onboardedDevice);
        const nextStep = findNextStep(
            selectOnboardingActiveStepId(getState()),
            stepsInPath,
            onboardedDevice ?? null,
        );
        // we are at last step, so go to Suite
        if (nextStep === null) {
            dispatch(goToSuiteThunk(onboardedDevice));

            return;
        }
        dispatch(goToStep(nextStep.id));
    };

const enableOnboardingReducer = createAction<boolean>(ONBOARDING.ENABLE_ONBOARDING_REDUCER);

const updateAnalytics = createAction<Partial<OnboardingAnalytics>>(ONBOARDING.ANALYTICS);

const updateBackupType = createAction<BackupType>(ONBOARDING.SELECT_BACKUP_TYPE);

const updateBackupMedium = createAction<BackupMedium>(ONBOARDING.SELECT_BACKUP_MEDIUM);

type BeginOnboardingTutorialThunkState = DeviceRootState &
    GotoThunkState &
    OnboardingRootState &
    StartDiscoveryThunkState &
    SuiteSettingsRootState &
    WalletSettingsRootState;

type BeginOnboardingTutorialThunkDeps = {
    services: DesktopAnalyticsDep & SuiteRouterHistoryDep;
} & StartDiscoveryThunkDeps;

const beginOnboardingTutorialThunk =
    (onboardedDevice: TrezorDevice | undefined) =>
    async (
        dispatch: ThunkDispatch<
            BeginOnboardingTutorialThunkState,
            BeginOnboardingTutorialThunkDeps,
            UnknownAction
        >,
    ) => {
        if (!onboardedDevice) return;

        await TrezorConnect.showDeviceTutorial({ device: onboardedDevice });
        dispatch(goToNextStepThunk(onboardedDevice));
    };

type ResolveNextAfterSkippedThunkState = DeviceRootState &
    OnboardingRootState &
    SuiteSettingsRootState;

const resolveNextAfterSkippedThunk =
    (onboardedDevice: TrezorDevice | undefined, skippedToStepId: AnyStepId) =>
    (_dispatch: Dispatch<UnknownAction>, getState: () => ResolveNextAfterSkippedThunkState) => {
        const stepsInPath = getAllStepsInPath(getState, onboardedDevice);
        const resolvedNextStep = resolveNextAvailableStep(
            skippedToStepId,
            stepsInPath,
            onboardedDevice ?? null,
        );

        return resolvedNextStep?.id;
    };

type RerunRecoveryThunkState = DeviceRootState & GotoThunkState & { recovery: RecoveryState };

type RerunRecoveryThunkDeps = { services: DesktopAnalyticsDep & SuiteRouterHistoryDep };

const rerunRecoveryThunk =
    (onboardedDevice: TrezorDevice | undefined) =>
    async (
        dispatch: ThunkDispatch<RerunRecoveryThunkState, RerunRecoveryThunkDeps, UnknownAction>,
        getState: () => RerunRecoveryThunkState,
    ) => {
        const result = await dispatch(recoveryRerunForDeviceThunk({ device: onboardedDevice }));

        if (!recoveryRerunForDeviceThunk.fulfilled.match(result)) {
            return;
        }

        const { initialized } = result.payload;
        if (initialized) {
            dispatch(gotoThunk({ routeName: 'recovery-index' }));
        } else {
            if (selectRouterApp(getState()) !== 'onboarding') {
                dispatch(gotoThunk({ routeName: 'onboarding-index' }));
            }
            dispatch(goToStep('recovery'));
            dispatch(addPath('recovery'));
        }
    };

export {
    armOnboardedDeviceTracking,
    handleOnboardedDeviceConnectThunk,
    onboardedDeviceConnected,
    onboardedDeviceDisconnected,
    enableOnboardingReducer,
    goToNextStepThunk,
    goToStep,
    goToPreviousStepThunk,
    addPath,
    removePath,
    resetOnboarding,
    goToSuiteThunk,
    updateAnalytics,
    beginOnboardingTutorialThunk,
    updateBackupType,
    updateBackupMedium,
    resolveNextAfterSkippedThunk,
    rerunRecoveryThunk,
};
