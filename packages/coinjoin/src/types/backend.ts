import type { Network } from '@trezor/utxo-lib';
import type {
    Address,
    Utxo,
    Transaction,
    AccountAddresses,
    AccountInfo as AccountInfoBase,
    EnhancedVinVout,
} from '@trezor/blockchain-link-types';
import type {
    Transaction as BlockbookTransaction,
    VinVout,
} from '@trezor/blockchain-link-types/lib/blockbook';

import type { CoinjoinBackendClient } from '../backend/CoinjoinBackendClient';
import type { MempoolController } from '../backend/CoinjoinMempoolController';

export type { BlockbookTransaction, VinVout, EnhancedVinVout };
export type { Address, Utxo, Transaction, AccountAddresses };

export type BlockbookBlock = {
    page: number;
    totalPages: number;
    height: number;
    txs: BlockbookTransaction[];
    hash: string;
};

export type BlockFilter = {
    blockHeight: number;
    blockHash: string;
    filter: string;
    prevHash: string;
    blockTime: number;
};

export type BlockFilterResponse =
    | { status: 'up-to-date' }
    | { status: 'not-found' }
    | {
          status: 'ok';
          bestHeight: number;
          filters: BlockFilter[];
      };

export type ScanAccountContext = {
    client: CoinjoinBackendClient;
    network: Network;
    abortSignal?: AbortSignal;
    filters: FilterController;
    mempool?: MempoolController;
    onProgress: (progress: ScanAccountProgress) => void;
    onProgressInfo: (info: ScanProgressInfo) => void;
};

export type ScanAccountCheckpoint = {
    blockHash: string;
    blockHeight: number;
    receiveCount: number;
    changeCount: number;
};

export type ScanProgressInfo = {
    progress?: number;
    message?: string;
};

export type ScanAccountProgress = {
    checkpoint: ScanAccountCheckpoint;
    transactions: Transaction[];
};

export type ScanAccountParams = {
    descriptor: string;
    progressHandle?: string;
    checkpoints?: ScanAccountCheckpoint[];
    cache?: AccountCache;
};

export type ScanAccountResult = {
    pending: Transaction[];
    checkpoint: ScanAccountCheckpoint;
    cache?: AccountCache;
};

export type FilterControllerParams = {
    checkpoints?: {
        blockHeight: number;
        blockHash: string;
    }[];
    batchSize?: number;
};

export type FilterControllerContext = {
    abortSignal?: AbortSignal;
};

type IteratedBlockFilter = BlockFilter & {
    progress?: number;
};

export interface FilterController {
    getFilterIterator(
        params?: FilterControllerParams,
        context?: FilterControllerContext,
    ): AsyncGenerator<IteratedBlockFilter>;
}

export type FilterClient = Pick<CoinjoinBackendClient, 'fetchFilters'>;

export type MempoolClient = Pick<
    CoinjoinBackendClient,
    'fetchMempoolFilters' | 'fetchTransaction' | 'subscribeMempoolTxs' | 'unsubscribeMempoolTxs'
>;

export type AccountInfo = AccountInfoBase & {
    history: AccountInfoBase['history'] & {
        transactions: NonNullable<AccountInfoBase['history']['transactions']>;
    };
    utxo: Utxo[];
    addresses: NonNullable<AccountInfoBase['addresses']>;
};

export type PrederivedAddress = Pick<Address, 'address' | 'path'>;

export type AccountAddress = PrederivedAddress & {
    script: Buffer;
};

export type AccountCache = {
    receivePrederived?: PrederivedAddress[];
    changePrederived?: PrederivedAddress[];
};
