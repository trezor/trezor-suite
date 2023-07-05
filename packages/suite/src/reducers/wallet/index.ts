import { combineReducers } from 'redux';
import { extraDependencies } from 'src/support/extraDependencies';

import {
    prepareAccountsReducer,
    prepareFiatRatesReducer,
    prepareTransactionsReducer,
    prepareBlockchainReducer,
} from '@suite-common/wallet-core';

import settingsReducer from './settingsReducer';
import graphReducer from './graphReducer';
import { prepareDiscoveryReducer } from './discoveryReducer';
import selectedAccountReducer from './selectedAccountReducer';
import receiveReducer from './receiveReducer';
import feesReducer from './feesReducer';
import coinmarketReducer from './coinmarketReducer';
import sendFormReducer from './sendFormReducer';
import accountSearchReducer from './accountSearchReducer';
import formDraftReducer from './formDraftReducer';
import cardanoStakingReducer from './cardanoStakingReducer';
import pollingReducer from './pollingReducer';
import { coinjoinReducer } from './coinjoinReducer';

export const transactionsReducer = prepareTransactionsReducer(extraDependencies);
export const accountsReducer = prepareAccountsReducer(extraDependencies);
export const blockchainReducer = prepareBlockchainReducer(extraDependencies);
export const fiatRatesReducer = prepareFiatRatesReducer(extraDependencies);
export const discoveryReducer = prepareDiscoveryReducer(extraDependencies);

const WalletReducers = combineReducers({
    fiat: fiatRatesReducer,
    graph: graphReducer,
    settings: settingsReducer,
    transactions: transactionsReducer,
    discovery: discoveryReducer,
    accounts: accountsReducer,
    selectedAccount: selectedAccountReducer,
    receive: receiveReducer,
    fees: feesReducer,
    blockchain: blockchainReducer,
    coinmarket: coinmarketReducer,
    send: sendFormReducer,
    accountSearch: accountSearchReducer,
    formDrafts: formDraftReducer,
    cardanoStaking: cardanoStakingReducer,
    pollings: pollingReducer,
    coinjoin: coinjoinReducer,
});

export default WalletReducers;
