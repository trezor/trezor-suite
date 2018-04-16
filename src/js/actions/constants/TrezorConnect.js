/* @flow */
'use strict';

//regExp1 : string = '(.*)'
//regExp2 : '$1' = '$1'

export const READY: 'trezorconnect__ready' = 'trezorconnect__ready';
export const INITIALIZATION_ERROR: 'trezorconnect__init_error' = 'trezorconnect__init_error';
export const SELECT_DEVICE: 'trezorconnect__select_device' = 'trezorconnect__select_device';


export const DEVICE_FROM_STORAGE: 'trezorconnect__device_from_storage' = 'trezorconnect__device_from_storage';
export const AUTH_DEVICE: 'trezorconnect__auth_device' = 'trezorconnect__auth_device';
export const COIN_CHANGED: 'trezorconnect__coin_changed' = 'trezorconnect__coin_changed';

export const REMEMBER_REQUEST: 'trezorconnect__remember_request' = 'trezorconnect__remember_request';
export const FORGET_REQUEST: 'trezorconnect__forget_request' = 'trezorconnect__forget_request';
export const FORGET: 'trezorconnect__forget' = 'trezorconnect__forget';
export const FORGET_SINGLE: 'trezorconnect__forget_single' = 'trezorconnect__forget_single';
export const DISCONNECT_REQUEST: 'trezorconnect__disconnect_request' = 'trezorconnect__disconnect_request';
export const REMEMBER: 'trezorconnect__remember' = 'trezorconnect__remember';

export const START_ACQUIRING: 'trezorconnect__start_acquiring' = 'trezorconnect__start_acquiring';
export const STOP_ACQUIRING: 'trezorconnect__stop_acquiring' = 'trezorconnect__stop_acquiring';

export const TRY_TO_DUPLICATE: 'trezorconnect__try_to_duplicate' = 'trezorconnect__try_to_duplicate';
export const DUPLICATE: 'trezorconnect__duplicate' = 'trezorconnect__duplicate';

export const DEVICE_STATE_EXCEPTION: 'trezorconnect__device_state_exception' = 'trezorconnect__device_state_exception';