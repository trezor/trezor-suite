import { combineReducers } from '@reduxjs/toolkit';

import { configureMockStore, extraDependenciesCommonMock } from '@suite-common/test-utils';

import { sendFormActions } from '../../src/send/sendFormActions';
import { prepareSendFormReducer } from '../../src/send/sendFormReducer';
import {
    selectCancelTxidByOriginalTxid,
    selectIsEvmTxBeingCancelled,
    selectOriginalTxidByCancelTxid,
} from '../../src/send/sendFormSelectors';

const sendReducer = prepareSendFormReducer(extraDependenciesCommonMock);

const initStore = () =>
    configureMockStore({
        reducer: combineReducers({ wallet: combineReducers({ send: sendReducer }) }),
    });

describe('send pendingCancellations reducer', () => {
    it('stores and removes a pending cancellation', () => {
        const store = initStore();

        store.dispatch(
            sendFormActions.storePendingCancellation({ originalTxid: 'orig', cancelTxid: 'cancel' }),
        );
        expect(store.getState().wallet.send.pendingCancellations).toEqual({ orig: 'cancel' });

        store.dispatch(sendFormActions.removePendingCancellation('orig'));
        expect(store.getState().wallet.send.pendingCancellations).toEqual({});
    });
});

describe('send pendingCancellations selectors', () => {
    const state = {
        wallet: { send: { pendingCancellations: { orig1: 'cancel1', orig2: 'cancel2' } } },
    } as any;

    it('selectCancelTxidByOriginalTxid returns the cancel txid (or undefined)', () => {
        expect(selectCancelTxidByOriginalTxid(state, 'orig1')).toBe('cancel1');
        expect(selectCancelTxidByOriginalTxid(state, 'missing')).toBeUndefined();
    });

    it('selectIsEvmTxBeingCancelled reflects whether the tx is a tracked original', () => {
        expect(selectIsEvmTxBeingCancelled(state, 'orig1')).toBe(true);
        expect(selectIsEvmTxBeingCancelled(state, 'missing')).toBe(false);
    });

    it('selectOriginalTxidByCancelTxid reverse-maps the cancel txid (or undefined)', () => {
        expect(selectOriginalTxidByCancelTxid(state, 'cancel2')).toBe('orig2');
        expect(selectOriginalTxidByCancelTxid(state, 'missing')).toBeUndefined();
    });
});
