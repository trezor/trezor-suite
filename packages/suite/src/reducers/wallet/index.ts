import { combineReducers } from 'redux';
import notificationReducer from './notificationReducer';
import signVerifyReducer from './signVerifyReducer';
import settingsReducer from './settingsReducer';
import fiatRateReducer from './fiatRateReducer';
import tokensReducer from './tokenReducer';
import transactionReducer from './transactionReducer';
import discoveryReducer from './discoveryReducer';
import accountsReducer from './accountsReducer';

const WalletReducers = combineReducers({
    signVerify: signVerifyReducer,
    fiat: fiatRateReducer,
    settings: settingsReducer,
    notifications: notificationReducer,
    tokens: tokensReducer,
    transactions: transactionReducer,
    discovery: discoveryReducer,
    accounts: accountsReducer,
});

export default WalletReducers;
