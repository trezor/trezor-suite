import { createMockDispatch } from '@trezor/redux-utils/mocks';

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

jest.mock('./connectAndBlockchainInitThunk', () => {
    const { createThunk } = jest.requireActual('@trezor/redux-utils');

    return {
        connectAndBlockchainInitThunk: createThunk(
            '@test/connectAndBlockchainInit',
            (_: void, { rejectWithValue }: MockRejectWithValueThunkApi) => {
                mockConnectAndBlockchainInit();

                return mockConnectAndBlockchainShouldReject
                    ? rejectWithValue('unavailable')
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

const expectFollowUpServicesToHaveStarted = () => {
    expect(mockPeriodicCheckTokenDefinitions).toHaveBeenCalledTimes(1);
    expect(mockInitStakeData).toHaveBeenCalledTimes(1);
    expect(mockPeriodicFetchFiatRates).toHaveBeenCalledWith({
        rateType: 'current',
        localCurrency: 'usd',
    });
    expect(mockWalletConnectInit).toHaveBeenCalledTimes(1);
};

describe(postOnboardingInitThunk.name, () => {
    beforeEach(() => {
        jest.clearAllMocks();
        mockConnectAndBlockchainShouldReject = false;
        mockSelectActiveKillswitchMessage.mockReturnValue(undefined);
    });

    it('disables initialization when the app-wide killswitch is active', async () => {
        mockSelectActiveKillswitchMessage.mockReturnValue({});

        const result = await runThunk();

        expect(postOnboardingInitThunk.fulfilled.match(result)).toBe(true);
        expect(result.payload).toBe(ConnectAndBlockchainInitializationStatus.Unavailable);
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
        expectFollowUpServicesToHaveStarted();
    });

    it('starts follow-up services and marks failed initialization unavailable', async () => {
        mockConnectAndBlockchainShouldReject = true;

        const result = await runThunk();

        expect(postOnboardingInitThunk.rejected.match(result)).toBe(true);
        expect(result.payload).toBe(ConnectAndBlockchainInitializationStatus.Unavailable);
        expect(mockConnectAndBlockchainInit).toHaveBeenCalledTimes(1);
        expectFollowUpServicesToHaveStarted();
    });
});
