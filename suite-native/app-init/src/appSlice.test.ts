import {
    appReducer,
    appSliceInitialState,
    selectCanUseBlockchain,
    selectCanUseTrezorConnect,
    selectIsAppInitialized,
} from './appSlice';
import { AppServicesInitializationStatus } from './appTypes';
import { applicationInitThunk } from './applicationInitThunk';
import { postOnboardingInitThunk } from './postOnboardingInitThunk';

const requestId = 'request-id';

describe('appSlice', () => {
    it('tracks when the application shell is ready', () => {
        const state = appReducer(
            appSliceInitialState,
            applicationInitThunk.fulfilled(undefined, requestId, undefined),
        );

        expect(selectIsAppInitialized({ app: state })).toBe(true);
    });

    it('tracks when services initialization starts', () => {
        const state = appReducer(
            appSliceInitialState,
            postOnboardingInitThunk.pending(requestId, undefined),
        );

        expect(state.appServicesInitializationStatus).toBe(
            AppServicesInitializationStatus.Initializing,
        );
    });

    it.each([
        AppServicesInitializationStatus.Ready,
        AppServicesInitializationStatus.Disabled,
    ] as const)('tracks the fulfilled services initialization result: %s', status => {
        const state = appReducer(
            appSliceInitialState,
            postOnboardingInitThunk.fulfilled(status, requestId, undefined),
        );

        expect(state.appServicesInitializationStatus).toBe(status);
    });

    it('tracks unexpected services initialization failures', () => {
        const state = appReducer(
            appSliceInitialState,
            postOnboardingInitThunk.rejected(new Error('Unexpected error'), requestId, undefined),
        );

        expect(state.appServicesInitializationStatus).toBe(AppServicesInitializationStatus.Error);
    });

    it.each([
        AppServicesInitializationStatus.ConnectError,
        AppServicesInitializationStatus.BlockchainError,
    ] as const)('tracks the rejected services initialization result: %s', status => {
        const state = appReducer(
            appSliceInitialState,
            postOnboardingInitThunk.rejected(null, requestId, undefined, status),
        );

        expect(state.appServicesInitializationStatus).toBe(status);
    });

    it.each([
        [AppServicesInitializationStatus.Idle, false],
        [AppServicesInitializationStatus.Initializing, false],
        [AppServicesInitializationStatus.Ready, true],
        [AppServicesInitializationStatus.ConnectError, false],
        [AppServicesInitializationStatus.BlockchainError, true],
        [AppServicesInitializationStatus.Error, false],
        [AppServicesInitializationStatus.Disabled, false],
    ] as const)('allows Connect calls in the %s state: %s', (status, expected) => {
        const state = {
            ...appSliceInitialState,
            appServicesInitializationStatus: status,
        };

        expect(selectCanUseTrezorConnect({ app: state })).toBe(expected);
    });

    it.each([
        [AppServicesInitializationStatus.Idle, false],
        [AppServicesInitializationStatus.Initializing, false],
        [AppServicesInitializationStatus.Ready, true],
        [AppServicesInitializationStatus.ConnectError, false],
        [AppServicesInitializationStatus.BlockchainError, false],
        [AppServicesInitializationStatus.Error, false],
        [AppServicesInitializationStatus.Disabled, false],
    ] as const)('allows blockchain calls in the %s state: %s', (status, expected) => {
        const state = {
            ...appSliceInitialState,
            appServicesInitializationStatus: status,
        };

        expect(selectCanUseBlockchain({ app: state })).toBe(expected);
    });
});
