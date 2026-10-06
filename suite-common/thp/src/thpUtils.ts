import { type UnknownAction } from '@reduxjs/toolkit';

import { UI_EVENTS } from '@trezor/connect';
import { isNotNullOrUndefined } from '@trezor/utils';

type ThpPairingRequestPayload = {
    name: 'thp_pairing_request' | 'thp_connection_request';
};

type ThpPairingRequestAction = {
    type: typeof UI_EVENTS.BUTTON_REQUEST;
    payload: ThpPairingRequestPayload;
};

export const isThpPairingUIRequestButtonAction = (
    action: UnknownAction,
): action is ThpPairingRequestAction =>
    action.type === UI_EVENTS.BUTTON_REQUEST &&
    typeof action.payload === 'object' &&
    isNotNullOrUndefined(action.payload) &&
    'name' in action.payload &&
    (action.payload.name === 'thp_pairing_request' ||
        action.payload.name === 'thp_connection_request');
