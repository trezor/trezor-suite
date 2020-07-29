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
import sendFormReducer from './sendFormReducer';
import feesReducer from './feesReducer';
import blockchainReducer from './blockchainReducer';
import coinmarketReducer from './coinmarketReducer';

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
    send: sendFormReducer,
    fees: feesReducer,
    blockchain: blockchainReducer,
    coinmarket: coinmarketReducer,
});

export default WalletReducers;
