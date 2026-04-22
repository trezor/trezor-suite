import type {
    AccountAddresses,
    AccountInfo as AccountInfoBase,
    Address,
    BlockbookTransaction,
    EnhancedVinVout,
    BlockbookFilterResponse as FilterResponse,
    BlockbookServerInfo as ServerInfo,
    Transaction,
    Utxo,
    VinVout,
} from '@trezor/blockchain-link-types';
import type { Network } from '@trezor/utxo-lib';

import type { RequestOptions } from '../utils/http';

export type { BlockbookTransaction, VinVout, EnhancedVinVout };
export type { Address, Utxo, Transaction, AccountAddresses };

// shape of src/backend/CoinjoinBackendClient.ts
export interface CoinjoinBackendClientShape {
    fetchNetworkInfo(options?: RequestOptions): Promise<ServerInfo>;
    fetchBlock(height: number, options?: RequestOptions): Promise<{ txs: BlockbookTransaction[] }>; // BlockbookBlock
    fetchBlockFilters(
        bestKnownBlockHash: string,
        pageSize: number,
        options?: RequestOptions,
    ): Promise<BlockFilterResponse>;
    fetchMempoolFilters(): Promise<MempoolFilterResponse>;
    fetchTransaction(txid: string, options?: RequestOptions): Promise<BlockbookTransaction>;
    subscribeMempoolTxs(
        listener: (tx: BlockbookTransaction) => void,
        onDisconnect?: () => void,
    ): Promise<void>;
    unsubscribeMempoolTxs(
        listener: (tx: BlockbookTransaction) => void,
        onDisconnect?: () => void,
    ): Promise<void>;
}

// shape of src/backend/CoinjoinFilterController.ts
export interface FilterControllerShape {
    getFilterIterator(
        params: FilterControllerParams,
        ctx: FilterControllerContext,
    ): AsyncGenerator<any, void, unknown>;
}

// shape of src/backend/CoinjoinAddressController.ts
export type AddressControllerShape = {
    readonly receive: PrederivedAddress[];
    readonly change: PrederivedAddress[];
    analyze: <T>(
        getTxs: (address: AccountAddress) => T[],
        onTxs?: ((txs: T[]) => void) | undefined,
    ) => {
        receive: PrederivedAddress[];
        change: PrederivedAddress[];
    };
};

// shape of src/backend/CoinjoinMempoolController.ts
export type MempoolStatus = 'stopped' | 'running';

export interface MempoolControllerShape {
    readonly status: MempoolStatus;
    start(): Promise<void>;
    stop(): Promise<void>;
    init(
        addressController?: AddressControllerShape,
        onProgressInfo?: OnProgressInfo,
    ): Promise<BlockbookTransaction[]>;
    update(force?: boolean): Promise<void>;
    getTransactions(addressController?: AddressControllerShape): BlockbookTransaction[];
    removeTransactions(txids: string[]): void;
}

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
    client: CoinjoinBackendClientShape;
    network: Network;
    abortSignal?: AbortSignal;
    filters: FilterControllerShape;
    mempool?: MempoolControllerShape;
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

export type FilterClient = Pick<
    CoinjoinBackendClientShape,
    'fetchNetworkInfo' | 'fetchBlockFilters'
>;

export type MempoolClient = Pick<
    CoinjoinBackendClientShape,
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
