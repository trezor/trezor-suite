/* @flow */
import { combineReducers } from 'redux';
import { routerReducer } from 'react-router-redux';

import log from 'reducers/LogReducer';
import localStorage from 'reducers/LocalStorageReducer';
import connect from 'reducers/TrezorConnectReducer';
import notifications from 'reducers/NotificationReducer';
import modal from 'reducers/ModalReducer';
import web3 from 'reducers/Web3Reducer';
import accounts from 'reducers/AccountsReducer';
import selectedAccount from 'reducers/SelectedAccountReducer';
import sendForm from 'reducers/SendFormReducer';
import receive from 'reducers/ReceiveReducer';
import summary from 'reducers/SummaryReducer';
import tokens from 'reducers/TokensReducer';
import discovery from 'reducers/DiscoveryReducer';
import pending from 'reducers/PendingTxReducer';
import fiat from 'reducers/FiatRateReducer';
import wallet from 'reducers/WalletReducer';
import devices from 'reducers/DevicesReducer';
import blockchain from 'reducers/BlockchainReducer';
import signVerify from 'reducers/SignVerifyReducer';

const reducers = {
    router: routerReducer,
    log,
    localStorage,
    connect,
    notifications,
    modal,
    web3,
    accounts,
    selectedAccount,
    sendForm,
    receive,
    summary,
    tokens,
    discovery,
    pending,
    fiat,
    wallet,
    devices,
    blockchain,
    signVerify,
};

export type Reducers = typeof reducers;
type $ExtractFunctionReturn = <V>(v: (...args: any) => V) => V;
export type ReducersState = $ObjMap<Reducers, $ExtractFunctionReturn>;

export default combineReducers(reducers);
