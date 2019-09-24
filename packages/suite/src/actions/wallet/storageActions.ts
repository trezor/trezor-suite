/**
 * TODO: move this logic to @suite-actions/storageActions
 */

export const foo = {};

// import * as transactionActions from '@wallet-actions/transactionActions';
// import { db, SuiteStorageUpdateMessage } from '@suite/storage';
// import SuiteDB from '@trezor/suite-storage';
// import { WALLET } from '@wallet-actions/constants';
// import { Dispatch, GetState } from '@suite-types';



// const updateReducers = (message: SuiteStorageUpdateMessage) => async (
//     dispatch: Dispatch,
//     getState: GetState,
// ) => {
//     if (message.store === 'txs') {
//         // txs objectStore was updated, we'll load transactions from db to reducer
//         const { app, params } = getState().router;
//         if (app !== 'wallet' || !params) return;
//         const { accountIndex } = params;
//         const txs = await db.getItemsExtended('txs', 'accountId-blockTime', {
//             key: accountIndex,
//         });
//         // @ts-ignore
//         dispatch(transactionActions.setTransactions(txs));
//     }
// };

// export const loadStorage = () => async (dispatch: Dispatch, _getState: GetState) => {
//     SuiteDB.isDBAvailable(async (isAvailable: boolean) => {
//         if (!isAvailable) {
//             // TODO: Display error for the user (eg. redirect to unsupported browser page)
//             console.warn('IndexedDB not supported');
//         } else {
//             // TODO: Since user can edit data in IDB outside of the Suite,
//             // maybe we could run some form of data validation? Or delete corrupted object stores.

//             // load transactions from indexedDB
//             const txs = await db.getItemsExtended('txs');
//             if (txs) {
//                 // @ts-ignore
//                 dispatch(transactionActions.setTransactions(txs));
//             }

//             db.onChange(event => {
//                 // listen on db changes from other windows
//                 const message = event.data;
//                 console.log('DB was updated from another window', message);
//                 dispatch(updateReducers(message));
//             });
//         }
//         // return dispatch({
//         //     type: WALLET.INIT_SUCCESS,
//         // });
//     });
// };
