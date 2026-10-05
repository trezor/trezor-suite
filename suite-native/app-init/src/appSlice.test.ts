import {
    PostOnboardingInitializationStatus,
    appReducer,
    appSliceInitialState,
    selectCanUseAppServices,
    selectIsAppReady,
    setIsAppReady,
    setPostOnboardingInitializationStatus,
} from './appSlice';

describe('appSlice', () => {
    it('tracks when the application shell is ready', () => {
        const state = appReducer(appSliceInitialState, setIsAppReady(true));

        expect(selectIsAppReady({ app: state })).toBe(true);
    });

    it.each([
        [PostOnboardingInitializationStatus.Idle, false],
        [PostOnboardingInitializationStatus.Initializing, false],
        [PostOnboardingInitializationStatus.Ready, true],
        [PostOnboardingInitializationStatus.Error, true],
        [PostOnboardingInitializationStatus.Disabled, false],
    ] as const)('allows wallet service calls in the %s state: %s', (status, expected) => {
        const state = appReducer(
            appSliceInitialState,
            setPostOnboardingInitializationStatus(status),
        );

        expect(selectCanUseAppServices({ app: state })).toBe(expected);
    });
});
