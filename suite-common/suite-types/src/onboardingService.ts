import type { TrezorDevice } from './device';

/**
 * The platform's onboarding, reacting to things that happen in shared code.
 *
 * Onboarding is written per platform — the desktop/web flow and the mobile flow share no steps —
 * so shared code cannot decide what a firmware installation finishing, or a device turning up
 * mid-recovery, should mean for it. It reports that the thing happened and the platform decides.
 *
 * This replaces the desktop-only `onboardingMiddleware`, which reached the same hooks by watching
 * every action flowing through the store, and which mobile therefore could never use.
 *
 * Implementations must tolerate being called when no onboarding is in progress: the events are
 * shared-code events, and most of them happen outside onboarding.
 */
export type OnboardingService = {
    /**
     * A firmware installation finished, successfully. `statusBeforeCompletion` is the flow's own
     * status just before it completed, which is how a caller tells a plain installation from one
     * that ran through THP pairing — the user has drifted away from the installation screen by
     * then and does not know the install was still going.
     */
    onFirmwareInstallationFinished: (context: { wasThpPairing: boolean }) => void;
    /**
     * The selected device's features changed. Reported raw, because deciding what is interesting
     * about them — a device that reconnected mid-recovery, say — needs the platform's own
     * recovery and analytics state.
     */
    onSelectedDeviceUpdated: (device: TrezorDevice) => void;
};

export type OnboardingServiceDep = {
    onboardingService: OnboardingService;
};

export const selectOnboardingServiceDep = (services: any): OnboardingServiceDep => ({
    onboardingService: services.onboardingService,
});
