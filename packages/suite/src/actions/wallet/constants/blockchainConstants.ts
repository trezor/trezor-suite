import { BLOCKCHAIN } from 'trezor-connect';

export const READY = '@blockchain/ready';
export const RECONNECT_TIMEOUT_START = '@blockchain/reconnect-timeout-start';
export const CONNECTED = '@blockchain/connected';
export const UPDATE_FEE = '@blockchain/update-fee';

// reexport from trezor-connect
export const { CONNECT } = BLOCKCHAIN;
export const { ERROR } = BLOCKCHAIN;
export const { BLOCK } = BLOCKCHAIN;
export const { NOTIFICATION } = BLOCKCHAIN;
export const { FIAT_RATES_UPDATE } = BLOCKCHAIN;
