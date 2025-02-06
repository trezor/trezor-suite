import { MiddlewareAPI } from 'redux';

import { transactionsActions } from '@suite-common/wallet-core/';
import { isRbfTransaction } from '@suite-common/wallet-utils';

import { Action, AppState, Dispatch } from 'src/types/suite';

import { replaceByFeeErrorThunk } from '../../actions/wallet/send/replaceByFeeErrorThunk';

export const replaceByFeeErrorMiddleware =
    (api: MiddlewareAPI<Dispatch, AppState>) =>
    (next: Dispatch) =>
    (action: Action): Action => {
        next(action);

        if (transactionsActions.addTransaction.match(action)) {
            const { transactions } = action.payload;

            const precomposedTx = api.getState().wallet.send?.precomposedTx;

            if (precomposedTx !== undefined && isRbfTransaction(precomposedTx)) {
                const addedTransaction = transactions.find(
                    tx => tx.txid === precomposedTx.prevTxid,
                );

                if (addedTransaction !== undefined && addedTransaction.blockHeight !== undefined) {
                    api.dispatch(replaceByFeeErrorThunk());
                }
            }
        }

        return action;
    };
