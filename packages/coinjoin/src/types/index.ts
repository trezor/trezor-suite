interface BaseSettings {
    network: 'regtest'; // 'btc' | 'test' | 'regtest'
    coordinatorUrl: string;
}

export interface CoinjoinBackendSettings extends BaseSettings {
    blockbookUrls: readonly string[];
    baseBlockHeight: number;
    baseBlockHash: string;
    storagePath?: string;
}

export interface CoinjoinClientSettings extends BaseSettings {
    coordinatorName: string; // identifier used in commitment data and ownership proof
    middlewareUrl: string;
}

export * from './client';
export * from './coordinator';
