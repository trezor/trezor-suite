import { SettingsActions } from '@wallet-actions/settingsActions';
import { NotificationActions } from '@wallet-actions/notificationActions';
import { ReceiveActions } from '@wallet-actions/receiveActions';
import { SignVerifyActions } from '@wallet-actions/signVerifyActions';
import { DiscoveryActions } from '@wallet-actions/discoveryActions';
import { AccountActions } from '@wallet-actions/accountActions';
import { Account as Account$ } from '@wallet-reducers/accountsReducer';

import { FiatRateActions } from '@wallet-middlewares/coingeckoMiddleware';

import { TransactionAction } from '@wallet-actions/transactionActions';
import { SelectedAccountActions } from '@wallet-actions/selectedAccountActions';
import { WalletActions } from '@wallet-actions/walletActions';
import { Network as Network$ } from './networkTypes';
import { Icon as Icon$ } from './iconTypes';
import { NetworkToken as NetworkToken$, Token as Token$ } from './tokenTypes';

// this weird export is because of --isolatedModules and next.js 9
export type Network = Network$;
export type NetworkToken = NetworkToken$;
export type Token = Token$;
export type Account = Account$;
export type Icon = Icon$;

interface BlockchainLinkToken {
    name: string;
    shortcut: string;
    value: string;
}

export type Action =
    | SettingsActions
    | ReceiveActions
    | SignVerifyActions
    | NotificationActions
    | TransactionAction
    | FiatRateActions
    | DiscoveryActions
    | AccountActions
    | WalletActions
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
// TODO END

export interface Transaction extends BlockchainLinkTransaction {
    deviceState: string;
    network: string;
    rejected?: boolean;
}
