import { BLOCKCHAIN } from 'trezor-connect';

export const READY = '@blockchain/ready';
export const RECONNECT_TIMEOUT_START = '@blockchain/reconnect-timeout-start';
export const START_SUBSCRIBE = '@blockchain/start-subscribe';
export const FAIL_SUBSCRIBE = '@blockchain/fail-subscribe';
export const UPDATE_FEE = '@blockchain/update-fee';

// reexport from trezor-connect
export const { CONNECT } = BLOCKCHAIN;
export const { ERROR } = BLOCKCHAIN;
export const { BLOCK } = BLOCKCHAIN;
export const { NOTIFICATION } = BLOCKCHAIN;
export const { FIAT_RATES_UPDATE } = BLOCKCHAIN;
