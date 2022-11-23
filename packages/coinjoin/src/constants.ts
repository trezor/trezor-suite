// Maximum number of filters requested from backend in one request
export const FILTERS_BATCH_SIZE = 10000;

// Minimum number of blocks after which 'progress' event is fired by scanAccount
export const PROGRESS_BATCH_SIZE_MIN = 10;

// Maximum number of blocks after which 'progress' event is fired by scanAccount
export const PROGRESS_BATCH_SIZE_MAX = 10000;

export const DISCOVERY_LOOKOUT = 20;

// for change addresses as they're heavily used in coinjoin
export const DISCOVERY_LOOKOUT_EXTENDED = 50;

export const STATUS_TIMEOUT = {
    idle: 60000, // no registered accounts, occasionally fetch status to read fees
    enabled: 30000, // account is registered but utxo was not paired with Round
    registered: 20000, // utxo is registered in Round
} as const;

// add 2 sec. offset to round.inputRegistrationEnd to prevent race conditions
// we are expecting phase to change but server didn't propagate it yet
export const ROUND_REGISTRATION_END_OFFSET = 2000;

// do not register into Round if round.inputRegistrationEnd is below offset
export const ROUND_SELECTION_REGISTRATION_OFFSET = 30000;

// custom timeout for http requests (default is 50000 ms)
export const HTTP_REQUEST_TIMEOUT = 35000;

// fallback values for status request
// usage of these values is extremely unlikely, there would have to be a change in the coordinator's API
export const PLEBS_DONT_PAY_THRESHOLD = 1000000;
export const COORDINATOR_FEE_RATE = 0.003;
export const MIN_ALLOWED_AMOUNT = 5000;
export const MAX_ALLOWED_AMOUNT = 134375000000;
