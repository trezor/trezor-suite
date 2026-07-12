import { transactionsActions } from '@suite-common/wallet-core';

import { type AppState, type Dispatch } from 'src/types/suite';

import { replaceByFeeErrorMiddleware } from './replaceByFeeErrorMiddleware';

jest.mock('../../actions/wallet/send/replaceByFeeErrorThunk', () => ({
    replaceByFeeErrorThunk: jest.fn(() => ({ type: 'mocked-replace-by-fee-error-thunk' })),
}));

const PREV_TXID = 'aaaa';

const invoke = (transactions: { txid: string; blockHeight?: number }[], precomposedTx: unknown) => {
    const dispatch = jest.fn() as unknown as Dispatch;
    const api = {
        getState: () => ({ wallet: { send: { precomposedTx } } }) as AppState,
        dispatch,
    };
    const next = jest.fn(action => action) as unknown as Dispatch;
    const action = {
        type: transactionsActions.addTransaction.type,
        payload: { transactions },
    };

    // @ts-expect-error partial action/api shapes are sufficient for this unit
    replaceByFeeErrorMiddleware(api)(next)(action);

    return { dispatch, next };
};

const rbfPrecomposedTx = { rbfType: 'bump-fee', prevTxid: PREV_TXID };

describe('replaceByFeeErrorMiddleware', () => {
    beforeEach(() => jest.clearAllMocks());

    it('dispatches the RBF error when the replaced transaction gets mined', () => {
        const { dispatch } = invoke([{ txid: PREV_TXID, blockHeight: 100 }], rbfPrecomposedTx);
        expect(dispatch).toHaveBeenCalledTimes(1);
    });

    it('does not dispatch when the replaced transaction is re-added while still pending', () => {
        // blockbook reports pending txs with blockHeight -1; this must not be treated as "mined"
        const { dispatch } = invoke([{ txid: PREV_TXID, blockHeight: -1 }], rbfPrecomposedTx);
        expect(dispatch).not.toHaveBeenCalled();
    });

    it('does not dispatch when the replaced transaction is not present in the batch', () => {
        const { dispatch } = invoke([{ txid: 'bbbb', blockHeight: 100 }], rbfPrecomposedTx);
        expect(dispatch).not.toHaveBeenCalled();
    });

    it('does not dispatch when the pending transaction is not an RBF transaction', () => {
        const { dispatch } = invoke([{ txid: PREV_TXID, blockHeight: 100 }], {
            prevTxid: PREV_TXID,
        });
        expect(dispatch).not.toHaveBeenCalled();
    });
});
