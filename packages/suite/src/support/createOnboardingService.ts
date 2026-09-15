import { isRecoveryInProgress, recoveryActions, selectRecoveryStatus } from '@suite/recovery';
import { selectIsAnalyticsConfirmed } from '@suite-common/analytics-redux';
import { firmwareActions } from '@suite-common/firmware';
import { type Dispatch } from '@suite-common/redux-utils';
import { type OnboardingService } from '@suite-common/suite-types';

import * as onboardingActions from 'src/actions/onboarding/onboardingActions';
import {
    selectIsOnboardingInProgress,
    selectOnboardedDevice,
} from 'src/selectors/onboarding/onboardingSelectors';
import { type AppState } from 'src/types/suite';

type OnboardingServiceDeps = {
    getState: () => AppState;
    dispatch: Dispatch;
};

/**
 * The desktop/web onboarding's side of `OnboardingService`.
 *
 * Everything here used to live in `onboardingMiddleware`, which reached these moments by watching
 * every action in the store. Shared code now says what happened and this decides what onboarding
 * does about it, which is also what makes the mobile flow able to answer differently.
 */
export const createOnboardingService = (deps: OnboardingServiceDeps): OnboardingService => {
    const { getState, dispatch } = deps;

    return {
        onFirmwareInstallationFinished: ({ wasThpPairing }) => {
            if (!wasThpPairing || !selectIsOnboardingInProgress(getState())) {
                return;
            }

            // THP pairing is presented as its own thing, so by the time it finishes the user has
            // drifted away from the installation flow and does not know the install was what they
            // were waiting for. Move them on rather than leaving them on a finished pairing screen.
            dispatch(onboardingActions.goToNextStepThunk(selectOnboardedDevice(getState())));
            dispatch(firmwareActions.resetReducer());
        },

        onSelectedDeviceUpdated: device => {
            if (
                device.features === undefined ||
                !isRecoveryInProgress(device.features) ||
                selectRecoveryStatus(getState()) === 'in-progress'
            ) {
                return;
            }

            dispatch(
                onboardingActions.updateAnalytics({
                    startTime: Date.now(),
                    seed: 'recovery-in-progress',
                }),
            );

            if (!selectIsAnalyticsConfirmed(getState())) {
                // If you connect T2T1 in recovery mode to fresh Suite, you should see analytics
                // opt-out option first.
                dispatch(recoveryActions.setStatus('in-progress'));

                return;
            }

            dispatch(onboardingActions.rerunRecoveryThunk());
        },
    };
};
