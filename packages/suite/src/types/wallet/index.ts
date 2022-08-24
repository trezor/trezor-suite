import { ReceiveAction } from '@wallet-actions/receiveActions';
import { SignVerifyAction } from '@wallet-actions/signVerifyActions';
import { CoinmarketBuyAction } from '@wallet-actions/coinmarketBuyActions';
import { CoinmarketExchangeAction } from '@wallet-actions/coinmarketExchangeActions';
import { CoinmarketSellAction } from '@wallet-actions/coinmarketSellActions';
import { CoinMarketSpendAction } from '@wallet-actions/coinmarketSpendActions';
import { CoinmarketSavingsAction } from '@wallet-actions/coinmarketSavingsActions';
import { CoinmarketCommonAction } from '@wallet-actions/coinmarket/coinmarketCommonActions';
import { DiscoveryAction } from '@wallet-actions/discoveryActions';
import { FiatRatesAction } from '@wallet-actions/fiatRatesActions';
import { GraphAction } from '@wallet-actions/graphActions';
import { BlockchainAction } from '@wallet-actions/blockchainActions';
import { SendFormAction } from '@wallet-actions/sendFormActions';
import { AccountSearchAction } from '@wallet-actions/accountSearchActions';
import { TransactionAction } from '@wallet-actions/transactionActions';
import { FormDraftAction } from '@wallet-actions/formDraftActions';
import { CardanoStakingAction } from '@wallet-actions/cardanoStakingActions';
import { PollingAction } from '@wallet-actions/pollingActions';
import { CoinjoinAccountAction } from '@wallet-actions/coinjoinAccountActions';
import { CoinjoinClientAction } from '@wallet-actions/coinjoinClientActions';
import { NETWORKS } from '@wallet-config';
import { ArrayElement } from '@trezor/type-utils';
import { accountsActions } from '@suite-common/wallet-core';

export type Network = ArrayElement<typeof NETWORKS>;
export type NetworkSymbol = Network['symbol'];
// reexport
export type { Icon } from './iconTypes';
export type { BackendType, CustomBackend } from './backend';
export type { CoinFiatRates, TickerId } from '@wallet-types/fiatRates';
export type { Discovery } from '@wallet-reducers/discoveryReducer';
export type DiscoveryStatus =
    | {
          status: 'loading';
          type: 'waiting-for-device' | 'auth' | 'auth-confirm' | 'discovery';
      }
    | {
          status: 'exception';
          type:
              | 'auth-failed'
              | 'auth-confirm-failed'
              | 'discovery-empty'
              | 'discovery-failed'
              | 'device-unavailable';
      };
export type {
    Account,
    WalletAccountTransaction,
    RbfTransactionParams,
} from '@suite-common/wallet-types';
export type { WalletParams } from '@suite-utils/router';
export type { ReceiveInfo } from '@wallet-reducers/receiveReducer';

/*
this action union types are bad, we need it only for legacy reason.
(old redux and redux/toolkit action type compatibility e.g. in middlewares)
 */
type AccountsAction = ReturnType<typeof accountsActions[keyof typeof accountsActions]>;

export type WalletAction =
    | BlockchainAction
    | ReceiveAction
    | SignVerifyAction
    | TransactionAction
    | FiatRatesAction
    | GraphAction
    | DiscoveryAction
    | CoinmarketExchangeAction
    | CoinmarketBuyAction
    | CoinMarketSpendAction
    | CoinmarketSellAction
    | CoinmarketSavingsAction
    | CoinmarketCommonAction
    | SendFormAction
    | AccountSearchAction
    | FormDraftAction
    | CardanoStakingAction
    | PollingAction
    | CoinjoinAccountAction
    | CoinjoinClientAction
    | AccountsAction;
