import { combineReducers } from 'redux';
import signVerifyReducer from './signVerifyReducer';
import settingsReducer from './settingsReducer';

const WalletReducers = combineReducers({
    signVerify: signVerifyReducer,
    settings: settingsReducer,
});

export default WalletReducers;
