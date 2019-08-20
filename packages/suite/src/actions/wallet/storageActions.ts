import * as transactionActions from '@wallet-actions/transactionActions';
import * as settingsActions from '@wallet-actions/settingsActions';
import * as db from '@trezor/suite-storage';
import { WALLET } from '@wallet-actions/constants';
import { Dispatch, GetState } from '@suite-types';

const updateReducers = (message: db.StorageUpdateMessage) => async (
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

export const loadStorage = () => async (dispatch: Dispatch, _getState: GetState) => {
    db.isDBAvailable(async (isAvailable: any) => {
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

            db.onChange(event => {
                // listen on db changes from other windows
                const message = event.data;
                console.log('DB was updated from another window', message);
                dispatch(updateReducers(message));
            });
        }
        return dispatch({
            type: WALLET.INIT_SUCCESS,
        });
    });
};
