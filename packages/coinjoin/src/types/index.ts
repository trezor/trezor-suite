import { CoinjoinPrisonInmate } from './client';

interface BaseSettings {
    network: 'btc' | 'test' | 'regtest';
    wabisabiBackendUrl: string;
    onionDomains?: { [clearnet: string]: string };
}

export interface CoinjoinBackendSettings extends BaseSettings {
    blockbookUrls: readonly string[];
    baseBlockHeight: number;
    baseBlockHash: string;
    filtersBatchSize: number;
    storagePath?: string;
}

export interface CoinjoinClientSettings extends BaseSettings {
    coordinatorUrl: string;
    coordinatorName: string; // identifier used in commitment data and ownership proof
    middlewareUrl: string;
    prison?: CoinjoinPrisonInmate[];
}

export type { ScanAccountProgress, ScanAccountCheckpoint } from './backend';

export * from './account';
export * from './client';
export * from './round';
export * from './logger';
