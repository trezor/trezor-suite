import { combineReducers } from '@reduxjs/toolkit';

import { deviceInitialState, prepareDeviceReducer } from '@suite-common/device';
import { configureMockStore, extraDependenciesCommonMock } from '@suite-common/test-utils';
import { asNetworkSymbol } from '@suite-common/wallet-config';
import { type FeeInfo } from '@suite-common/wallet-types';

import { DEFAULT_FEE_INFO } from './feesConstants';
import { feesReducer } from './feesReducer';
import { updateFeeInfoThunk } from './feesThunks';
import { blockchainInitialState, prepareBlockchainReducer } from '../blockchain/blockchainReducer';

const blockchainReducer = prepareBlockchainReducer(extraDependenciesCommonMock);
const trxSymbol = asNetworkSymbol('trx');
const deviceReducer = prepareDeviceReducer(extraDependenciesCommonMock);

const tronFeeInfo: FeeInfo = {
    blockHeight: 100,
    blockTime: 3,
    minFee: 0,
    maxFee: 0,
    minPriorityFee: 0,
    levels: [{ label: 'normal', feePerUnit: '1000', blocks: -1 }],
};

const initStore = (feeInfo?: FeeInfo) =>
    configureMockStore({
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
                fees: feeInfo ? { trx: { status: 'preloaded', data: feeInfo } } : {},
                blockchain: blockchainInitialState,
            },
        },
    });

describe(updateFeeInfoThunk.name, () => {
    it('fulfills with existing data for tron instead of fetching', async () => {
        const store = initStore(tronFeeInfo);
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
