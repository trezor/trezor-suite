import { combineReducers } from '@reduxjs/toolkit';

import { deviceInitialState, prepareDeviceReducer } from '@suite-common/device';
import { mockActionType, mockReducer } from '@suite-common/redux-utils/mocks';
import { configureMockStore } from '@suite-common/test-utils';
import { asNetworkSymbol } from '@suite-common/wallet-config';
import { type FeeInfo, type FeesState } from '@suite-common/wallet-types';
import TrezorConnect from '@trezor/connect';

import { DEFAULT_FEE_INFO } from './feesConstants';
import { feesReducer } from './feesReducer';
import { getOrFetchRawFeeInfoThunk, updateFeeInfoThunk } from './feesThunks';
import { blockchainInitialState, prepareBlockchainReducer } from '../blockchain/blockchainReducer';

jest.mock('@trezor/connect', () => {
    const actual = jest.requireActual('@trezor/connect');

    return {
        ...actual,
        __esModule: true,
        default: { ...actual.default, blockchainEstimateFee: jest.fn() },
    };
});

const blockchainReducer = prepareBlockchainReducer({
    actionTypes: { storageLoad: mockActionType('storageLoad') },
    reducers: { storageLoadBlockchain: mockReducer() },
});
const trxSymbol = asNetworkSymbol('trx');
const ethSymbol = asNetworkSymbol('eth');
const deviceReducer = prepareDeviceReducer({
    actionTypes: {
        setDeviceMetadata: mockActionType('setDeviceMetadata'),
        setDeviceMetadataPasswords: mockActionType('setDeviceMetadataPasswords'),
        storageLoad: mockActionType('storageLoad'),
    },
    reducers: {
        setDeviceMetadataPasswordsReducer: mockReducer(),
        setDeviceMetadataReducer: mockReducer(),
        storageLoadDevices: mockReducer(),
    },
});

const tronFeeInfo: FeeInfo = {
    blockHeight: 100,
    blockTime: 3,
    minFee: 0,
    maxFee: 0,
    minPriorityFee: 0,
    levels: [{ label: 'normal', feePerUnit: '1000', blocks: -1 }],
};

const ethFeeInfo: FeeInfo = {
    blockHeight: 200,
    blockTime: 12,
    minFee: 1,
    maxFee: 100,
    minPriorityFee: 1,
    levels: [{ label: 'normal', feePerUnit: '3000000000', blocks: 2 }],
};

const initStore = (fees: FeesState = {}) =>
    configureMockStore({
        extra: undefined,
        reducer: combineReducers({
            device: deviceReducer,
            wallet: combineReducers({
                fees: feesReducer,
                blockchain: blockchainReducer,
            }),
        }),
        preloadedState: {
            device: deviceInitialState,
            wallet: {
                fees,
                blockchain: blockchainInitialState,
            },
        },
    });

describe(updateFeeInfoThunk.name, () => {
    it('fulfills with existing data for tron instead of fetching', async () => {
        const store = initStore({ trx: { status: 'preloaded', data: tronFeeInfo } });
        const response = await store.dispatch(updateFeeInfoThunk({ networkSymbol: trxSymbol }));

        expect(response.meta.requestStatus).toBe('fulfilled');
        expect(response.payload).toEqual(tronFeeInfo);
        expect(store.getState().wallet.fees[trxSymbol]).toEqual({
            status: 'loaded',
            data: tronFeeInfo,
        });
    });

    it('fulfills with default fee info for tron when no data is stored', async () => {
        const store = initStore();
        const response = await store.dispatch(updateFeeInfoThunk({ networkSymbol: trxSymbol }));

        expect(response.meta.requestStatus).toBe('fulfilled');
        expect(response.payload).toEqual({ ...DEFAULT_FEE_INFO, blockHeight: 0 });
    });
});

describe(getOrFetchRawFeeInfoThunk.name, () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('returns stored fee info without fetching', async () => {
        const store = initStore({ eth: { status: 'preloaded', data: ethFeeInfo } });

        const response = await store.dispatch(
            getOrFetchRawFeeInfoThunk({ networkSymbol: ethSymbol }),
        );

        expect(response.meta.requestStatus).toBe('fulfilled');
        expect(response.payload).toEqual(ethFeeInfo);
        expect(TrezorConnect.blockchainEstimateFee).not.toHaveBeenCalled();
    });

    it('fetches and stores fee info when it is missing', async () => {
        (TrezorConnect.blockchainEstimateFee as jest.Mock).mockResolvedValue({
            success: true,
            payload: {
                blockTime: 12,
                minFee: 1,
                maxFee: 100,
                levels: [{ label: 'normal', feePerUnit: '3000000000', blocks: 2 }],
            },
        });
        const store = initStore();

        const response = await store.dispatch(
            getOrFetchRawFeeInfoThunk({ networkSymbol: ethSymbol }),
        );

        expect(response.meta.requestStatus).toBe('fulfilled');
        expect(response.payload).toMatchObject({
            levels: [expect.objectContaining({ label: 'normal', feePerUnit: '3000000000' })],
        });
        expect(store.getState().wallet.fees[ethSymbol]?.status).toBe('loaded');
    });

    it('returns undefined when fee info is missing and the fetch fails', async () => {
        (TrezorConnect.blockchainEstimateFee as jest.Mock).mockResolvedValue({
            success: false,
            payload: { error: 'error' },
        });
        const store = initStore();

        const response = await store.dispatch(
            getOrFetchRawFeeInfoThunk({ networkSymbol: ethSymbol }),
        );

        expect(response.meta.requestStatus).toBe('fulfilled');
        expect(response.payload).toBeUndefined();
        expect(store.getState().wallet.fees[ethSymbol]?.status).toBe('error');
    });
});
