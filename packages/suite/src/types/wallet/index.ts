import { ReceiveAction } from '@wallet-actions/receiveActions';
import { SignVerifyAction } from '@wallet-actions/signVerifyActions';
import { CoinmarketBuyAction } from '@wallet-actions/coinmarketBuyActions';
import { CoinmarketExchangeAction } from '@wallet-actions/coinmarketExchangeActions';
import { CoinmarketSellAction } from '@wallet-actions/coinmarketSellActions';
import { CoinMarketSpendAction } from '@wallet-actions/coinmarketSpendActions';
import { CoinmarketSavingsAction } from '@wallet-actions/coinmarketSavingsActions';
import { CoinmarketCommonAction } from '@wallet-actions/coinmarket/coinmarketCommonActions';
import { DiscoveryAction } from '@wallet-actions/discoveryActions';
import { AccountAction } from '@wallet-actions/accountActions';
import { FiatRatesAction } from '@wallet-actions/fiatRatesActions';
import { GraphAction } from '@wallet-actions/graphActions';
import { BlockchainAction } from '@wallet-actions/blockchainActions';
import { SendFormAction } from '@wallet-actions/sendFormActions';
import { AccountSearchAction } from '@wallet-actions/accountSearchActions';
import { TransactionAction } from '@wallet-actions/transactionActions';
import { SelectedAccountAction } from '@wallet-actions/selectedAccountActions';
import { FormDraftAction } from '@wallet-actions/formDraftActions';
import { CardanoStakingAction } from '@wallet-actions/cardanoStakingActions';
import { PollingAction } from '@wallet-actions/pollingActions';
import { NETWORKS } from '@wallet-config';
import { ArrayElement } from '@trezor/type-utils';

export type Network = ArrayElement<typeof NETWORKS>;
export type NetworkSymbol = Network['symbol'];
// reexport
export type { Icon } from './iconTypes';
export type { BackendType, CustomBackend } from './backend';
export type { Account } from '@wallet-reducers/accountsReducer';
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
export type { WalletAccountTransaction, RbfTransactionParams } from '@suite-common/wallet-types';
export type { WalletParams } from '@suite-utils/router';
export type { ReceiveInfo } from '@wallet-reducers/receiveReducer';

export type WalletAction =
    | BlockchainAction
    | ReceiveAction
    | SignVerifyAction
    | TransactionAction
    | FiatRatesAction
    | GraphAction
    | DiscoveryAction
    | AccountAction
    | SelectedAccountAction
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
    | PollingAction;
