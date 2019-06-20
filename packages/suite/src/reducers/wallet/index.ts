import { combineReducers } from 'redux';
import signVerifyReducer from './signVerifyReducer';

const WalletReducers = combineReducers({
    signVerify: signVerifyReducer,
});

export default WalletReducers;
