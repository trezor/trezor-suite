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
import ethsigntx from './methods/EthereumSignTxReducer';
import nemgetaddress from './methods/NEMGetAddressReducer';
import nemsigntx from './methods/NEMSignTxReducer';
import stellarsigntx from './methods/StellarSignTxReducer';
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
    ethsigntx,
    nemgetaddress,
    nemsigntx,
    stellarsigntx,
    custom,
});