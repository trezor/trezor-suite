import type { SocksProxyAgentOptions } from 'socks-proxy-agent';
import type { Transaction as BlockbookTransaction, VinVout } from './blockbook';
import type { BlockfrostTransaction } from './blockfrost';
import type { FormattedTransactionType as RippleTransaction } from 'ripple-lib';

/* Common types used in both params and responses */

export interface BlockchainSettings {
    name: string;
    worker: string | (() => any);
    server: string[];
    proxy?: string | SocksProxyAgentOptions;
    debug?: boolean;
    timeout?: number;
    pingTimeout?: number;
    keepAlive?: boolean;
}

export interface ServerInfo {
    url: string;
    name: string;
    shortcut: string;
    testnet: boolean;
    version: string;
    decimals: number;
    blockHeight: number;
    blockHash: string;
}

/* Transaction */

export interface TokenTransfer {
    type: 'sent' | 'recv' | 'self' | 'unknown';
    name: string;
    symbol: string;
    address: string;
    decimals: number;
    amount: string;
    from?: string;
    to?: string;
}

export interface Target {
    n: number;
    addresses?: string[];
    isAddress: boolean;
    amount?: string;
    coinbase?: string;
    isAccountTarget?: boolean;
}

export type TypedRawTransaction =
    | {
          type: 'blockbook';
          tx: BlockbookTransaction;
      }
    | {
          type: 'ripple';
          tx: RippleTransaction;
      }
    | {
          type: 'blockfrost';
          tx: BlockfrostTransaction;
      };

export type TransactionDetail = {
    vin: VinVout[];
    vout: VinVout[];
    size: number;
    totalInput: string;
    totalOutput: string;
};

export interface FiatRates {
    [symbol: string]: number | undefined;
}

export interface AccountBalanceHistory {
    time: number;
    txs: number;
    received: string;
    sent: string;
    sentToSelf?: string; // should always be there for blockbook >= 0.3.3
    rates: FiatRates;
}

export interface Transaction {
    type: 'sent' | 'recv' | 'self' | 'unknown';
    txid: string;
    blockTime?: number;
    blockHeight?: number;
    blockHash?: string;
    lockTime?: number;

    amount: string;
    fee: string;
    totalSpent: string; // amount + total

    targets: Target[];
    tokens: TokenTransfer[];
    rbf?: boolean;
    ethereumSpecific?: BlockbookTransaction['ethereumSpecific'];
    cardanoSpecific?: {
        subtype:
            | 'withdrawal'
            | 'stake_delegation'
            | 'stake_registration'
            | 'stake_deregistration'
            | null;
    };
    details: TransactionDetail;
}

/* Account */

export interface Address {
    address: string;
    path: string;
    transfers: number;
    // decimal: number,
    balance?: string;
    sent?: string;
    received?: string;
}

export interface AccountAddresses {
    change: Address[];
    used: Address[];
    unused: Address[];
}

export interface Utxo {
    txid: string;
    vout: number;
    amount: string;
    blockHeight: number;
    address: string;
    path: string;
    confirmations: number;
    coinbase?: boolean;
    cardanoSpecific?: {
        unit: string;
    };
}

export interface TokenInfo {
    type: string; // token type: ERC20...
    address: string; // token address
    balance?: string; // token balance
    name?: string; // token name
    symbol?: string; // token symbol
    decimals: number; // token decimals or 0
    // transfers: number, // total transactions?
}

export interface AccountInfo {
    descriptor: string;
    balance: string;
    availableBalance: string;
    empty: boolean;
    tokens?: TokenInfo[]; // ethereum and blockfrost tokens
    addresses?: AccountAddresses; // bitcoin and blockfrost addresses
    history: {
        total: number; // total transactions (unknown in ripple)
        tokens?: number; // tokens transactions
        unconfirmed: number; // unconfirmed transactions
        transactions?: Transaction[]; // list of transactions
        txids?: string[]; // not implemented
    };
    misc?: {
        // ETH
        nonce?: string;
        erc20Contract?: TokenInfo;
        // XRP
        sequence?: number;
        reserve?: string;
        // blockfrost
        rewards?: string;
    };
    page?: {
        // blockbook and blockfrost
        index: number;
        size: number;
        total: number;
    };
    marker?: {
        // ripple-lib
        ledger: number;
        seq: number;
    };
}

export interface SubscriptionAccountInfo {
    descriptor: string;
    addresses?: AccountAddresses; // bitcoin addresses
}

export type ChanellMessage<T> = T & { id: number };
