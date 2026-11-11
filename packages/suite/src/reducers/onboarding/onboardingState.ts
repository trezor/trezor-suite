import { type OnboardingAnalytics } from '@suite/analytics';
import { type BackupType } from '@suite-common/suite-types';

import type { AnyPath, AnyStepId, BackupMedium } from '#src/types/onboarding';

export interface OnboardingRootState {
    onboarding: OnboardingState;
}

export interface OnboardingState {
    backupType: BackupType;
    backupMedium: BackupMedium | null;
    isActive: boolean;
    prevDeviceId: string | null;
    activeStepId: AnyStepId;
    path: AnyPath[];
    onboardingAnalytics: Partial<OnboardingAnalytics>;
}
