import { combineReducers } from 'redux';

import { prepareConnectPopupReducer } from '@suite-common/connect-popup';
import { prepareTradingReducer } from '@suite-common/trading';
import {
    feesReducer,
    prepareAccountsReducer,
    prepareBlockchainReducer,
    prepareDiscoveryReducer,
    prepareFiatRatesReducer,
    prepareSendFormReducer,
    prepareStakeReducer,
    prepareTransactionsReducer,
} from '@suite-common/wallet-core';
import { prepareWalletConnectReducer } from '@suite-common/walletconnect';

import { extraDependencies } from 'src/support/extraDependencies';

import accountSearchReducer from './accountSearchReducer';
import cardanoStakingReducer from './cardanoStakingReducer';
import { coinjoinReducer } from './coinjoinReducer';
import formDraftReducer from './formDraftReducer';
import graphReducer from './graphReducer';
import receiveReducer from './receiveReducer';
import selectedAccountReducer from './selectedAccountReducer';
import settingsReducer from './settingsReducer';
import { tradingReducer } from './tradingReducer';

export const transactionsReducer = prepareTransactionsReducer(extraDependencies);
export const accountsReducer = prepareAccountsReducer(extraDependencies);
export const blockchainReducer = prepareBlockchainReducer(extraDependencies);
export const fiatRatesReducer = prepareFiatRatesReducer(extraDependencies);
export const discoveryReducer = prepareDiscoveryReducer(extraDependencies);
export const stakeReducer = prepareStakeReducer(extraDependencies);
export const sendFormReducer = prepareSendFormReducer(extraDependencies);
export const connectPopupReducer = prepareConnectPopupReducer(extraDependencies);
export const walletConnectReducer = prepareWalletConnectReducer(extraDependencies);
export const tradingNewReducer = prepareTradingReducer(extraDependencies);

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
    trading: tradingReducer,
    tradingNew: tradingNewReducer, // TODO: trading - tradingNew is temporary
    send: sendFormReducer,
    accountSearch: accountSearchReducer,
    formDrafts: formDraftReducer,
    cardanoStaking: cardanoStakingReducer,
    coinjoin: coinjoinReducer,
    stake: stakeReducer,
    connectPopup: connectPopupReducer,
    walletConnect: walletConnectReducer,
});

export default WalletReducers;
