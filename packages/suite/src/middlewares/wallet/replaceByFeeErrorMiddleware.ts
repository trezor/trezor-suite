import { type UnknownAction } from '@reduxjs/toolkit';
import { type MiddlewareAPI, type Dispatch as ReduxDispatch } from 'redux';

import { type Dispatch } from '@suite-common/redux-utils';
import { transactionsActions } from '@suite-common/wallet-core/';
import { isPending, isRbfTransaction } from '@suite-common/wallet-utils';

import { type AppState } from 'src/types/suite';

import { replaceByFeeErrorThunk } from '../../actions/wallet/send/replaceByFeeErrorThunk';

export const replaceByFeeErrorMiddleware =
    (api: MiddlewareAPI<Dispatch, AppState>) =>
    (next: ReduxDispatch<UnknownAction>) =>
    (action: UnknownAction): UnknownAction => {
        next(action);

        if (!transactionsActions.addTransaction.match(action)) {
            return action;
        }

        const { transactions } = action.payload;
        const precomposedTx = api.getState().wallet.send?.precomposedTx;

        if (precomposedTx === undefined) {
            return action;
        }

        if (!isRbfTransaction(precomposedTx)) {
            return action;
        }

        const addedTransaction = transactions.find(tx => tx.txid === precomposedTx.prevTxid);

        // Fire only when the previous transaction was actually mined. A pending re-add of the same
        // transaction (blockbook reports pending txs with blockHeight -1, so blockHeight !== undefined
        // was true for those too) must not trigger the "already mined" error.
        if (addedTransaction && !isPending(addedTransaction)) {
            api.dispatch(replaceByFeeErrorThunk());
        }

        return action;
    };
