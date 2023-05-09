import { CoinjoinPrisonInmate } from './client';

interface BaseSettings {
    network: 'btc' | 'test' | 'regtest';
    coordinatorUrl: string;
}

export interface CoinjoinBackendSettings extends BaseSettings {
    wabisabiBackendUrl: string;
    blockbookUrls: readonly string[];
    baseBlockHeight: number;
    baseBlockHash: string;
    filtersBatchSize: number;
    storagePath?: string;
}

export interface CoinjoinClientSettings extends BaseSettings {
    coordinatorName: string; // identifier used in commitment data and ownership proof
    middlewareUrl: string;
    prison?: CoinjoinPrisonInmate[];
}

export type {
    ScanAddressProgress,
    ScanAddressCheckpoint,
    ScanAccountProgress,
    ScanAccountCheckpoint,
} from './backend';

export * from './account';
export * from './client';
export * from './round';
export * from './logger';
