// todo: import from @trezor/blockchain-link

// copy-paste from blockchain-link
export interface VinVout {
    n: number;
    addresses?: string[];
    isAddress: boolean;
    value?: string;
    coinbase?: string;
    txid?: string;
    vout?: number;
    sequence?: number;
    hex?: string;
}

export interface BlockbookTransaction {
    txid: string;
    version?: number;
    vin: VinVout[];
    vout: VinVout[];
    blockHeight: number;
    blockHash?: string;
    confirmations: number;
    blockTime: number;
    lockTime?: number;
    value: string;
    valueIn: string;
    fees: string;
    hex: string;
    ethereumSpecific?: {
        status: number;
        nonce: number;
        data?: string;
        gasLimit: number;
        gasUsed?: number;
        gasPrice: string;
    };
    tokenTransfers?: Array<{
        from?: string;
        to?: string;
        value: string;
        token: string;
        name: string;
        symbol: string;
        decimals?: number;
    }>;
}

// ripple-lib

export interface RippleLibAmount {
    value: string;
    currency: string;
    issuer?: string;
    counterparty?: string;
}

export interface RippleLibAdjustment {
    address: string;
    amount: RippleLibAmount;
    tag?: number;
}

export interface RippleLibMemo {
    type?: string;
    format?: string;
    data?: string;
}

export interface RippleLibOutcome {
    result: string;
    ledgerVersion: number;
    indexInLedger: number;
    fee: string;
    balanceChanges: {
        [key: string]: RippleLibAmount[];
    };
    orderbookChanges: any;
    timestamp?: string;
}

export interface RippleLibTransaction {
    type: string;
    specification: {
        source: RippleLibAdjustment;
        destination: RippleLibAdjustment;
        paths?: string;
        memos?: RippleLibMemo[];
        invoiceID?: string;
        allowPartialPayment?: boolean;
        noDirectRipple?: boolean;
        limitQuality?: boolean;
    };
    outcome: RippleLibOutcome;
    id: string;
    address: string;
    sequence: number;
}

export type TypedRawTransaction =
    | {
          type: 'blockbook';
          tx: BlockbookTransaction;
      }
    | {
          type: 'ripple';
          tx: RippleLibTransaction;
      };
