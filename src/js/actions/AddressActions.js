/* @flow */
'use strict';

import * as ADDRESS from './constants/address';

export type AddressAction = {
    type: typeof ADDRESS.CREATE,
    payload: any
} | {
    type: typeof ADDRESS.SET_BALANCE,
    payload: any
} | {
    type: typeof ADDRESS.SET_NONCE,
    payload: any
}