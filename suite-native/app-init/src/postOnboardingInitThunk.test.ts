import { createMockDispatch } from '@suite-common/redux-utils/mocks';

import { ConnectAndBlockchainInitializationStatus } from './appTypes';
import {
    type PostOnboardingInitThunkDeps,
    type PostOnboardingInitThunkState,
    postOnboardingInitThunk,
} from './postOnboardingInitThunk';

type MockRejectWithValueThunkApi = {
    rejectWithValue: (error: string) => unknown;
};

const mockSelectActiveKillswitchMessage = jest.fn();
const mockSelectBaseCurrency = jest.fn(() => 'usd');
const mockConnectAndBlockchainInit = jest.fn();
const mockPeriodicCheckTokenDefinitions = jest.fn();
const mockInitStakeData = jest.fn();
const mockPeriodicFetchFiatRates = jest.fn();
const mockWalletConnectInit = jest.fn();
let mockConnectAndBlockchainError: string | undefined;

jest.mock('@suite-common/message-system', () => ({
    selectActiveKillswitchMessage: () => mockSelectActiveKillswitchMessage(),
}));

jest.mock('@suite-common/token-definitions', () => {
    const { createThunk } = jest.requireActual('@suite-common/redux-utils');

    return {
        periodicCheckTokenDefinitionsThunk: createThunk('@test/periodicCheckTokenDefinitions', () =>
            mockPeriodicCheckTokenDefinitions(),
        ),
    };
});

jest.mock('@suite-common/wallet-core', () => {
    const { createThunk } = jest.requireActual('@suite-common/redux-utils');

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
    const { createThunk } = jest.requireActual('@suite-common/redux-utils');

    return {
        walletConnectInitThunk: createThunk('@test/walletConnectInit', () =>
            mockWalletConnectInit(),
        ),
    };
});

jest.mock('./connectAndBlockchainInitThunk', () => {
    const { createThunk } = jest.requireActual('@suite-common/redux-utils');

    return {
        connectAndBlockchainInitThunk: createThunk(
            '@test/connectAndBlockchainInit',
            (_: void, { rejectWithValue }: MockRejectWithValueThunkApi) => {
                mockConnectAndBlockchainInit();

                return mockConnectAndBlockchainError
                    ? rejectWithValue(mockConnectAndBlockchainError)
                    : undefined;
            },
        ),
    };
});

const runThunk = () => {
    const getState = jest.fn<PostOnboardingInitThunkState, []>();
    const { dispatch } = createMockDispatch<
        PostOnboardingInitThunkState,
        PostOnboardingInitThunkDeps
    >({ getState });

    return dispatch(postOnboardingInitThunk());
};

describe(postOnboardingInitThunk.name, () => {
    beforeEach(() => {
        jest.clearAllMocks();
        mockConnectAndBlockchainError = undefined;
        mockSelectActiveKillswitchMessage.mockReturnValue(undefined);
    });

    it('disables initialization when the app-wide killswitch is active', async () => {
        mockSelectActiveKillswitchMessage.mockReturnValue({});

        const result = await runThunk();

        expect(postOnboardingInitThunk.fulfilled.match(result)).toBe(true);
        expect(result.payload).toBe(ConnectAndBlockchainInitializationStatus.Disabled);
        expect(mockConnectAndBlockchainInit).not.toHaveBeenCalled();
        expect(mockPeriodicCheckTokenDefinitions).not.toHaveBeenCalled();
        expect(mockInitStakeData).not.toHaveBeenCalled();
        expect(mockPeriodicFetchFiatRates).not.toHaveBeenCalled();
        expect(mockWalletConnectInit).not.toHaveBeenCalled();
    });

    it('starts follow-up services after Connect and blockchain initialization', async () => {
        const result = await runThunk();

        expect(postOnboardingInitThunk.fulfilled.match(result)).toBe(true);
        expect(result.payload).toBe(ConnectAndBlockchainInitializationStatus.Ready);
        expect(mockConnectAndBlockchainInit).toHaveBeenCalledTimes(1);
        expect(mockPeriodicCheckTokenDefinitions).toHaveBeenCalledTimes(1);
        expect(mockInitStakeData).toHaveBeenCalledTimes(1);
        expect(mockPeriodicFetchFiatRates).toHaveBeenCalledWith({
            rateType: 'current',
            localCurrency: 'usd',
        });
        expect(mockWalletConnectInit).toHaveBeenCalledTimes(1);
    });

    it('propagates a Connect initialization error', async () => {
        mockConnectAndBlockchainError = ConnectAndBlockchainInitializationStatus.ConnectError;

        const result = await runThunk();

        expect(postOnboardingInitThunk.rejected.match(result)).toBe(true);
        expect(result.payload).toBe(ConnectAndBlockchainInitializationStatus.ConnectError);
    });
});
