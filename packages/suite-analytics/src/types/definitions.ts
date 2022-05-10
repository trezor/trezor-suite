import { AppUpdateEventStatus } from '../constants';

export type OnboardingAnalytics = {
    startTime: number;
    firmware: 'install' | 'update' | 'skip' | 'up-to-date';
    seed: 'create' | 'recovery' | 'recovery-in-progress';
    seedType: 'standard' | 'shamir';
    recoveryType: 'standard' | 'advanced';
    backup: 'create' | 'skip';
    pin: 'create' | 'skip';
};

export type AppUpdateEvent = {
    fromVersion?: string;
    toVersion?: string;
    status: AppUpdateEventStatus;
    earlyAccessProgram: boolean;
    isPrerelease?: boolean;
};
