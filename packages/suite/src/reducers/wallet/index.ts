import { combineReducers } from 'redux';
import notificationReducer from './notificationReducer';
import signVerifyReducer from './signVerifyReducer';
import settingsReducer from './settingsReducer';
import fiatRateReducer from './fiatRateReducer';

const WalletReducers = combineReducers({
    signVerify: signVerifyReducer,
    fiat: fiatRateReducer,
    settings: settingsReducer,
    notifications: notificationReducer,
});

export default WalletReducers;
