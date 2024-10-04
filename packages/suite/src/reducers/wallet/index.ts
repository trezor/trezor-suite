import { combineReducers } from 'redux';

import {
    prepareAccountsReducer,
    prepareFiatRatesReducer,
    prepareTransactionsReducer,
    prepareBlockchainReducer,
    prepareDiscoveryReducer,
    prepareStakeReducer,
    prepareSendFormReducer,
    feesReducer,
} from '@suite-common/wallet-core';

import { extraDependencies } from 'src/support/extraDependencies';

import settingsReducer from './settingsReducer';
import graphReducer from './graphReducer';
import selectedAccountReducer from './selectedAccountReducer';
import receiveReducer from './receiveReducer';
import { coinmarketReducer } from './coinmarketReducer';
import accountSearchReducer from './accountSearchReducer';
import formDraftReducer from './formDraftReducer';
import cardanoStakingReducer from './cardanoStakingReducer';
import { coinjoinReducer } from './coinjoinReducer';

export const transactionsReducer = prepareTransactionsReducer(extraDependencies);
export const accountsReducer = prepareAccountsReducer(extraDependencies);
export const blockchainReducer = prepareBlockchainReducer(extraDependencies);
export const fiatRatesReducer = prepareFiatRatesReducer(extraDependencies);
export const discoveryReducer = prepareDiscoveryReducer(extraDependencies);
export const stakeReducer = prepareStakeReducer(extraDependencies);
export const sendFormReducer = prepareSendFormReducer(extraDependencies);

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
    coinjoin: coinjoinReducer,
    stake: stakeReducer,
});

export default WalletReducers;
