import { type Reducer, type UnknownAction, combineReducers } from 'redux';

import { selectedAccountReducer } from '@suite/account';
import { type CoinjoinState, coinjoinReducer } from '@suite/coinjoin';
import { type TradingState, prepareTradingReducer } from '@suite-common/trading';
import {
    type AccountsRefreshTimeState,
    type AccountsState,
    type ExplorerConfig,
    type FiatRatesState,
    type FormDraftState,
    type PhishingState,
    type SendState,
    type StakeState,
    type StellarContractTokensState,
    type TransactionsState,
    type TronStakeReducerState,
    type YieldState,
    accountsRefreshTimeReducer,
    feesReducer,
    prepareAccountsReducer,
    prepareBlockchainReducer,
    prepareDiscoveryReducer,
    prepareExplorerReducer,
    prepareFiatRatesReducer,
    preparePhishingReducer,
    prepareSendFormReducer,
    prepareStakeReducer,
    prepareStellarContractTokensReducer,
    prepareTransactionsReducer,
    prepareWalletSettingsReducer,
    tronStakeReducer,
    yieldReducer,
} from '@suite-common/wallet-core';
import {
    type BlockchainNetworks,
    type Discovery,
    type FeesState,
    type SelectedAccountStatus,
    type WalletSettings,
} from '@suite-common/wallet-types';

import { extraDependencies } from 'src/support/extraDependencies';

import accountSearchReducer, { type AccountSearchState } from './accountSearchReducer';
import formDraftReducer from './formDraftReducer';
import graphReducer, { type GraphState } from './graphReducer';

export const transactionsReducer = prepareTransactionsReducer(extraDependencies);
export const stellarContractTokensReducer = prepareStellarContractTokensReducer(extraDependencies);
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

export type WalletState = {
    fiat: FiatRatesState;
    graph: GraphState;
    transactions: TransactionsState;
    phishing: PhishingState;
    discovery: Discovery;
    accounts: AccountsState;
    accountsRefreshTime: AccountsRefreshTimeState;
    selectedAccount: SelectedAccountStatus;
    fees: FeesState;
    blockchain: BlockchainNetworks;
    explorer: ExplorerConfig;
    trading: TradingState;
    send: SendState;
    accountSearch: AccountSearchState;
    formDrafts: FormDraftState;
    coinjoin: CoinjoinState;
    stake: StakeState;
    settings: WalletSettings;
    stablecoinYield: YieldState;
    stellarContractTokens: StellarContractTokensState;
    tronStake: TronStakeReducerState;
};

export const walletReducers: Reducer<
    WalletState,
    UnknownAction,
    Partial<Omit<WalletState, 'graph' | 'coinjoin'>>
> = combineReducers({
    fiat: fiatRatesReducer,
    graph: graphReducer,
    transactions: transactionsReducer,
    phishing: phishingReducer,
    discovery: discoveryReducer,
    accounts: accountsReducer,
    accountsRefreshTime: accountsRefreshTimeReducer,
    selectedAccount: selectedAccountReducer,
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
    stablecoinYield: yieldReducer,
    stellarContractTokens: stellarContractTokensReducer,
    tronStake: tronStakeReducer,
});
