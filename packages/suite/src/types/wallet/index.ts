import { ReceiveAction } from '@wallet-actions/receiveActions';
import { SignVerifyAction } from '@wallet-actions/signVerifyActions';
import { CoinmarketBuyAction } from '@wallet-actions/coinmarketBuyActions';
import { CoinmarketExchangeAction } from '@wallet-actions/coinmarketExchangeActions';
import { CoinmarketSellAction } from '@wallet-actions/coinmarketSellActions';
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
import { NETWORKS } from '@wallet-config';
import { ArrayElement } from '../utils';

export type Network = ArrayElement<typeof NETWORKS>;
// reexport
export type { NetworkToken, Token } from './tokenTypes';
export type { Icon } from './iconTypes';
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
export type { WalletParams } from '@suite-utils/router';
export type {
    WalletAccountTransaction,
    RbfTransactionParams,
} from '@wallet-reducers/transactionReducer';
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
    | CoinmarketSellAction
    | CoinmarketCommonAction
    | SendFormAction
    | AccountSearchAction;
