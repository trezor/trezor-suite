import { ReceiveActions } from '@wallet-actions/receiveActions';
import { SignVerifyActions } from '@wallet-actions/signVerifyActions';
import { CoinmarketBuyActions } from '@wallet-actions/coinmarketBuyActions';
import { CoinmarketExchangeActions } from '@wallet-actions/coinmarketExchangeActions';
import { DiscoveryActions } from '@wallet-actions/discoveryActions';
import { AccountActions } from '@wallet-actions/accountActions';
import { FiatRatesActions } from '@wallet-actions/fiatRatesActions';
import { GraphActions } from '@wallet-actions/graphActions';
import { BlockchainActions } from '@wallet-actions/blockchainActions';
import { SendFormActions } from '@wallet-actions/sendFormActions';
import { AccountSearchActions } from '@wallet-actions/accountSearchActions';
import { TransactionAction } from '@wallet-actions/transactionActions';
import { SelectedAccountActions } from '@wallet-actions/selectedAccountActions';
import { NETWORKS } from '@wallet-config';
import { ArrayElement } from '../utils';

export type Network = ArrayElement<typeof NETWORKS>;
// reexport
export type { NetworkToken, Token } from './tokenTypes';
export type { Icon } from './iconTypes';
export type { Account } from '@wallet-reducers/accountsReducer';
export type { CoinFiatRates, FiatTicker } from '@wallet-types/fiatRates';
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
export type { WalletAccountTransaction } from '@wallet-reducers/transactionReducer';
export type { ReceiveInfo } from '@wallet-reducers/receiveReducer';

export type WalletAction =
    | BlockchainActions
    | ReceiveActions
    | SignVerifyActions
    | TransactionAction
    | FiatRatesActions
    | GraphActions
    | DiscoveryActions
    | AccountActions
    | SelectedAccountActions
    | CoinmarketExchangeActions
    | CoinmarketBuyActions
    | SendFormActions
    | AccountSearchActions;
