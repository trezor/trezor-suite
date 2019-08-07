import * as transactionActions from '@wallet-actions/transactionActions';
import * as settingsActions from '@wallet-actions/settingsActions';
import { fetchLocale } from '@suite-actions/languageActions.useNative';
import * as db from '@suite/storage';
import { StorageUpdateMessage } from '@suite/storage/types/index';
import { Dispatch, GetState, AppState } from '@suite-types';
import { STORAGE } from './constants/index';

export type StorageActions =
    | { type: typeof STORAGE.LOAD }
    | { type: typeof STORAGE.LOADED; payload: AppState }
    | { type: typeof STORAGE.ERROR; error: any };

const updateReducers = (message: StorageUpdateMessage) => async (
    dispatch: Dispatch,
    getState: GetState,
) => {
    if (message.store === 'txs') {
        // txs objecStore was updated, we'll load transactions from db to reducer
        const { accountId } = getState().router.params;
        const txs = await db.getTransactions(Number(accountId));
        // @ts-ignore
        dispatch(transactionActions.setTransactions(txs));
    }
};

export const load = () => async (dispatch: Dispatch, getState: GetState) => {
    db.isIndexedDBAvailable(async (isAvailable: any) => {
        if (!isAvailable) {
            // TODO: Display error for the user (eg. redirect to unsupported browser page)
            console.warn('IndexedDB not supported');
        } else {
            // TODO: Since user can edit data in IDB outside of the Suite,
            // maybe we could run some form of data validation? Or delete corrupted object stores.

            //  load transactions from indexedDB
            const txs = await db.getTransactions();
            if (txs) {
                // @ts-ignore
                dispatch(transactionActions.setTransactions(txs));
            }

            //  load wallet settings from indexedDB
            const walletSettings = await db.getWalletSettings();
            if (walletSettings) {
                // @ts-ignore
                dispatch(settingsActions.fromStorage(walletSettings));
            }

            //  load wallet settings from indexedDB
            const suiteSettings = await db.getSuiteSettings();
            if (suiteSettings && suiteSettings.language) {
                // @ts-ignore
                dispatch(fetchLocale(suiteSettings.language));
            }

            db.onChange(event => {
                // listen on db changes from other windows
                const message = event.data;
                console.log('DB was updated from another window', message);
                dispatch(updateReducers(message));
            });
        }
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
    });
};
