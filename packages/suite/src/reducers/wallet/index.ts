import { combineReducers } from 'redux';
import notificationReducer from './notificationReducer';
import signVerifyReducer from './signVerifyReducer';
import settingsReducer from './settingsReducer';
import fiatRateReducer from './fiatRateReducer';
import summaryReducer from './summaryReducer';
import tokensReducer from './tokenReducer';
import localStorageReducer from './localStorageReducer';

const WalletReducers = combineReducers({
    signVerify: signVerifyReducer,
    fiat: fiatRateReducer,
    settings: settingsReducer,
    notifications: notificationReducer,
    summary: summaryReducer,
    tokens: tokensReducer,
    localStorage: localStorageReducer,
});

export default WalletReducers;
