import { type Dispatch, type UnknownAction, createAction } from '@reduxjs/toolkit';
import { type ThunkDispatch } from 'redux-thunk';

import { type DesktopAnalyticsDep, type OnboardingAnalytics, events } from '@suite/analytics';
import { initialRunCompleted } from '@suite/flags';
import { closeModal } from '@suite/modal';
import { type RecoveryState, recoveryRerunThunk } from '@suite/recovery';
import {
    type GotoThunkState,
    type SuiteRouterHistoryDep,
    closeModalApp,
    goto,
} from '@suite/router';
import { type SuiteSettingsRootState } from '@suite/settings';
import {
    selectIsDeviceAuthenticityCheckEnabled,
    selectIsUnlockedBootloaderAllowed,
} from '@suite/settings';
import {
    type DeviceRootState,
    selectHasBitcoinOnlyFirmware,
    selectSelectedDevice,
} from '@suite-common/device';
import { type WithServices } from '@suite-common/redux-utils';
import { type BackupType } from '@suite-common/suite-types';
import {
    type StartDiscoveryThunkDeps,
    type StartDiscoveryThunkState,
    type WalletSettingsRootState,
    changeCoinVisibility,
    selectEnabledNetworks,
    startDiscoveryThunk,
} from '@suite-common/wallet-core';
import TrezorConnect from '@trezor/connect';

import { ONBOARDING } from 'src/actions/onboarding/constants';
import { stepCategories } from 'src/config/onboarding/steps';
import * as STEP from 'src/constants/onboarding/steps';
import { type OnboardingRootState } from 'src/reducers/onboarding/onboardingReducer';
import { selectOnboardingAnalytics } from 'src/selectors/onboarding/onboardingSelectors';
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

type GetAllStepsInPathState = DeviceRootState & OnboardingRootState & SuiteSettingsRootState;

const getAllStepsInPath = (getState: () => GetAllStepsInPathState) => {
    const allSteps = stepCategories.flatMap(({ steps }) => steps);

    const isStepUsedProps = {
        device: selectSelectedDevice(getState()),
        onboardingPath: getState().onboarding.path,
        isDeviceAuthenticityCheckEnabled: selectIsDeviceAuthenticityCheckEnabled(getState()),
        isUnlockedBootloaderAllowed: selectIsUnlockedBootloaderAllowed(getState()),
    };

    return allSteps.filter(step => isStepUsed(step, isStepUsedProps));
};

type GoToPreviousStepThunkState = DeviceRootState & OnboardingRootState & SuiteSettingsRootState;

const goToPreviousStep =
    (stepId?: AnyStepId) =>
    (dispatch: Dispatch<UnknownAction>, getState: () => GoToPreviousStepThunkState) => {
        if (stepId) {
            return dispatch(goToStep(stepId));
        }
        const stepsInPath = getAllStepsInPath(getState);
        const prevStep = findPrevStep(getState().onboarding.activeStepId, stepsInPath);

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

const goToSuite =
    ({ skipDeviceSetupCompletedEvent }: GoToSuiteOptions = {}) =>
    (
        dispatch: ThunkDispatch<GoToSuiteThunkState, GoToSuiteThunkDeps, UnknownAction>,
        getState: () => GoToSuiteThunkState,
        extra: GoToSuiteThunkDeps,
    ) => {
        const device = selectSelectedDevice(getState());
        const onboardingAnalytics = selectOnboardingAnalytics(getState());
        // Clear modals that might block navigation. They aren't relevant anyway, as there is no <ModalSwitcher /> in onboarding.
        // After device interaction, Connect sends UI_REQUEST.CLOSE_UI_WINDOW to close any open modal. On Web this is
        // instant, so nothing blocks navigation, but on Desktop there is delay, so we must clear the modal manually to
        // ensure navigation to 'suite-index'. Particularly, setting PIN leaves ButtonRequest_Success hanging for a moment.
        dispatch(closeModal());

        // A non-empty onboarding path means the user went through a create or recovery flow, i.e. set up
        // a device from scratch. Pairing an already set up device leaves the path empty.
        const isFreshDeviceSetup = getState().onboarding.path.length > 0;

        dispatch(initialRunCompleted({ isFreshDeviceSetup }));
        dispatch(resetOnboarding());
        dispatch(closeModalApp(true));

        // For Bitcoin-only firmware, pre-activate BTC so the user lands on a populated dashboard
        // instead of the empty "activate assets" state. Only do this on initial setup, when no
        // networks have been explicitly enabled yet, to avoid overriding user's previous choices.
        const isBitcoinOnlyFirmware = selectHasBitcoinOnlyFirmware(getState());
        const enabledNetworks = selectEnabledNetworks(getState());
        if (isBitcoinOnlyFirmware && enabledNetworks.length === 0) {
            dispatch(changeCoinVisibility({ symbol: 'btc', shouldBeVisible: true }));
        }

        // there must be a device to progress with onboarding
        if (device?.features === undefined) return;

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

const goToNextStep =
    (nextStepId?: AnyStepId) =>
    (
        dispatch: ThunkDispatch<GoToNextStepThunkState, GoToNextStepThunkDeps, UnknownAction>,
        getState: () => GoToNextStepThunkState,
    ) => {
        if (nextStepId) {
            return dispatch(goToStep(nextStepId));
        }
        const device = selectSelectedDevice(getState());
        const stepsInPath = getAllStepsInPath(getState);
        const nextStep = findNextStep(
            getState().onboarding.activeStepId,
            stepsInPath,
            device ?? null,
        );
        // we are at last step, so go to Suite
        if (nextStep === null) {
            dispatch(goToSuite());

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

const beginOnboardingTutorial =
    () =>
    async (
        dispatch: ThunkDispatch<
            BeginOnboardingTutorialThunkState,
            BeginOnboardingTutorialThunkDeps,
            UnknownAction
        >,
        getState: () => BeginOnboardingTutorialThunkState,
    ) => {
        const device = selectSelectedDevice(getState());
        if (!device) return;

        await TrezorConnect.showDeviceTutorial({ device });
        dispatch(goToNextStep());
    };

type ResolveNextAfterSkippedThunkState = DeviceRootState &
    OnboardingRootState &
    SuiteSettingsRootState;

const resolveNextAfterSkipped =
    (skippedToStepId: AnyStepId) =>
    (_dispatch: Dispatch<UnknownAction>, getState: () => ResolveNextAfterSkippedThunkState) => {
        const device = selectSelectedDevice(getState());
        const stepsInPath = getAllStepsInPath(getState);
        const resolvedNextStep = resolveNextAvailableStep(
            skippedToStepId,
            stepsInPath,
            device ?? null,
        );

        return resolvedNextStep?.id;
    };

type RecoveryRerunThunkState = DeviceRootState & GotoThunkState & { recovery: RecoveryState };

type RecoveryRerunThunkDeps = { services: DesktopAnalyticsDep & SuiteRouterHistoryDep };

const recoveryRerun =
    () =>
    async (
        dispatch: ThunkDispatch<RecoveryRerunThunkState, RecoveryRerunThunkDeps, UnknownAction>,
        getState: () => RecoveryRerunThunkState,
    ) => {
        const result = await dispatch(recoveryRerunThunk());

        if (!recoveryRerunThunk.fulfilled.match(result)) {
            return;
        }

        const { initialized } = result.payload;
        const { router } = getState();

        if (initialized) {
            dispatch(goto({ routeName: 'recovery-index' }));
        } else {
            if (router.app !== 'onboarding') {
                dispatch(goto({ routeName: 'onboarding-index' }));
            }
            dispatch(goToStep('recovery'));
            dispatch(addPath('recovery'));
        }
    };

export {
    enableOnboardingReducer,
    goToNextStep,
    goToStep,
    goToPreviousStep,
    addPath,
    removePath,
    resetOnboarding,
    goToSuite,
    updateAnalytics,
    beginOnboardingTutorial,
    updateBackupType,
    updateBackupMedium,
    resolveNextAfterSkipped,
    recoveryRerun,
};
