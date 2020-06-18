import { ReceiveActions } from '@wallet-actions/receiveActions';

import {
    State as SendState,
    SendFormActions,
    SendFormBtcActions,
    SendFormXrpActions,
    SendFormEthActions,
} from '@wallet-types/sendForm';
import {
    FiatTicker as FiatTicker$,
    CoinFiatRates as CoinFiatRates$,
} from '@wallet-types/fiatRates';
import { DiscoveryActions } from '@wallet-actions/discoveryActions';
import { AccountActions } from '@wallet-actions/accountActions';
import { Discovery as Discovery$ } from '@wallet-reducers/discoveryReducer';
import { Account as Account$ } from '@wallet-reducers/accountsReducer';
import { WalletAccountTransaction as WalletAccountTransaction$ } from '@wallet-reducers/transactionReducer';
import { ReceiveInfo as ReceiveInfo$ } from '@wallet-reducers/receiveReducer';

import { FiatRatesActions } from '@wallet-actions/fiatRatesActions';
import { GraphActions } from '@wallet-actions/graphActions';
import { BlockchainActions } from '@wallet-actions/blockchainActions';
import { TransactionAction } from '@wallet-actions/transactionActions';
import { SelectedAccountActions } from '@wallet-actions/selectedAccountActions';
import { NETWORKS, EXTERNAL_NETWORKS } from '@wallet-config';
import { Icon as Icon$ } from './iconTypes';
import { NetworkToken as NetworkToken$, Token as Token$ } from './tokenTypes';
import { WalletParams as WalletParams$ } from '@suite-utils/router';
import { ArrayElement } from '../utils';

export type Network = ArrayElement<typeof NETWORKS>;
export type ExternalNetwork = ArrayElement<typeof EXTERNAL_NETWORKS>;
export type NetworkToken = NetworkToken$;
export type Token = Token$;
export type Account = Account$;
export type Send = SendState;
export type Icon = Icon$;
export type CoinFiatRates = CoinFiatRates$;
export type Discovery = Discovery$;
export type DiscoveryStatus =
    | {
          status: 'loading';
          type: 'waiting-for-device' | 'auth' | 'discovery';
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
export type WalletParams = WalletParams$;
export type WalletAccountTransaction = WalletAccountTransaction$;
export type FiatTicker = FiatTicker$;
export type ReceiveInfo = ReceiveInfo$;

export type WalletAction =
    | BlockchainActions
    | ReceiveActions
    | SendFormActions
    | SendFormBtcActions
    | SendFormXrpActions
    | SendFormEthActions
    | TransactionAction
    | FiatRatesActions
    | GraphActions
    | DiscoveryActions
    | AccountActions
    | SelectedAccountActions;
