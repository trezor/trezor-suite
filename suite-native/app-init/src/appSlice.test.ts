import {
    appReducer,
    appSliceInitialState,
    selectIsAppInitialized,
    selectIsBlockchainInitialized,
    selectIsTrezorConnectInitialized,
} from './appSlice';
import { ConnectAndBlockchainInitializationStatus } from './appTypes';
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

    it('tracks when Connect and blockchain initialization starts', () => {
        const state = appReducer(
            appSliceInitialState,
            postOnboardingInitThunk.pending(requestId, undefined),
        );

        expect(state.connectAndBlockchainInitializationStatus).toBe(
            ConnectAndBlockchainInitializationStatus.Initializing,
        );
    });

    it.each([
        ConnectAndBlockchainInitializationStatus.Ready,
        ConnectAndBlockchainInitializationStatus.Disabled,
    ] as const)('tracks the fulfilled Connect and blockchain initialization result: %s', status => {
        const state = appReducer(
            appSliceInitialState,
            postOnboardingInitThunk.fulfilled(status, requestId, undefined),
        );

        expect(state.connectAndBlockchainInitializationStatus).toBe(status);
    });

    it('tracks unexpected Connect and blockchain initialization failures', () => {
        const state = appReducer(
            appSliceInitialState,
            postOnboardingInitThunk.rejected(new Error('Unexpected error'), requestId, undefined),
        );

        expect(state.connectAndBlockchainInitializationStatus).toBe(
            ConnectAndBlockchainInitializationStatus.Error,
        );
    });

    it.each([
        ConnectAndBlockchainInitializationStatus.ConnectError,
        ConnectAndBlockchainInitializationStatus.BlockchainError,
    ] as const)('tracks the rejected Connect and blockchain initialization result: %s', status => {
        const state = appReducer(
            appSliceInitialState,
            postOnboardingInitThunk.rejected(null, requestId, undefined, status),
        );

        expect(state.connectAndBlockchainInitializationStatus).toBe(status);
    });

    it.each([
        [ConnectAndBlockchainInitializationStatus.Idle, false],
        [ConnectAndBlockchainInitializationStatus.Initializing, false],
        [ConnectAndBlockchainInitializationStatus.Ready, true],
        [ConnectAndBlockchainInitializationStatus.ConnectError, false],
        [ConnectAndBlockchainInitializationStatus.BlockchainError, true],
        [ConnectAndBlockchainInitializationStatus.Error, false],
        [ConnectAndBlockchainInitializationStatus.Disabled, false],
    ] as const)('reports TrezorConnect initialized in the %s state: %s', (status, expected) => {
        const state = {
            ...appSliceInitialState,
            connectAndBlockchainInitializationStatus: status,
        };

        expect(selectIsTrezorConnectInitialized({ app: state })).toBe(expected);
    });

    it.each([
        [ConnectAndBlockchainInitializationStatus.Idle, false],
        [ConnectAndBlockchainInitializationStatus.Initializing, false],
        [ConnectAndBlockchainInitializationStatus.Ready, true],
        [ConnectAndBlockchainInitializationStatus.ConnectError, false],
        [ConnectAndBlockchainInitializationStatus.BlockchainError, false],
        [ConnectAndBlockchainInitializationStatus.Error, false],
        [ConnectAndBlockchainInitializationStatus.Disabled, false],
    ] as const)('reports blockchain initialized in the %s state: %s', (status, expected) => {
        const state = {
            ...appSliceInitialState,
            connectAndBlockchainInitializationStatus: status,
        };

        expect(selectIsBlockchainInitialized({ app: state })).toBe(expected);
    });
});
