import { combineReducers } from 'redux';

import method from './methodReducer';
import connect from './trezorConnectReducer';

export const reducers = combineReducers({
    method,
    connect,
});

export type AppState = ReturnType<typeof reducers>;
