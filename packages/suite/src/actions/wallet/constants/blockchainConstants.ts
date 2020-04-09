import { BLOCKCHAIN } from 'trezor-connect';
export const READY = '@blockchain/ready';
export const SET_RECONNECT_TIMEOUT = '@blockchain/set-reconnect-timeout';
export const START_SUBSCRIBE = '@blockchain/start-subscribe';
export const FAIL_SUBSCRIBE = '@blockchain/fail-subscribe';
export const UPDATE_FEE = '@blockchain/update-fee';

// reexport from trezor-connect
export const CONNECT = BLOCKCHAIN.CONNECT;
export const ERROR = BLOCKCHAIN.ERROR;
export const BLOCK = BLOCKCHAIN.BLOCK;
export const NOTIFICATION = BLOCKCHAIN.NOTIFICATION;
export const FIAT_RATES_UPDATE = BLOCKCHAIN.FIAT_RATES_UPDATE;