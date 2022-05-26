import type { Network } from '@trezor/utxo-lib';
import type { Transaction } from '@trezor/blockchain-link/lib/types';
import type { Transaction as BlockbookTransaction } from '@trezor/blockchain-link/lib/types/blockbook';

export type { AccountInfo, Address } from '@trezor/blockchain-link/lib/types';
export type { BlockbookTransaction, Transaction };

type MethodContext = {
    network: Network;
    abortSignal?: AbortSignal;
};

type ScanContext<T> = MethodContext & {
    onProgress: (progress: T) => void;
};

export type ScanAddressContext = ScanContext<ScanAddressProgress>;

export type ScanAccountContext = ScanContext<ScanAccountProgress>;

export type ScanAddressCheckpoint = {
    blockHash: string;
    blockHeight: number;
};

export type ScanAccountCheckpoint = ScanAddressCheckpoint & {
    receiveCount: number;
    changeCount: number;
};

export type ScanProgressInfo = {
    progress?: number;
    message?: string;
};

type ScanProgress<T> = {
    checkpoint: T;
    transactions: Transaction[];
    info?: ScanProgressInfo;
};

export type ScanAddressProgress = ScanProgress<ScanAddressCheckpoint>;

export type ScanAccountProgress = ScanProgress<ScanAccountCheckpoint>;

export type ScanAccountParams = {
    descriptor: string;
    checkpoint?: ScanAccountCheckpoint;
};

export type ScanAddressParams = {
    descriptor: string;
    checkpoint?: ScanAddressCheckpoint;
};

export type ScanAccountResult = {
    pending: Transaction[];
    checkpoint: ScanAccountCheckpoint;
};

export type ScanAddressResult = {
    pending: Transaction[];
    checkpoint: ScanAddressCheckpoint;
};
