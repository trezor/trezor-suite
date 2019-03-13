/* @flow */
'use strict';

import { combineReducers } from 'redux';
import { connectRouter } from 'connected-react-router';

import DOM from './DOMReducer';
import method from './MethodReducer';
import docs from './DocsReducer';
import connect from './TrezorConnectReducer';
import modal from './ModalReducer';

const reducers = {
    DOM,
    connect,
    modal,
    method,
    docs,
};

export default (history: any) => combineReducers({
    ...reducers,
    router: connectRouter(history),
});
