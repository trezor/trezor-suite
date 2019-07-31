import { Dispatch, GetState, AppState } from '@suite-types/index';
import * as transactionActions from '@wallet-actions/transactionActions';
import * as settingsActions from '@wallet-actions/settingsActions';
import * as db from '@suite/storage';
import { STORAGE } from './constants/index';

export type StorageActions =
    | { type: typeof STORAGE.LOAD }
    | { type: typeof STORAGE.LOADED; payload: AppState }
    | { type: typeof STORAGE.ERROR; error: any };

const updateReducers = (message: db.StorageUpdateMessage) => async (
    dispatch: Dispatch,
    getState: GetState,
) => {
    if (message.store === 'txs') {
        // txs objecStore was updated, we'll load transactions from db to reducer
        const { accountId } = getState().router.params;
        const txs = await db.getTransactions(Number(accountId));
        // @ts-ignore
        dispatch(transactionActions.fromStorage(txs));
    }
};

export const load = () => async (dispatch: Dispatch, getState: GetState) => {
    if (!db.isIndexedDBAvailable()) {
        // TODO: Display error for the user (eg. redirect to unsupported browser page)
        // Firefox doesn't support indexedDB while in incognito mode. Mozilla is working on it.
        // https://bugzilla.mozilla.org/show_bug.cgi?id=781982
        console.warn('IndexedDB not supported');
        // return;
    }

    // TODO: Since user can edit data in IDB outside of the Suite,
    // maybe we could run some form of data validation? Or delete corrupted object stores.

    //  load transactions from indexedDB
    const txs = await db.getTransactions();
    if (txs) {
        // @ts-ignore
        dispatch(transactionActions.fromStorage(txs));
    }

    //  load wallet settings from indexedDB
    const settings = await db.getWalletSettings();
    if (settings) {
        // @ts-ignore
        dispatch(settingsActions.fromStorage(settings));
    }

    db.onChange(event => {
        // listen on db changes from other windows
        const message = event.data;
        console.log('DB was updated from another window', message);
        dispatch(updateReducers(message));
    });
    const reducersState = getState();
    return dispatch({
        type: STORAGE.LOADED,
        payload: {
            ...reducersState,
            suite: {
                ...reducersState.suite,
                loaded: true,
            },
        },
    });
};
