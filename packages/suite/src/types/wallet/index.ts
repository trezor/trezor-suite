import { WalletParams as WalletParams$ } from '@suite-utils/router';
import { AccountActions } from '@wallet-actions/accountActions';
import { BlockchainActions } from '@wallet-actions/blockchainActions';
import { DiscoveryActions } from '@wallet-actions/discoveryActions';
import { FiatRatesActions } from '@wallet-actions/fiatRatesActions';
import { GraphActions } from '@wallet-actions/graphActions';
import { ReceiveActions } from '@wallet-actions/receiveActions';
import { SelectedAccountActions } from '@wallet-actions/selectedAccountActions';
import { SignVerifyActions } from '@wallet-actions/signVerifyActions';
import { SupportedIconsActions } from '@wallet-actions/supportedIconsActions';
import { TransactionAction } from '@wallet-actions/transactionActions';
import { EXTERNAL_NETWORKS, NETWORKS } from '@wallet-config';
import { Account as Account$ } from '@wallet-reducers/accountsReducer';
import { Discovery as Discovery$ } from '@wallet-reducers/discoveryReducer';
import { CoinFiatRates as CoinFiatRates$ } from '@wallet-reducers/fiatRatesReducer';
import { ReceiveInfo as ReceiveInfo$ } from '@wallet-reducers/receiveReducer';
import { WalletAccountTransaction as WalletAccountTransaction$ } from '@wallet-reducers/transactionReducer';
import { FiatTicker as FiatTicker$ } from '@wallet-types/fiatRates';
import {
    SendFormActions,
    SendFormBtcActions,
    SendFormEthActions,
    SendFormXrpActions,
    State as SendState,
} from '@wallet-types/sendForm';

import { ArrayElement } from '../utils';
import { Icon as Icon$ } from './iconTypes';
import { NetworkToken as NetworkToken$, Token as Token$ } from './tokenTypes';

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
          type: 'auth-failed' | 'auth-confirm-failed' | 'discovery-empty' | 'discovery-failed';
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
    | SignVerifyActions
    | TransactionAction
    | FiatRatesActions
    | GraphActions
    | DiscoveryActions
    | AccountActions
    | SelectedAccountActions
    | SupportedIconsActions;
