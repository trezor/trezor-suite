/* @flow */
'use strict';

import { combineReducers } from 'redux';
import { routerReducer } from 'react-router-redux';

import DOM from './DomReducer.js';
import connect from './TrezorConnectReducer.js';
import modal from './ModalReducer.js';
import web3 from './Web3Reducer.js';
import addresses from './AddressesReducer.js';
import sendForm from './SendFormReducer.js';

export default combineReducers({
    router: routerReducer,
    DOM,
    connect,
    modal,
    web3,
    addresses,
    sendForm
});