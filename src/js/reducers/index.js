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
import nemsigntx from './methods/NEMSignTxReducer';

export default combineReducers({
    router: routerReducer,
    DOM,
    connect,
    modal,
    
    common,
    composeTx,
    getxpub,
    nemsigntx,
});