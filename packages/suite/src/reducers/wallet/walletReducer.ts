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
    type FiatRatesReducerDeps,
    type FiatRatesState,
    type FormDraftState,
    type PhishingReducerDeps,
    type PhishingState,
    type SendFormReducerDeps,
    type SendState,
    type StakeState,
    type StellarContractTokensDeps,
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

export type WalletReducerDeps = AccountsReducerDeps &
    BlockchainReducerDeps &
    EarnOnboardingSliceDeps &
    ExplorerReducerDeps &
    SendFormReducerDeps &
    TransactionsReducerDeps &
    WalletSettingsReducerDeps &
    FiatRatesReducerDeps &
    PhishingReducerDeps &
    StellarContractTokensDeps;

export type WalletReducer = Reducer<
    WalletState,
    UnknownAction,
    Partial<Omit<WalletState, 'graph' | 'coinjoin'>>
>;

export const createWalletReducer = (deps: WalletReducerDeps): WalletReducer => {
    const transactionsReducer = prepareTransactionsReducer(deps);
    const stellarContractTokensReducer = prepareStellarContractTokensReducer(deps);
    const phishingReducer = preparePhishingReducer(deps);
    const accountsReducer = prepareAccountsReducer(deps);
    const earnOnboardingReducer = prepareEarnOnboardingReducer(deps);
    const blockchainReducer = prepareBlockchainReducer(deps);
    const explorerReducer = prepareExplorerReducer(deps);
    const fiatRatesReducer = prepareFiatRatesReducer(deps);
    const discoveryReducer = prepareDiscoveryReducer(deps);
    const stakeReducer = prepareStakeReducer(deps);
    const sendFormReducer = prepareSendFormReducer(deps);
    const tradingReducer = prepareTradingReducer(deps);
    const walletSettingsReducer = prepareWalletSettingsReducer(deps);

    return combineReducers({
        fiat: fiatRatesReducer,
        graph: graphReducer,
        transactions: transactionsReducer,
        phishing: phishingReducer,
        discovery: discoveryReducer,
        accounts: accountsReducer,
        accountsRefreshTime: accountsRefreshTimeReducer,
        earnTransactions: earnTransactionsReducer,
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
        earnOnboarding: earnOnboardingReducer,
    });
};
