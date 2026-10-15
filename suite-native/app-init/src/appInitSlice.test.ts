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

    it('keeps Connect and blockchain initialization pending when it starts', () => {
        const state = appInitReducer(
            appInitInitialState,
            postOnboardingInitThunk.pending(requestId, undefined),
        );

        expect(state.connectAndBlockchainInitializationStatus).toBe(
            ConnectAndBlockchainInitializationStatus.Pending,
        );
    });

    it.each([
        ConnectAndBlockchainInitializationStatus.Ready,
        ConnectAndBlockchainInitializationStatus.Unavailable,
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
            ConnectAndBlockchainInitializationStatus.Unavailable,
        );
    });

    it('tracks a rejected Connect and blockchain initialization as unavailable', () => {
        const state = appInitReducer(
            appInitInitialState,
            postOnboardingInitThunk.rejected(
                null,
                requestId,
                undefined,
                ConnectAndBlockchainInitializationStatus.Unavailable,
            ),
        );

        expect(state.connectAndBlockchainInitializationStatus).toBe(
            ConnectAndBlockchainInitializationStatus.Unavailable,
        );
    });

    it.each([
        [ConnectAndBlockchainInitializationStatus.Pending, false],
        [ConnectAndBlockchainInitializationStatus.Ready, true],
        [ConnectAndBlockchainInitializationStatus.Unavailable, false],
    ] as const)('reports blockchain initialized in the %s state: %s', (status, expected) => {
        const state = {
            ...appInitInitialState,
            connectAndBlockchainInitializationStatus: status,
        };

        expect(selectIsBlockchainInitialized({ appInit: state })).toBe(expected);
    });

    it.each([
        [ConnectAndBlockchainInitializationStatus.Pending, true],
        [ConnectAndBlockchainInitializationStatus.Ready, false],
        [ConnectAndBlockchainInitializationStatus.Unavailable, false],
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
