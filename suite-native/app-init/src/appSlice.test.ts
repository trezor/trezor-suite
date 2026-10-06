import { applicationInitThunk, postOnboardingInitThunk } from './appInitThunks';
import {
    appReducer,
    appSliceInitialState,
    selectCanUseAppServices,
    selectIsAppReady,
} from './appSlice';
import { PostOnboardingInitializationStatus } from './appTypes';

const requestId = 'request-id';

describe('appSlice', () => {
    it('tracks when the application shell is ready', () => {
        const state = appReducer(
            appSliceInitialState,
            applicationInitThunk.fulfilled(undefined, requestId, undefined),
        );

        expect(selectIsAppReady({ app: state })).toBe(true);
    });

    it('tracks when post-onboarding initialization starts', () => {
        const state = appReducer(
            appSliceInitialState,
            postOnboardingInitThunk.pending(requestId, undefined),
        );

        expect(state.postOnboardingInitializationStatus).toBe(
            PostOnboardingInitializationStatus.Initializing,
        );
    });

    it.each([
        PostOnboardingInitializationStatus.Ready,
        PostOnboardingInitializationStatus.Disabled,
    ] as const)('tracks the fulfilled post-onboarding result: %s', status => {
        const state = appReducer(
            appSliceInitialState,
            postOnboardingInitThunk.fulfilled(status, requestId, undefined),
        );

        expect(state.postOnboardingInitializationStatus).toBe(status);
    });

    it('tracks unexpected post-onboarding initialization failures', () => {
        const state = appReducer(
            appSliceInitialState,
            postOnboardingInitThunk.rejected(new Error('Unexpected error'), requestId, undefined),
        );

        expect(state.postOnboardingInitializationStatus).toBe(
            PostOnboardingInitializationStatus.Error,
        );
    });

    it.each([
        [PostOnboardingInitializationStatus.Idle, false],
        [PostOnboardingInitializationStatus.Initializing, false],
        [PostOnboardingInitializationStatus.Ready, true],
        [PostOnboardingInitializationStatus.Error, true],
        [PostOnboardingInitializationStatus.Disabled, false],
    ] as const)('allows wallet service calls in the %s state: %s', (status, expected) => {
        const state = {
            ...appSliceInitialState,
            postOnboardingInitializationStatus: status,
        };

        expect(selectCanUseAppServices({ app: state })).toBe(expected);
    });
});
