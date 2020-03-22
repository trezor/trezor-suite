import { ReceiveActions } from '@wallet-actions/receiveActions';
import { SignVerifyActions } from '@wallet-actions/signVerifyActions';

import {
    State as SendState,
    SendFormActions,
    SendFormBtcActions,
    SendFormXrpActions,
    SendFormEthActions,
} from '@wallet-types/sendForm';
import { FiatTicker as FiatTicker$ } from '@wallet-types/fiatRates';
import { DiscoveryActions } from '@wallet-actions/discoveryActions';
import { AccountActions } from '@wallet-actions/accountActions';
import { Discovery as Discovery$ } from '@wallet-reducers/discoveryReducer';
import { Account as Account$ } from '@wallet-reducers/accountsReducer';
import { CoinFiatRates as CoinFiatRates$ } from '@wallet-reducers/fiatRatesReducer';
import { WalletAccountTransaction as WalletAccountTransaction$ } from '@wallet-reducers/transactionReducer';

import { FiatRateActions } from '@wallet-actions/fiatRatesActions';
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
export type WalletParams = WalletParams$;
export type WalletAccountTransaction = WalletAccountTransaction$;
export type FiatTicker = FiatTicker$;

interface BlockchainLinkToken {
    name: string;
    symbol: string;
    value: string;
}

export type WalletAction =
    | BlockchainActions
    | ReceiveActions
    | SendFormActions
    | SendFormBtcActions
    | SendFormXrpActions
    | SendFormEthActions
    | SignVerifyActions
    | TransactionAction
    | FiatRateActions
    | DiscoveryActions
    | AccountActions
    | SelectedAccountActions;

export interface BlockchainLinkTransaction {
    type: 'send' | 'recv';
    timestamp?: number;
    blockHeight?: number;
    blockHash?: string;
    descriptor: string;
    inputs: any;
    outputs: any;

    hash: string;
    amount: string;
    fee: string;
    total: string;

    tokens?: BlockchainLinkToken[];
    sequence?: number; // eth: nonce || ripple: sequence
}

export interface Transaction extends BlockchainLinkTransaction {
    deviceState: string;
    symbol: string;
    rejected?: boolean;
}
