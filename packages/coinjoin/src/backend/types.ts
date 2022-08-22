import type { Network } from '@trezor/utxo-lib';
import type { AccountInfo, Address, Transaction } from '@trezor/blockchain-link/src/types';
import type {
    Transaction as BlockbookTransaction,
    VinVout,
} from '@trezor/blockchain-link/src/types/blockbook';

import type { CoinjoinBackendClient } from './CoinjoinBackendClient';
import type { MempoolController } from './CoinjoinMempoolController';

export type { BlockbookTransaction };
export type { AccountInfo, Address, Transaction };

export type BlockbookBlock = {
    height: number;
    txs: BlockbookTransaction[];
};

export type BlockFilter = {
    blockHeight: number;
    blockHash: string;
    filter: string;
    prevHash: string;
    blockTime: number;
};

export type BlockFilterResponse = {
    bestHeight: number;
    filters: BlockFilter[];
};

export type MethodContext = {
    client: CoinjoinBackendClient;
    network: Network;
    abortSignal?: AbortSignal;
};

export type DiscoveryProgress = {
    progress?: number;
    message?: string;
};

export type DiscoveryCheckpoint = {
    checkpoint: {
        time: number;
        blockHash: string;
    };
};

export type DiscoveryContext = {
    controller: FilterController;
    mempool: MempoolController;
    onProgress: (progress: DiscoveryProgress) => void;
};

export type KnownState = {
    blockHash: string;
    receiveCount: number;
    changeCount: number;
    transactions: Transaction[];
};

export type GetAccountInfoParams = {
    descriptor: string;
    knownState?: KnownState;
};

export type FilterControllerParams = {
    fromHash?: string;
    batchSize?: number;
};

export type FilterControllerContext = {
    abortSignal?: AbortSignal;
};

export interface FilterController {
    get bestBlockHeight(): number;
    getFilterIterator(
        params?: FilterControllerParams,
        context?: FilterControllerContext,
    ): AsyncGenerator<BlockFilter>;
}

export type FilterClient = Pick<CoinjoinBackendClient, 'fetchFilters'>;

export type MempoolClient = Pick<CoinjoinBackendClient, 'fetchMempoolTxids' | 'fetchTransaction'>;

export type LightTx = {
    vin: VinVout[];
    vout: VinVout[];
};

export type AddressTxs = {
    script: Buffer;
    address: string;
    txs: BlockbookTransaction[];
};

export type AccountAddressTxs = AddressTxs & {
    path: string;
};

export type AccountAddressLightTxs = Omit<AccountAddressTxs, 'txs'> & {
    txs: LightTx[];
};
