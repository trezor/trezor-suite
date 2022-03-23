// get address

export interface RippleGetAddress {
    path: string | number[];
    address?: string;
    showOnTrezor?: boolean;
}

export interface RippleAddress {
    address: string;
    path: number[];
    serializedPath: string;
}

// sign transaction

export interface RipplePayment {
    amount: string;
    destination: string;
    destinationTag?: number;
}

export interface RippleTransaction {
    fee: string;
    flags?: number;
    sequence: number;
    maxLedgerVersion?: number; // Proto: "last_ledger_sequence"
    payment: RipplePayment;
}

export interface RippleSignTransaction {
    path: string | number[];
    transaction: RippleTransaction;
}

export interface RippleSignedTx {
    serializedTx: string;
    signature: string;
}
