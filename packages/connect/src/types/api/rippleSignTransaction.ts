import type { Params, Response } from '../params';

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

export declare function rippleSignTransaction(
    params: Params<RippleSignTransaction>,
): Response<RippleSignedTx>;
