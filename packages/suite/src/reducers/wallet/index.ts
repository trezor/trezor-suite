import { combineReducers } from 'redux';
import notificationReducer from './notificationReducer';
import signVerifyReducer from './signVerifyReducer';
import settingsReducer from './settingsReducer';

const WalletReducers = combineReducers({
    signVerify: signVerifyReducer,
    settings: settingsReducer,
    notifications: notificationReducer,
});

export default WalletReducers;
