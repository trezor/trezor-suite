export enum PostOnboardingInitializationStatus {
    Idle = 'idle',
    Initializing = 'initializing',
    Ready = 'ready',
    Error = 'error',
    Disabled = 'disabled',
}

export type PostOnboardingInitializationResult =
    | PostOnboardingInitializationStatus.Ready
    | PostOnboardingInitializationStatus.Error
    | PostOnboardingInitializationStatus.Disabled;
