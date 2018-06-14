/* @flow */
'use strict';

import { combineReducers } from 'redux';
import { routerReducer } from 'react-router-redux';

import DOM from './DomReducer';
import connect from './TrezorConnectReducer';
import modal from './ModalReducer';

import common from './methods/CommonReducer';
import composeTx from './methods/ComposeTxReducer';
import getxpub from './methods/GetXpubReducer';
import ethgetaddress from './methods/EthereumGetAddressReducer';
import nemgetaddress from './methods/NEMGetAddressReducer';
import nemsigntx from './methods/NEMSignTxReducer';
import custom from './methods/CustomMessageReducer';

export default combineReducers({
    router: routerReducer,
    DOM,
    connect,
    modal,
    
    common,
    composeTx,
    getxpub,
    ethgetaddress,
    nemgetaddress,
    nemsigntx,
    custom,
});