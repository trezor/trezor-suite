/* @flow */
'use strict';

export const CLOSE_MODAL: string = 'action__close_modal';

export const ON_PIN_ADD: string = 'action__on_pin_click';
export const ON_PIN_BACKSPACE: string = 'action__on_pin_backspace';
export const ON_PIN_SUBMIT: string = 'action__on_pin_submit';

export const ON_PASSPHRASE_CHANGE: string = 'action__on_passphrase_change';
export const ON_PASSPHRASE_SHOW: string = 'action__on_passphrase_show';
export const ON_PASSPHRASE_HIDE: string = 'action__on_passphrase_hide';
export const ON_PASSPHRASE_SAVE: string = 'action__on_passphrase_save';
export const ON_PASSPHRASE_FORGET: string = 'action__on_passphrase_forget';
export const ON_PASSPHRASE_FOCUS: string = 'action__on_passphrase_focus';
export const ON_PASSPHRASE_BLUR: string = 'action__on_passphrase_blur';
export const ON_PASSPHRASE_SUBMIT: string = 'action__on_passphrase_submit';

export const ON_CHANGE_ACCOUNT: string = 'action__on_change_account';
export const ON_CUSTOM_FEE_OPEN: string = 'action__on_custom_fee_open';
export const ON_CUSTOM_FEE_CHANGE: string = 'action__on_custom_fee_change';

export const ON_SELECT_DEVICE: string = 'action__on_select_device';


export const ON_ADDRESS_CHANGE: string = 'send__on_address_change';
export const ON_AMOUNT_CHANGE: string = 'send__on_amount_change';
export const ON_GAS_PRICE_CHANGE: string = 'send__on_gas_price_change';
export const ON_GAS_LIMIT_CHANGE: string = 'send__on_gas_limit_change';
export const ON_TX_DATA_CHANGE: string = 'send__on_data_change';
export const ON_TX_SEND: string = 'send__on_send';
export const ON_TX_COMPLETE: string = 'send__on_tx_complete';


export const ADDRESS_CREATE: string = 'address__create';
export const ADDRESS_DELETE: string = 'address__delete';
export const ADDRESS_SET_BALANCE: string = 'address__set_balance';
export const ADDRESS_SET_HISTORY: string = 'address__set_history';
export const ADDRESS_UPDATE_BALANCE: string = 'address__update_balance';

export const TX_STATUS_OK: string = 'tx__status_ok';
export const TX_STATUS_ERROR: string = 'tx__status_error';
export const TX_STATUS_UNKNOWN: string = 'tx__status_unknown';