import {
    appInitActions,
    appInitInitialState,
    appInitReducer,
    selectIsAppInitFinished,
    selectIsBlockchainInitialized,
    selectIsConnectAndBlockchainInitializationPending,
} from './appInitSlice';
import { ConnectAndBlockchainInitializationStatus } from './appTypes';

describe('appInitSlice', () => {
    it('tracks when the application shell is ready', () => {
        const state = appInitReducer(appInitInitialState, appInitActions.applicationInitFinished());

        expect(selectIsAppInitFinished({ appInit: state })).toBe(true);
    });

    it('keeps Connect and blockchain initialization pending when it starts', () => {
        const state = appInitReducer(
            appInitInitialState,
            appInitActions.postOnboardingInitStarted(),
        );

        expect(state.connectAndBlockchainInitializationStatus).toBe(
            ConnectAndBlockchainInitializationStatus.Pending,
        );
    });

    it.each([
        ConnectAndBlockchainInitializationStatus.Ready,
        ConnectAndBlockchainInitializationStatus.Unavailable,
    ] as const)('tracks the completed Connect and blockchain initialization result: %s', status => {
        const state = appInitReducer(
            appInitInitialState,
            appInitActions.postOnboardingInitFinished(status),
        );

        expect(state.connectAndBlockchainInitializationStatus).toBe(status);
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
