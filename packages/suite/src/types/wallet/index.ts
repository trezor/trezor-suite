import { SettingsActions } from '@wallet-actions/settingsActions';
import { NotificationActions } from '@wallet-actions/notificationActions';
import { TokenActions } from '@wallet-actions/tokenActions';
import { ReceiveActions } from '@wallet-actions/receiveActions';
import { SignVerifyActions } from '@wallet-actions/signVerifyActions';

import { FiatRateActions } from '@wallet-services/CoingeckoService';

import { TransactionAction } from '@wallet-actions/transactionActions';
import { Network } from './networkTypes';
import { Icon } from './iconTypes';
import { NetworkToken, Token } from './tokenTypes';

export { Network, Icon, NetworkToken, Token };
// TODO import from connect
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
    | TokenActions
    | TransactionAction
    | FiatRateActions;

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

// TODO: copied from wallet's accountReducer
interface AccountCommon {
    imported: boolean;
    index: number;
    network: string; // network id (shortcut)
    deviceID: string; // empty for imported accounts
    deviceState: string; // empty for imported accounts
    accountPath: number[]; // empty for imported accounts
    descriptor: string; // address or xpub

    balance: string;
    availableBalance: string; // balance - pending
    block: number; // last known (synchronized) block
    empty: boolean; // account without transactions

    transactions: number; // deprecated
}

export type Account =
    | (AccountCommon & {
          networkType: 'ethereum';
          nonce: number;
      })
    | (AccountCommon & {
          networkType: 'ripple';
          sequence: number;
          reserve: string;
      })
    | (AccountCommon & {
          networkType: 'bitcoin';
          addressIndex: number;
      });
// TODO END
