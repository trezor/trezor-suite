import { createMockDeps } from '@trezor/dependency-injection';
import { createMockDispatch } from '@trezor/redux-utils/mocks';
import { err, ok } from '@trezor/type-utils';

import { appInitActions } from './appInitSlice';
import { ConnectAndBlockchainInitializationStatus } from './appTypes';
import { type ConnectAndBlockchainInitError } from './connectAndBlockchainInitThunk';
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
const connectError: ConnectAndBlockchainInitError = {
    type: 'ConnectInitError',
    error: { message: 'Connect init failed' },
};

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
        connectAndBlockchainInit: () => mockConnectAndBlockchainInit(),
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
        mockConnectAndBlockchainInit.mockResolvedValue(ok());
        mockSelectActiveKillswitchMessage.mockReturnValue(undefined);
    });

    it('disables initialization when the app-wide killswitch is active', async () => {
        mockSelectActiveKillswitchMessage.mockReturnValue({});

        const { initialize } = createService();
        const result = await initialize();

        expect(result).toEqual(ok(ConnectAndBlockchainInitializationStatus.Unavailable));
        expect(mockConnectAndBlockchainInit).not.toHaveBeenCalled();
        expect(mockPeriodicCheckTokenDefinitions).not.toHaveBeenCalled();
        expect(mockInitStakeData).not.toHaveBeenCalled();
        expect(mockPeriodicFetchFiatRates).not.toHaveBeenCalled();
        expect(mockWalletConnectInit).not.toHaveBeenCalled();
    });

    it('starts follow-up services after Connect and blockchain initialization', async () => {
        const { initialize } = createService();
        const result = await initialize();

        expect(result).toEqual(ok(ConnectAndBlockchainInitializationStatus.Ready));
        expect(mockConnectAndBlockchainInit).toHaveBeenCalledTimes(1);
        expectFollowUpServicesToHaveStarted();
    });

    it('starts follow-up services and marks failed initialization unavailable', async () => {
        mockConnectAndBlockchainInit.mockResolvedValue(err(connectError));

        const { initialize } = createService();
        const result = await initialize();

        expect(result).toEqual(err(connectError));
        expect(mockConnectAndBlockchainInit).toHaveBeenCalledTimes(1);
        expectFollowUpServicesToHaveStarted();
    });

    it('propagates the initialization error Result and marks it unavailable', async () => {
        mockConnectAndBlockchainInit.mockResolvedValue(err(connectError));
        const { initialize, actions } = createService();

        const result = await initialize();

        expect(result).toEqual(err(connectError));
        expect(actions[0]).toEqual(appInitActions.postOnboardingInitStarted());
        expect(actions).toContainEqual(
            appInitActions.postOnboardingInitFinished(
                ConnectAndBlockchainInitializationStatus.Unavailable,
            ),
        );
    });
});
