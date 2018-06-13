/* @flow */
'use strict';

import { combineReducers } from 'redux';
import { routerReducer } from 'react-router-redux';

import DOM from './DomReducer';
import connect from './TrezorConnectReducer';
import modal from './ModalReducer';

import composeTx from './methods/ComposeTxReducer';
import getXpub from './methods/GetXpubReducer';
import nemSignTx from './methods/NEMSignTx';

export default combineReducers({
    router: routerReducer,
    DOM,
    connect,
    modal,
    
    composeTx,
    getXpub,
    nemSignTx,
});