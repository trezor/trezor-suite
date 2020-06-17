import { combineReducers } from 'redux';
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

const WalletReducers = combineReducers({
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
});

export default WalletReducers;
