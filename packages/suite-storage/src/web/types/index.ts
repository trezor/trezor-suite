import { DBSchema } from 'idb';

export const STORE_TXS = 'txs';
export const STORE_SUITE_SETTINGS = 'suiteSettings';
export const STORE_WALLET_SETTINGS = 'walletSettings';

interface TokenTransfer {
    type: 'sent' | 'recv' | 'self' | 'unknown';
    name: string;
    symbol: string;
    address: string;
    decimals: number;
    amount: string;
    from?: string;
    to?: string;
}

// Transaction object
interface TransactionTarget {
    addresses?: string[];
    isAddress: boolean;
    amount?: string;
    coinbase?: string;
}

// TODO: interface should be given as a param on db init from the app
export interface WalletAccountTransaction {
    id?: number;
    accountId: number;

    // TODO: copy paste from connect
    type: 'sent' | 'recv' | 'self' | 'unknown';
    txid: string;
    blockTime?: number;
    blockHeight?: number;
    blockHash?: string;

    amount: string;
    fee?: string;
    total?: string; // amount + total

    targets: TransactionTarget[];
    tokens: TokenTransfer[];
    rbf?: boolean;
    ethereumSpecific?: {
        status: number;
        nonce: number;
        gasLimit: number;
        gasUsed?: number;
        gasPrice: string;
    };
}

export interface MyDBV1 extends DBSchema {
    txs: {
        key: string;
        value: WalletAccountTransaction;
        indexes: {
            txId: WalletAccountTransaction['txid'];
            accountId: string; // custom field
            blockTime: number; // blockTime can be undefined?
            type: WalletAccountTransaction['type'];
            'accountId-blockTime': [number, number];
        };
    };
    suiteSettings: {
        key: string;
        value: { language: string };
    };
    walletSettings: {
        key: string;
        value:
            | {
                  localCurrency: string;
                  hideBalance: boolean;
                  hiddenCoins: string[];
                  hiddenCoinsExternal: string[];
              }
            | { language: string };
    };
}

export interface StorageUpdateMessage {
    // TODO: only key strings from MyDBV1 should be allowed
    store: keyof MyDBV1;
    keys: any[];
}

export interface StorageMessageEvent extends MessageEvent {
    data: StorageUpdateMessage;
}
