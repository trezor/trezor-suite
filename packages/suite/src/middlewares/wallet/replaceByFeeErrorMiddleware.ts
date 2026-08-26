import { type Dispatch, type UnknownAction } from '@reduxjs/toolkit';
import { type MiddlewareAPI } from 'redux';

import { transactionsActions } from '@suite-common/wallet-core/';
import { isRbfTransaction } from '@suite-common/wallet-utils';

import { type AppState } from 'src/types/suite';

import { replaceByFeeErrorThunk } from '../../actions/wallet/send/replaceByFeeErrorThunk';

export const replaceByFeeErrorMiddleware =
    (api: MiddlewareAPI<Dispatch<UnknownAction>, AppState>) =>
    (next: Dispatch<UnknownAction>) =>
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

        if (addedTransaction?.blockHeight !== undefined) {
            api.dispatch(replaceByFeeErrorThunk());
        }

        return action;
    };
