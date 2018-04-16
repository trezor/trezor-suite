/* @flow */
'use strict';

import { combineReducers } from 'redux';
import { routerReducer } from 'react-router-redux';

import log from './LogReducer.js';
import localStorage from './LocalStorageReducer.js';
import connect from './TrezorConnectReducer.js';
import notifications from './NotificationReducer.js';
import modal from './ModalReducer.js';
import web3 from './Web3Reducer.js';
import accounts from './AccountsReducer.js';
import abstractAccount from './AbstractAccountReducer.js';
import sendForm from './SendFormReducer.js';
import receive from './ReceiveReducer.js';
import summary from './SummaryReducer.js';
import tokens from './TokensReducer.js';
import discovery from './DiscoveryReducer.js';
import pending from './PendingTxReducer.js';
import fiat from './FiatRateReducer.js';
import wallet from './WalletReducer.js';

const reducers = {
    router: routerReducer,
    log,
    localStorage,
    connect,
    notifications,
    modal,
    web3,
    accounts,
    abstractAccount,
    sendForm,
    receive,
    summary,
    tokens,
    discovery,
    pending,
    fiat,
    wallet
}


export type Reducers = typeof reducers;
type $ExtractFunctionReturn = <V>(v: (...args: any) => V) => V;
export type ReducersState = $ObjMap<Reducers, $ExtractFunctionReturn>;




export default combineReducers(reducers);

// export type Reducers = {
//     router: any;
//     log: any;

//     connect: TrezorConnectState;
//     accounts: Array<Account>;
//     tokens: Array<Token>;
//     pending: Array<PendingTx>;
//     discovery: Array<Discovery>;
//     localStorage: LocalStorageState;
// }