import { combineReducers } from 'redux';
import signVerifyReducer from './signVerifyReducer';
import settingsReducer from './settingsReducer';
import fiatRateReducer from './fiatRateReducer';
import transactionReducer from './transactionReducer';
import discoveryReducer from './discoveryReducer';
import accountsReducer from './accountsReducer';
import selectedAccountReducer from './selectedAccountReducer';
import receiveReducer from './receiveReducer';
import sendFormReducer from './sendFormReducer';
import sendFormReducerCache from './sendFormReducerCache';
import feesReducer from './feesReducer';
import blockchainReducer from './blockchainReducer';

const WalletReducers = combineReducers({
    signVerify: signVerifyReducer,
    fiat: fiatRateReducer,
    settings: settingsReducer,
    transactions: transactionReducer,
    discovery: discoveryReducer,
    accounts: accountsReducer,
    selectedAccount: selectedAccountReducer,
    receive: receiveReducer,
    send: sendFormReducer,
    sendCache: sendFormReducerCache,
    fees: feesReducer,
    blockchain: blockchainReducer,
});

export default WalletReducers;
