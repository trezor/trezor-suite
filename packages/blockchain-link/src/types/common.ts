import { Transaction as BlockbookTransaction, VinVout } from './blockbook';
import { FormattedTransactionType as RippleTransaction } from 'ripple-lib';

/* Common types used in both params and responses */

export interface BlockchainSettings {
    name: string;
    worker: string | (() => any);
    server: string[];
    debug?: boolean;
    timeout?: number;
    pingTimeout?: number;
    keepAlive?: boolean;
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
      };

export type TransactionDetail = {
    vin: VinVout[];
    vout: VinVout[];
    size: number;
    totalInput: string;
    totalOutput: string;
};

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
    tokens?: TokenInfo[]; // ethereum tokens
    addresses?: AccountAddresses; // bitcoin addresses
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
    };
    page?: {
        // blockbook
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
