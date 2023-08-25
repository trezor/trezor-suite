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
    FilterResponse,
} from '@trezor/blockchain-link-types/lib/blockbook';

import type { CoinjoinBackendClient } from '../backend/CoinjoinBackendClient';
import type { MempoolController } from '../backend/CoinjoinMempoolController';
import type { FilterController } from '../backend/CoinjoinFilterController';

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
};

export type BlockFilterResponse =
    | { status: 'up-to-date' }
    | { status: 'not-found' }
    | ({ status: 'ok'; filters: BlockFilter[] } & Partial<FilterResponse>);

export type MempoolFilterResponse = Partial<FilterResponse> & {
    entries: { [txid: string]: string };
};

export type ScanAccountContext = {
    client: CoinjoinBackendClient;
    network: Network;
    abortSignal?: AbortSignal;
    filters: FilterController;
    mempool?: MempoolController;
    onProgress: (progress: ScanAccountProgress) => void;
    onProgressInfo: OnProgressInfo;
};

export type ScanAccountCheckpoint = {
    blockHash: string;
    blockHeight: number;
    receiveCount: number;
    changeCount: number;
};

export type ScanProgressInfo =
    | {
          stage: 'block';
          activity: 'fetch' | 'scan-fetch' | 'scan';
          batchFrom: number;
          progress?: { current: number; from: number; to: number };
      } // scan is always one batch behind fetch
    | { stage: 'block'; progress: { current: number; from: number; to: number } }
    | {
          stage: 'mempool';
          activity: 'fetch' | 'scan';
          progress?: { current: number; total: number; iteration: number };
      }
    | { stage: 'mempool'; progress: { current: number; total: number; iteration: number } };

export type OnProgressInfo = (info: ScanProgressInfo) => void;

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
    onProgressInfo?: OnProgressInfo;
};

export type FilterClient = Pick<CoinjoinBackendClient, 'fetchNetworkInfo' | 'fetchBlockFilters'>;

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
