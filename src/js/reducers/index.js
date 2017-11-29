/* @flow */
'use strict';

import { combineReducers } from 'redux';
import { routerReducer } from 'react-router-redux';

import DOM from './DomReducer.js';
import connect from './TrezorConnectReducer.js';
import modal from './ModalReducer.js';

export default combineReducers({
    router: routerReducer,
    DOM,
    connect,
    modal
});