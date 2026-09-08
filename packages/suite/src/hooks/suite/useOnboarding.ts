import { useMemo } from 'react';

import { type OnboardingAnalytics } from '@suite/analytics';
import { selectModal } from '@suite/modal';
import { useServices } from '@suite-common/dependency-injection';
import { selectDispatch } from '@suite-common/redux-utils';
import { type BackupType } from '@suite-common/suite-types';
import { UI_REQUESTS } from '@trezor/connect';

import * as onboardingActions from 'src/actions/onboarding/onboardingActions';
import { type GoToSuiteOptions } from 'src/actions/onboarding/onboardingActions';
import { useSelector } from 'src/hooks/suite';
import {
    selectOnboardedDevice,
    selectOnboarding,
} from 'src/selectors/onboarding/onboardingSelectors';
import { type AnyPath, type AnyStepId, type BackupMedium } from 'src/types/onboarding';

import { parseStepId } from '../../utils/onboarding/steps';

export const useOnboarding = () => {
    const { dispatch } = useServices(selectDispatch);

    const onboarding = useSelector(selectOnboarding);
    // The device onboarding is pinned to. Passed into every step decision so none of them has to
    // ask which device happens to be selected — onboarding wipes and re-initialises the device, so
    // the selection drifts while it reboots.
    const onboardedDevice = useSelector(selectOnboardedDevice);
    const modal = useSelector(selectModal);

    const showPinMatrix =
        modal.context === '@modal/context-device' && modal.windowType === UI_REQUESTS.REQUEST_PIN;

    const actions = useMemo(
        () => ({
            goToStep: (stepId: AnyStepId) => dispatch(onboardingActions.goToStep(stepId)),
            goToNextStep: (stepId?: AnyStepId) =>
                dispatch(onboardingActions.goToNextStepThunk(onboardedDevice, stepId)),
            goToPreviousStep: () =>
                dispatch(onboardingActions.goToPreviousStepThunk(onboardedDevice)),
            resetOnboarding: () => dispatch(onboardingActions.resetOnboarding()),
            enableOnboardingReducer: (enabled: boolean) =>
                dispatch(onboardingActions.enableOnboardingReducer(enabled)),
            rerun: () => dispatch(onboardingActions.rerunRecoveryThunk(onboardedDevice)),
            updateAnalytics: (payload: Partial<OnboardingAnalytics>) =>
                dispatch(onboardingActions.updateAnalytics(payload)),
            addPath: (payload: AnyPath) => dispatch(onboardingActions.addPath(payload)),
            updateBackupType: (payload: BackupType) =>
                dispatch(onboardingActions.updateBackupType(payload)),
            updateBackupMedium: (payload: BackupMedium) =>
                dispatch(onboardingActions.updateBackupMedium(payload)),
            goToSuite: (options?: GoToSuiteOptions) =>
                dispatch(onboardingActions.goToSuiteThunk(onboardedDevice, options)),
            resolveNextAfterSkipped: (requestedStepId: AnyStepId) =>
                dispatch(
                    onboardingActions.resolveNextAfterSkippedThunk(
                        onboardedDevice,
                        requestedStepId,
                    ),
                ),
        }),
        [dispatch, onboardedDevice],
    );

    const { activeStepId } = onboarding;
    const { activeStep, activeStepCategory } = useMemo(
        () => parseStepId(activeStepId),
        [activeStepId],
    );

    return {
        ...onboarding,
        ...actions,
        onboardedDevice,
        activeStep,
        activeStepCategory,
        showPinMatrix,
    };
};
