/* @flow */


export const INIT: 'send__init' = 'send__init';
export const DISPOSE: 'send__dispose' = 'send__dispose';
export const VALIDATION: 'send__validation' = 'send__validation';
export const ADDRESS_VALIDATION: 'send__address_validation' = 'send__address_validation';
export const ADDRESS_CHANGE: 'send__address_change' = 'send__address_change';
export const AMOUNT_CHANGE: 'send__amount_change' = 'send__amount_change';
export const SET_MAX: 'send__set_max' = 'send__set_max';
export const CURRENCY_CHANGE: 'send__currency_change' = 'send__currency_change';
export const FEE_LEVEL_CHANGE: 'send__fee_level_change' = 'send__fee_level_change';
export const GAS_PRICE_CHANGE: 'send__gas_price_change' = 'send__gas_price_change';
export const GAS_LIMIT_CHANGE: 'send__gas_limit_change' = 'send__gas_limit_change';
export const NONCE_CHANGE: 'send__nonce_change' = 'send__nonce_change';
export const UPDATE_FEE_LEVELS: 'send__update_fee_levels' = 'send__update_fee_levels';
export const DATA_CHANGE: 'send__data_change' = 'send__data_change';
export const SEND: 'send__submit' = 'send__submit';
export const TX_COMPLETE: 'send__tx_complete' = 'send__tx_complete';
export const TX_ERROR: 'send__tx_error' = 'send__tx_error';
export const TOGGLE_ADVANCED: 'send__toggle_advanced' = 'send__toggle_advanced';

export const FROM_SESSION_STORAGE: 'send__from_session_storage' = 'send__from_session_storage';