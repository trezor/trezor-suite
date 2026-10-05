import { combineReducers } from 'redux';

import method from './methodReducer';
import { networksReducer } from './networksReducer';
import connect from './trezorConnectReducer';

export const reducers = combineReducers({
    method,
    networks: networksReducer,
    connect,
});

export type AppState = ReturnType<typeof reducers>;
