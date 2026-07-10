import { combineReducers } from 'redux';

import { selectedAccountReducer } from '@suite/account';
import { coinjoinReducer } from '@suite/coinjoin';
import { receiveReducer } from '@suite/receive';
import { prepareTradingReducer } from '@suite-common/trading';
import {
    feesReducer,
    prepareAccountsReducer,
    prepareBlockchainReducer,
    prepareDiscoveryReducer,
    prepareExplorerReducer,
    prepareFiatRatesReducer,
    preparePhishingReducer,
    prepareSendFormReducer,
    prepareStakeReducer,
    prepareTransactionsReducer,
    prepareWalletSettingsReducer,
    stablecoinYieldReducer,
    tronStakeReducer,
} from '@suite-common/wallet-core';

import { extraDependencies } from 'src/support/extraDependencies';

import accountSearchReducer from './accountSearchReducer';
import formDraftReducer from './formDraftReducer';
import graphReducer from './graphReducer';

export const transactionsReducer = prepareTransactionsReducer(extraDependencies);
export const phishingReducer = preparePhishingReducer(extraDependencies);
export const accountsReducer = prepareAccountsReducer(extraDependencies);
export const blockchainReducer = prepareBlockchainReducer(extraDependencies);
export const explorerReducer = prepareExplorerReducer(extraDependencies);
export const fiatRatesReducer = prepareFiatRatesReducer(extraDependencies);
export const discoveryReducer = prepareDiscoveryReducer(extraDependencies);
export const stakeReducer = prepareStakeReducer(extraDependencies);
export const sendFormReducer = prepareSendFormReducer(extraDependencies);
export const tradingReducer = prepareTradingReducer(extraDependencies);
export const walletSettingsReducer = prepareWalletSettingsReducer(extraDependencies);

const WalletReducers = combineReducers({
    fiat: fiatRatesReducer,
    graph: graphReducer,
    transactions: transactionsReducer,
    phishing: phishingReducer,
    discovery: discoveryReducer,
    accounts: accountsReducer,
    selectedAccount: selectedAccountReducer,
    receive: receiveReducer,
    fees: feesReducer,
    blockchain: blockchainReducer,
    explorer: explorerReducer,
    trading: tradingReducer,
    send: sendFormReducer,
    accountSearch: accountSearchReducer,
    formDrafts: formDraftReducer,
    coinjoin: coinjoinReducer,
    stake: stakeReducer,
    settings: walletSettingsReducer,
    stablecoinYield: stablecoinYieldReducer,
    tronStake: tronStakeReducer,
});

export default WalletReducers;
