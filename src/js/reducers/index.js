/* @flow */
'use strict';

import { combineReducers } from 'redux';
import { routerReducer } from 'react-router-redux';

import DOM from './AppReducer.js';
import localStorage from './LocalStorageReducer.js';
import connect from './TrezorConnectReducer.js';
import notifications from './NotificationReducer.js';
import modal from './ModalReducer.js';
import web3 from './Web3Reducer.js';
import accounts from './AccountsReducer.js';
import accountDetail from './AccountDetailReducer.js';
import sendForm from './SendFormReducer.js';
import receive from './ReceiveReducer.js';
import summary from './SummaryReducer.js';
import tokens from './TokensReducer.js';
import discovery from './DiscoveryReducer.js';

export default combineReducers({
    router: routerReducer,
    DOM,
    localStorage,
    connect,
    notifications,
    modal,
    web3,
    accounts,
    accountDetail,
    sendForm,
    receive,
    summary,
    tokens,
    discovery
});