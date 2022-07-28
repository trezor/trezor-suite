export type { AccountInfo, Address, Transaction } from '../../types/common';
export type { Transaction as BlockbookTransaction, VinVout } from '../../types/blockbook';

export type BlockFilter = {
    blockHeight: number;
    blockHash: string;
    filter: string;
    prevHash: string;
    blockTime: number;
};

export type DiscoveryParams = {
    descriptor: string;
    wabisabiUrl?: string;
    blockbookUrl?: string;
    storagePath?: string;
    abortSignal?: AbortSignal;
};
