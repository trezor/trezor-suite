import { combineReducers } from 'redux';
import notificationReducer from './notificationReducer';
import signVerifyReducer from './signVerifyReducer';
import settingsReducer from './settingsReducer';
import fiatRateReducer from './fiatRateReducer';
import tokensReducer from './tokenReducer';
import transactionReducer from './transactionReducer';

const WalletReducers = combineReducers({
    signVerify: signVerifyReducer,
    fiat: fiatRateReducer,
    settings: settingsReducer,
    notifications: notificationReducer,
    tokens: tokensReducer,
    transactions: transactionReducer,
});

export default WalletReducers;
