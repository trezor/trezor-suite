import { createMockDeps } from '@trezor/dependency-injection';
import { createMockDispatch } from '@trezor/redux-utils/mocks';

import { appInitActions } from './appInitSlice';
import { ConnectAndBlockchainInitializationStatus } from './appTypes';
import {
    type PostOnboardingInitDeps,
    type PostOnboardingInitState,
    createPostOnboardingInit,
} from './postOnboardingInitThunk';

const mockSelectActiveKillswitchMessage = jest.fn();
const mockSelectBaseCurrency = jest.fn(() => 'usd');
const mockConnectAndBlockchainInit = jest.fn();
const mockPeriodicCheckTokenDefinitions = jest.fn();
const mockInitStakeData = jest.fn();
const mockPeriodicFetchFiatRates = jest.fn();
const mockWalletConnectInit = jest.fn();
let mockConnectAndBlockchainShouldReject = false;

jest.mock('@suite-common/message-system', () => ({
    selectActiveKillswitchMessage: () => mockSelectActiveKillswitchMessage(),
}));

jest.mock('@suite-common/token-definitions', () => {
    const { createThunk } = jest.requireActual('@trezor/redux-utils');

    return {
        periodicCheckTokenDefinitionsThunk: createThunk('@test/periodicCheckTokenDefinitions', () =>
            mockPeriodicCheckTokenDefinitions(),
        ),
    };
});

jest.mock('@suite-common/wallet-core', () => {
    const { createThunk } = jest.requireActual('@trezor/redux-utils');

    return {
        initStakeDataThunk: createThunk('@test/initStakeData', () => mockInitStakeData()),
        periodicFetchFiatRatesThunk: createThunk(
            '@test/periodicFetchFiatRates',
            (payload: unknown) => mockPeriodicFetchFiatRates(payload),
        ),
        selectBaseCurrency: () => mockSelectBaseCurrency(),
    };
});

jest.mock('@suite-common/walletconnect', () => {
    const { createThunk } = jest.requireActual('@trezor/redux-utils');

    return {
        walletConnectInitThunk: createThunk('@test/walletConnectInit', () =>
            mockWalletConnectInit(),
        ),
    };
});

const createService = () => {
    const getState = jest.fn<PostOnboardingInitState, []>();
    const mockDispatch = createMockDispatch({ getState });
    const deps = createMockDeps<PostOnboardingInitDeps>({
        dispatch: mockDispatch.dispatch,
        getState,
        connectAndBlockchainInit: async () => {
            mockConnectAndBlockchainInit();

            return mockConnectAndBlockchainShouldReject
                ? ConnectAndBlockchainInitializationStatus.Unavailable
                : ConnectAndBlockchainInitializationStatus.Ready;
        },
    });

    return { initialize: createPostOnboardingInit(deps), actions: mockDispatch.actions };
};

const expectFollowUpServicesToHaveStarted = () => {
    expect(mockPeriodicCheckTokenDefinitions).toHaveBeenCalledTimes(1);
    expect(mockInitStakeData).toHaveBeenCalledTimes(1);
    expect(mockPeriodicFetchFiatRates).toHaveBeenCalledWith({
        rateType: 'current',
        localCurrency: 'usd',
    });
    expect(mockWalletConnectInit).toHaveBeenCalledTimes(1);
};

describe(createPostOnboardingInit.name, () => {
    beforeEach(() => {
        jest.clearAllMocks();
        mockConnectAndBlockchainShouldReject = false;
        mockSelectActiveKillswitchMessage.mockReturnValue(undefined);
    });

    it('disables initialization when the app-wide killswitch is active', async () => {
        mockSelectActiveKillswitchMessage.mockReturnValue({});

        const { initialize } = createService();
        const result = await initialize();

        expect(result).toBe(ConnectAndBlockchainInitializationStatus.Unavailable);
        expect(mockConnectAndBlockchainInit).not.toHaveBeenCalled();
        expect(mockPeriodicCheckTokenDefinitions).not.toHaveBeenCalled();
        expect(mockInitStakeData).not.toHaveBeenCalled();
        expect(mockPeriodicFetchFiatRates).not.toHaveBeenCalled();
        expect(mockWalletConnectInit).not.toHaveBeenCalled();
    });

    it('starts follow-up services after Connect and blockchain initialization', async () => {
        const { initialize } = createService();
        const result = await initialize();

        expect(result).toBe(ConnectAndBlockchainInitializationStatus.Ready);
        expect(mockConnectAndBlockchainInit).toHaveBeenCalledTimes(1);
        expectFollowUpServicesToHaveStarted();
    });

    it('starts follow-up services and marks failed initialization unavailable', async () => {
        mockConnectAndBlockchainShouldReject = true;

        const { initialize } = createService();
        const result = await initialize();

        expect(result).toBe(ConnectAndBlockchainInitializationStatus.Unavailable);
        expect(mockConnectAndBlockchainInit).toHaveBeenCalledTimes(1);
        expectFollowUpServicesToHaveStarted();
    });

    it('marks unexpected initialization failures unavailable', async () => {
        mockSelectActiveKillswitchMessage.mockImplementationOnce(() => {
            throw new Error('Unexpected error');
        });
        const { initialize, actions } = createService();

        const result = await initialize();

        expect(result).toBe(ConnectAndBlockchainInitializationStatus.Unavailable);
        expect(actions).toEqual([
            appInitActions.postOnboardingInitStarted(),
            appInitActions.postOnboardingInitFinished(
                ConnectAndBlockchainInitializationStatus.Unavailable,
            ),
        ]);
    });
});
