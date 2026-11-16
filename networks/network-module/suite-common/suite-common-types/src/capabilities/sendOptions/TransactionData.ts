import type { SendTransfer } from './SendToken';

/** Arbitrary hex data sent along with a coin transfer, such as an EVM call. */
export type TransactionData = {
    readonly maxBytes: number;
    /** Whether data can go with this transfer; a token transfer, for one, is already a call. */
    isAllowed(transfer: SendTransfer): boolean;
};
