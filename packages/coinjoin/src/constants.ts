export const FILTERS_BATCH_SIZE = 100;

export const LOCALHOST_REGTEST_SETTINGS = {
    // network: networks.regtest,
    network: 'regtest',
    wabisabiUrl: 'http://localhost:8081/WabiSabi/api/v4/btc',
    blockbookUrl: 'http://localhost:8081/blockbook/api/v2',
    baseBlockHeight: 0,
    baseBlockHash: '0f9188f13cb7b2c71f2a335e3a4fc328bf5beb436012afca590b1a11466e2206',
} as const;

export const SLDEV_REGTEST_SETTINGS = {
    network: 'regtest',
    wabisabiUrl: 'https://coinjoin.corp.sldev.cz/WabiSabi/api/v4/btc',
    blockbookUrl: 'https://coinjoin.corp.sldev.cz/blockbook/api/v2',
    baseBlockHeight: 0,
    baseBlockHash: '0f9188f13cb7b2c71f2a335e3a4fc328bf5beb436012afca590b1a11466e2206',
} as const;
