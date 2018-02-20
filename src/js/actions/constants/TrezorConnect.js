/* @flow */
'use strict';

export const READY: string = 'trezorconnect__ready';
export const INITIALIZATION_ERROR: string = 'trezorconnect__init_error';
export const SELECT_DEVICE: string = 'trezorconnect__select_device';


export const DEVICE_FROM_STORAGE: string = 'trezorconnect__device_from_storage';
export const AUTH_DEVICE: string = 'trezorconnect__auth_device';
export const COIN_CHANGED: string = 'trezorconnect__coin_changed';

export const REMEMBER_REQUEST: string = 'trezorconnect__remember_request';
export const FORGET_REQUEST: string = 'trezorconnect__forget_request';
export const FORGET: string = 'trezorconnect__forget';
export const FORGET_SINGLE: string = 'trezorconnect__forget_single';
export const DISCONNECT_REQUEST: string = 'trezorconnect__disconnect_request';
export const REMEMBER: string = 'trezorconnect__remember';

export const START_ACQUIRING: string = 'trezorconnect__start_acquiring';
export const STOP_ACQUIRING: string = 'trezorconnect__stop_acquiring';

export const TRY_TO_DUPLICATE: string = 'trezorconnect__try_to_duplicate';
export const DUPLICATE: string = 'trezorconnect__duplicate';

export const DEVICE_STATE_EXCEPTION: string = 'trezorconnect__device_state_exception';