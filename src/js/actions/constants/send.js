/* @flow */
'use strict';

export const INIT: string = 'send__init';
export const DISPOSE: string = 'send__dispose';
export const VALIDATION: string = 'send__validation';
export const ADDRESS_CHANGE: string = 'send__address_change';
export const AMOUNT_CHANGE: string = 'send__amount_change';
export const SET_MAX: string = 'send__set_max';
export const CURRENCY_CHANGE: string = 'send__currency_change';
export const FEE_LEVEL_CHANGE: string = 'send__fee_level_change';
export const GAS_PRICE_CHANGE: string = 'send__gas_price_change';
export const GAS_LIMIT_CHANGE: string = 'send__gas_limit_change';
export const UPDATE_FEE_LEVELS: string = 'send__update_fee_levels';
export const DATA_CHANGE: string = 'send__data_change';
export const SEND: string = 'send__submit';
export const TX_COMPLETE: string = 'send__tx_complete';
export const TX_ERROR: string = 'send__tx_error';
export const TOGGLE_ADVANCED: string = 'send__toggle_advanced';