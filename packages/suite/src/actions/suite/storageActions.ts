import { Dispatch, GetState, AppState } from '@suite-types/index';
import * as transactionActions from '@wallet-actions/transactionActions';
import * as db from '@suite/storage';
import { onChange } from '@suite/storage';
import { STORAGE } from './constants/index';

export type StorageActions =
    | { type: typeof STORAGE.LOAD }
    | { type: typeof STORAGE.LOADED; payload: AppState }
    | { type: typeof STORAGE.ERROR; error: any };

export const load = () => async (dispatch: Dispatch, getState: GetState) => {
    //  load transactions from indexedDB
    const txs = await db.getTransactions();
    // @ts-ignore
    dispatch(transactionActions.fromStorage(txs));

    // TODO: load state from indexed db
    const state: AppState = await new Promise(resolve => {
        setTimeout(() => {
            const reducersState = getState();
            resolve({
                ...reducersState,
                suite: {
                    ...reducersState.suite,
                    loaded: true,
                },
            });
        }, 100);
    });

    onChange(event => {
        console.log(event);
        const message = event.data;
        console.log('A message occurred', message);
    });

    return dispatch({
        type: STORAGE.LOADED,
        payload: state,
    });
};
