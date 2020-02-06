import { combineReducers } from 'redux';

import recovery from './recoveryReducer';

const SettingsReducers = combineReducers({
    recovery,
});

export default SettingsReducers;
