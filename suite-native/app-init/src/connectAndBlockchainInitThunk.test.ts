import { createMockDeps } from '@trezor/dependency-injection';
import { createMockDispatch } from '@trezor/redux-utils/mocks';

import { ConnectAndBlockchainInitializationStatus } from './appTypes';
import {
    type ConnectAndBlockchainInitDeps,
    createConnectAndBlockchainInit,
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
    const { createThunk } = jest.requireActual('@trezor/redux-utils');

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
    const { createThunk } = jest.requireActual('@trezor/redux-utils');

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

const runService = () => {
    const { dispatch } = createMockDispatch({ getState: () => undefined });
    const deps = createMockDeps<ConnectAndBlockchainInitDeps>({ dispatch });

    return createConnectAndBlockchainInit(deps)();
};

describe(createConnectAndBlockchainInit.name, () => {
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
        const result = await runService();

        expect(result).toBe(ConnectAndBlockchainInitializationStatus.Ready);
        expect(mockConnectInit).toHaveBeenCalledTimes(1);
        expect(mockInitBlockchain).toHaveBeenCalledTimes(1);
        expect(mockInitializationOrder).toEqual(['connect', 'blockchain']);
    });

    it('does not initialize blockchain after Connect fails', async () => {
        mockConnectInitShouldReject = true;

        const result = await runService();

        expect(result).toBe(ConnectAndBlockchainInitializationStatus.Unavailable);
        expect(mockInitBlockchain).not.toHaveBeenCalled();
    });

    it('reports blockchain initialization failure', async () => {
        mockInitBlockchainShouldReject = true;

        const result = await runService();

        expect(result).toBe(ConnectAndBlockchainInitializationStatus.Unavailable);
    });
});
