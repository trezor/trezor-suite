import { combineReducers } from 'redux';
import signVerifyReducer from './signVerifyReducer';
import settingsReducer from './settingsReducer';
import fiatRateReducer from './fiatRateReducer.ts';

const WalletReducers = combineReducers({
    signVerify: signVerifyReducer,
    fiat: settingsReducer,
    settings: settingsReducer,
});

export default WalletReducers;
