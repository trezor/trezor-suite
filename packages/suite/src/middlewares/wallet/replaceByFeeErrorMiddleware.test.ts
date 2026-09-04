import { type UnknownAction } from '@reduxjs/toolkit';
import { type MiddlewareAPI, type Dispatch as ReduxDispatch } from 'redux';

import { type Dispatch } from '@suite-common/redux-utils';
import { transactionsActions } from '@suite-common/wallet-core';
import { type WalletAccountTransaction } from '@suite-common/wallet-types';

import { type AppState } from 'src/types/suite';

import { replaceByFeeErrorMiddleware } from './replaceByFeeErrorMiddleware';

jest.mock('src/actions/wallet/send/replaceByFeeErrorThunk', () => ({
    replaceByFeeErrorThunk: () => ({ type: 'replace-by-fee-error' }),
}));

const PREV_TXID = '0xdeadbeef';

const createAddTransactionAction = (blockHeight: number) =>
    ({
        type: transactionsActions.addTransaction.type,
        payload: {
            transactions: [{ txid: PREV_TXID, blockHeight } as WalletAccountTransaction],
        },
    }) as unknown as UnknownAction;

const runMiddleware = (action: UnknownAction) => {
    const dispatch = jest.fn();
    const api = {
        dispatch,
        getState: () => ({
            wallet: { send: { precomposedTx: { rbfType: 'bump-fee', prevTxid: PREV_TXID } } },
        }),
    } as unknown as MiddlewareAPI<Dispatch, AppState>;

    replaceByFeeErrorMiddleware(api)(jest.fn() as unknown as ReduxDispatch<UnknownAction>)(action);

    return dispatch;
};

describe('replaceByFeeErrorMiddleware', () => {
    it('reports the replaced transaction as mined once it has a block', () => {
        const dispatch = runMiddleware(createAddTransactionAction(1_000_000));

        expect(dispatch).toHaveBeenCalledWith({ type: 'replace-by-fee-error' });
    });

    it('stays quiet while the replaced transaction is still in the mempool', () => {
        // Blockbook re-adds a mempool transaction with blockHeight -1, and blockbook-link maps some
        // of those to 0; neither means mined, and aborting the bump here would be a false alarm.
        expect(runMiddleware(createAddTransactionAction(-1))).not.toHaveBeenCalled();
        expect(runMiddleware(createAddTransactionAction(0))).not.toHaveBeenCalled();
    });
});
