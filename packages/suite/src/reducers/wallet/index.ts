import { combineReducers } from 'redux';
import signVerifyReducer from './signVerifyReducer';
import settingsReducer from './settingsReducer';
import fiatRateReducer from './fiatRatesReducer';
import graphReducer from './graphReducer';
import transactionReducer from './transactionReducer';
import discoveryReducer from './discoveryReducer';
import accountsReducer from './accountsReducer';
import selectedAccountReducer from './selectedAccountReducer';
import receiveReducer from './receiveReducer';
import feesReducer from './feesReducer';
import blockchainReducer from './blockchainReducer';
import coinmarketReducer from './coinmarketReducer';
import sendFormReducer from './sendFormReducer';
import accountSearchReducer from './accountSearchReducer';

const WalletReducers = combineReducers({
    signVerify: signVerifyReducer,
    fiat: fiatRateReducer,
    graph: graphReducer,
    settings: settingsReducer,
    transactions: transactionReducer,
    discovery: discoveryReducer,
    accounts: accountsReducer,
    selectedAccount: selectedAccountReducer,
    receive: receiveReducer,
    fees: feesReducer,
    blockchain: blockchainReducer,
    coinmarket: coinmarketReducer,
    send: sendFormReducer,
    accountSearch: accountSearchReducer,
});

export default WalletReducers;
