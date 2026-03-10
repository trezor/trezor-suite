import { OnboardingAnalytics } from '@suite/analytics';
import { BackupType } from '@suite-common/suite-types';

import * as ONBOARDING from './onboardingConstants';
import { AnyPath, AnyStepId } from './types';

export type OnboardingAction =
    | {
          type: typeof ONBOARDING.ENABLE_ONBOARDING_REDUCER;
          payload: boolean;
      }
    | {
          type: typeof ONBOARDING.RESET_ONBOARDING;
      }
    | {
          type: typeof ONBOARDING.REMOVE_PATH;
          payload: AnyPath[];
      }
    | {
          type: typeof ONBOARDING.ADD_PATH;
          payload: AnyPath;
      }
    | {
          type: typeof ONBOARDING.SET_STEP_ACTIVE;
          stepId: AnyStepId;
      }
    | {
          type: typeof ONBOARDING.ANALYTICS;
          payload: Partial<OnboardingAnalytics>;
      }
    | {
          type: typeof ONBOARDING.SELECT_BACKUP_TYPE;
          payload: BackupType;
      };

export const goToStep = (stepId: AnyStepId): OnboardingAction => ({
    type: ONBOARDING.SET_STEP_ACTIVE,
    stepId,
});

export const addPath = (payload: AnyPath): OnboardingAction => ({
    type: ONBOARDING.ADD_PATH,
    payload,
});

export const removePath = (payload: AnyPath[]): OnboardingAction => ({
    type: ONBOARDING.REMOVE_PATH,
    payload,
});

/**
 * Set onboarding reducer to initial state.
 */
export const resetOnboarding = (): OnboardingAction => ({
    type: ONBOARDING.RESET_ONBOARDING,
});

/**
 * Make onboarding reducer listen to actions.
 */
export const enableOnboardingReducer = (payload: boolean): OnboardingAction => ({
    type: ONBOARDING.ENABLE_ONBOARDING_REDUCER,
    payload,
});

export const updateAnalytics = (payload: Partial<OnboardingAnalytics>): OnboardingAction => ({
    type: ONBOARDING.ANALYTICS,
    payload,
});

export const updateBackupType = (payload: BackupType): OnboardingAction => ({
    type: ONBOARDING.SELECT_BACKUP_TYPE,
    payload,
});
