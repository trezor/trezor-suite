import { type UnknownAction } from '@reduxjs/toolkit';

import { UI_REQUEST } from '@trezor/connect';
import { isNotNullOrUndefined } from '@trezor/utils';

type ThpPairingRequestPayload = {
    name: 'thp_pairing_request' | 'thp_connection_request';
};

type ThpPairingRequestAction = {
    type: typeof UI_REQUEST.REQUEST_BUTTON;
    payload: ThpPairingRequestPayload;
};

export const isThpPairingUIRequestButtonAction = (
    action: UnknownAction,
): action is ThpPairingRequestAction =>
    action.type === UI_REQUEST.REQUEST_BUTTON &&
    typeof action.payload === 'object' &&
    isNotNullOrUndefined(action.payload) &&
    'name' in action.payload &&
    (action.payload.name === 'thp_pairing_request' ||
        action.payload.name === 'thp_connection_request');
