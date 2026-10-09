import { createMockDispatch } from '@suite-common/redux-utils/mocks';

import { ConnectAndBlockchainInitializationStatus } from './appTypes';
import {
    type ConnectAndBlockchainInitThunkDeps,
    type ConnectAndBlockchainInitThunkState,
    connectAndBlockchainInitThunk,
} from './connectAndBlockchainInitThunk';

type MockRejectWithValueThunkApi = {
    rejectWithValue: (error: string) => unknown;
};

const mockConnectInit = jest.fn();
const mockInitBlockchain = jest.fn();
const mockInitializationOrder: string[] = [];
let mockConnectInitShouldReject = false;
let mockInitBlockchainShouldReject = false;

jest.mock('@suite-common/connect-init', () => {
    const { createThunk } = jest.requireActual('@suite-common/redux-utils');

    return {
        connectInitThunk: createThunk(
            '@test/connectInit',
            (_: void, { rejectWithValue }: MockRejectWithValueThunkApi) => {
                mockConnectInit();
                mockInitializationOrder.push('connect');

                return mockConnectInitShouldReject
                    ? rejectWithValue('connect-init-error')
                    : undefined;
            },
        ),
    };
});

jest.mock('@suite-common/wallet-core', () => {
    const { createThunk } = jest.requireActual('@suite-common/redux-utils');

    return {
        initBlockchainThunk: createThunk(
            '@test/initBlockchain',
            (_: void, { rejectWithValue }: MockRejectWithValueThunkApi) => {
                mockInitBlockchain();
                mockInitializationOrder.push('blockchain');

                return mockInitBlockchainShouldReject
                    ? rejectWithValue('blockchain-init-error')
                    : undefined;
            },
        ),
    };
});

const runThunk = () => {
    const getState = jest.fn<ConnectAndBlockchainInitThunkState, []>();
    const { dispatch } = createMockDispatch<
        ConnectAndBlockchainInitThunkState,
        ConnectAndBlockchainInitThunkDeps
    >({ getState });

    return dispatch(connectAndBlockchainInitThunk());
};

describe(connectAndBlockchainInitThunk.name, () => {
    beforeEach(() => {
        jest.clearAllMocks();
        jest.spyOn(console, 'error').mockImplementation(() => undefined);
        mockInitializationOrder.length = 0;
        mockConnectInitShouldReject = false;
        mockInitBlockchainShouldReject = false;
    });

    afterEach(() => {
        jest.restoreAllMocks();
    });

    it('initializes blockchain after Connect succeeds', async () => {
        const result = await runThunk();

        expect(connectAndBlockchainInitThunk.fulfilled.match(result)).toBe(true);
        expect(mockConnectInit).toHaveBeenCalledTimes(1);
        expect(mockInitBlockchain).toHaveBeenCalledTimes(1);
        expect(mockInitializationOrder).toEqual(['connect', 'blockchain']);
    });

    it('does not initialize blockchain after Connect fails', async () => {
        mockConnectInitShouldReject = true;

        const result = await runThunk();

        expect(connectAndBlockchainInitThunk.rejected.match(result)).toBe(true);
        expect(result.payload).toBe(ConnectAndBlockchainInitializationStatus.ConnectError);
        expect(mockInitBlockchain).not.toHaveBeenCalled();
    });

    it('reports blockchain initialization failure', async () => {
        mockInitBlockchainShouldReject = true;

        const result = await runThunk();

        expect(connectAndBlockchainInitThunk.rejected.match(result)).toBe(true);
        expect(result.payload).toBe(ConnectAndBlockchainInitializationStatus.BlockchainError);
    });
});
