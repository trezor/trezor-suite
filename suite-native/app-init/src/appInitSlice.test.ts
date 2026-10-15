import {
    appInitInitialState,
    appInitReducer,
    selectIsAppInitFinished,
    selectIsBlockchainInitialized,
    selectIsConnectAndBlockchainInitializationPending,
} from './appInitSlice';
import { ConnectAndBlockchainInitializationStatus } from './appTypes';
import { applicationInitThunk } from './applicationInitThunk';
import { postOnboardingInitThunk } from './postOnboardingInitThunk';

const requestId = 'request-id';

describe('appInitSlice', () => {
    it('tracks when the application shell is ready', () => {
        const state = appInitReducer(
            appInitInitialState,
            applicationInitThunk.fulfilled(undefined, requestId, undefined),
        );

        expect(selectIsAppInitFinished({ appInit: state })).toBe(true);
    });

    it('tracks when Connect and blockchain initialization starts', () => {
        const state = appInitReducer(
            appInitInitialState,
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
        const state = appInitReducer(
            appInitInitialState,
            postOnboardingInitThunk.fulfilled(status, requestId, undefined),
        );

        expect(state.connectAndBlockchainInitializationStatus).toBe(status);
    });

    it('tracks unexpected Connect and blockchain initialization failures', () => {
        const state = appInitReducer(
            appInitInitialState,
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
        const state = appInitReducer(
            appInitInitialState,
            postOnboardingInitThunk.rejected(null, requestId, undefined, status),
        );

        expect(state.connectAndBlockchainInitializationStatus).toBe(status);
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
            ...appInitInitialState,
            connectAndBlockchainInitializationStatus: status,
        };

        expect(selectIsBlockchainInitialized({ appInit: state })).toBe(expected);
    });

    it.each([
        [ConnectAndBlockchainInitializationStatus.Idle, true],
        [ConnectAndBlockchainInitializationStatus.Initializing, true],
        [ConnectAndBlockchainInitializationStatus.Ready, false],
        [ConnectAndBlockchainInitializationStatus.ConnectError, false],
        [ConnectAndBlockchainInitializationStatus.BlockchainError, false],
        [ConnectAndBlockchainInitializationStatus.Error, false],
        [ConnectAndBlockchainInitializationStatus.Disabled, false],
    ] as const)(
        'reports Connect and blockchain initialization pending in the %s state: %s',
        (status, expected) => {
            const state = {
                ...appInitInitialState,
                connectAndBlockchainInitializationStatus: status,
            };

            expect(selectIsConnectAndBlockchainInitializationPending({ appInit: state })).toBe(
                expected,
            );
        },
    );
});
