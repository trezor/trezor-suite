import { type Reducer, type UnknownAction, combineReducers } from 'redux';

import { selectedAccountReducer } from '@suite/account';
import { type CoinjoinState, coinjoinReducer } from '@suite/coinjoin';
import { type TradingState, prepareTradingReducer } from '@suite-common/trading';
import {
    type AccountsReducerDeps,
    type AccountsRefreshTimeState,
    type AccountsState,
    type BlockchainReducerDeps,
    type EarnOnboardingSliceDeps,
    type EarnOnboardingState,
    type EarnTransactionsState,
    type ExplorerConfig,
    type ExplorerReducerDeps,
    type FiatRatesState,
    type FormDraftState,
    type PhishingState,
    type SendFormReducerDeps,
    type SendState,
    type StakeState,
    type StellarContractTokensState,
    type TransactionsReducerDeps,
    type TransactionsState,
    type TronStakeReducerState,
    type WalletSettingsReducerDeps,
    type YieldState,
    accountsRefreshTimeReducer,
    earnTransactionsReducer,
    feesReducer,
    prepareAccountsReducer,
    prepareBlockchainReducer,
    prepareDiscoveryReducer,
    prepareEarnOnboardingReducer,
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
import { type ReducersDep } from '@trezor/redux-utils';

import accountSearchReducer, { type AccountSearchState } from './accountSearchReducer';
import formDraftReducer from './formDraftReducer';
import graphReducer, { type GraphState } from './graphReducer';

export type WalletState = {
    fiat: FiatRatesState;
    graph: GraphState;
    transactions: TransactionsState;
    phishing: PhishingState;
    discovery: Discovery;
    accounts: AccountsState;
    accountsRefreshTime: AccountsRefreshTimeState;
    earnTransactions: EarnTransactionsState;
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
    earnOnboarding: EarnOnboardingState;
};

export type WalletReducersDeps = AccountsReducerDeps &
    BlockchainReducerDeps &
    EarnOnboardingSliceDeps &
    ExplorerReducerDeps &
    SendFormReducerDeps &
    TransactionsReducerDeps &
    WalletSettingsReducerDeps &
    ReducersDep<
        | 'storageLoadHistoricRates'
        | 'storageLoadPhishingMetadata'
        | 'storageLoadStellarContractTokens'
    >;

export const prepareWalletReducer = (
    extraDependencies: WalletReducersDeps,
): Reducer<WalletState, UnknownAction, Partial<Omit<WalletState, 'graph' | 'coinjoin'>>> =>
    combineReducers({
        fiat: prepareFiatRatesReducer(extraDependencies),
        graph: graphReducer,
        transactions: prepareTransactionsReducer(extraDependencies),
        phishing: preparePhishingReducer(extraDependencies),
        discovery: prepareDiscoveryReducer(extraDependencies),
        accounts: prepareAccountsReducer(extraDependencies),
        accountsRefreshTime: accountsRefreshTimeReducer,
        earnTransactions: earnTransactionsReducer,
        selectedAccount: selectedAccountReducer,
        fees: feesReducer,
        blockchain: prepareBlockchainReducer(extraDependencies),
        explorer: prepareExplorerReducer(extraDependencies),
        trading: prepareTradingReducer(extraDependencies),
        send: prepareSendFormReducer(extraDependencies),
        accountSearch: accountSearchReducer,
        formDrafts: formDraftReducer,
        coinjoin: coinjoinReducer,
        stake: prepareStakeReducer(extraDependencies),
        settings: prepareWalletSettingsReducer(extraDependencies),
        stablecoinYield: yieldReducer,
        stellarContractTokens: prepareStellarContractTokensReducer(extraDependencies),
        tronStake: tronStakeReducer,
        earnOnboarding: prepareEarnOnboardingReducer(extraDependencies),
    });
