export interface StorageUpdateMessage {
    store: any;
    keys: any[];
}

export interface StorageMessageEvent {
    data: StorageUpdateMessage;
}

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

export interface WalletAccountTransaction {
    id?: number;
    accountId: number;
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
