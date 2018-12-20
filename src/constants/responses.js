/* @flow */

// promise responses
export const ERROR: 'r_error' = 'r_error'; // exception: this could be also emitted as event (with id: -1)
export const CONNECT: 'r_connect' = 'r_connect';
export const GET_INFO: 'r_info' = 'r_info';
export const GET_ACCOUNT_INFO: 'r_account_info' = 'r_account_info';
export const GET_TRANSACTIONS: 'r_transactions' = 'r_transactions';
export const GET_FEE: 'r_get_fee' = 'r_get_fee';
export const SUBSCRIBE: 'r_subscribe' = 'r_subscribe';
export const UNSUBSCRIBE: 'r_unsubscribe' = 'r_unsubscribe';
export const PUSH_TRANSACTION: 'r_push_tx' = 'r_push_tx';

// emitted events
export const CONNECTED: 'r_connected' = 'r_connected';
export const DISCONNECTED: 'r_disconnected' = 'r_disconnected';
export const NOTIFICATION: 'r_notification' = 'r_notification';
