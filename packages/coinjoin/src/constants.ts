// Maximum number of filters requested from backend in one request
export const FILTERS_BATCH_SIZE = 100;

// Minimum number of blocks after which 'progress' event is fired by scanAccount
export const PROGRESS_BATCH_SIZE_MIN = 10;

// Maximum number of blocks after which 'progress' event is fired by scanAccount
export const PROGRESS_BATCH_SIZE_MAX = 10000;

export const DISCOVERY_LOOKOUT = 20;

export const STATUS_TIMEOUT = {
    idle: 60000, // no registered accounts, occasionally fetch status to read fees
    enabled: 30000, // account is registered but utxo was not paired with Round
    registered: 10000, // utxo is registered in Round
} as const;
