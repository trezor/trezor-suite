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
): Reducer<WalletState, UnknownAction, Partial<Omit<WalletState, 'graph' | 'coinjoin'>>> => {
    const transactionsReducer = prepareTransactionsReducer(extraDependencies);
    const stellarContractTokensReducer = prepareStellarContractTokensReducer(extraDependencies);
    const phishingReducer = preparePhishingReducer(extraDependencies);
    const accountsReducer = prepareAccountsReducer(extraDependencies);
    const earnOnboardingReducer = prepareEarnOnboardingReducer(extraDependencies);
    const blockchainReducer = prepareBlockchainReducer(extraDependencies);
    const explorerReducer = prepareExplorerReducer(extraDependencies);
    const fiatRatesReducer = prepareFiatRatesReducer(extraDependencies);
    const discoveryReducer = prepareDiscoveryReducer(extraDependencies);
    const stakeReducer = prepareStakeReducer(extraDependencies);
    const sendFormReducer = prepareSendFormReducer(extraDependencies);
    const tradingReducer = prepareTradingReducer(extraDependencies);
    const walletSettingsReducer = prepareWalletSettingsReducer(extraDependencies);

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
