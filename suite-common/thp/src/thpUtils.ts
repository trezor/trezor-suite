import { G } from '@mobily/ts-belt';
import { UnknownAction } from '@reduxjs/toolkit';

import { UI } from '@trezor/connect';

type ThpPairingRequestPayload = {
    name: 'thp_pairing_request' | 'thp_connection_request';
};

type ThpPairingRequestAction = {
    type: typeof UI.REQUEST_BUTTON;
    payload: ThpPairingRequestPayload;
};

export const isThpPairingUIRequestButtonAction = (
    action: UnknownAction,
): action is ThpPairingRequestAction =>
    action.type === UI.REQUEST_BUTTON &&
    G.isNotNullable(action.payload) &&
    'name' in action.payload &&
    (action.payload.name === 'thp_pairing_request' ||
        action.payload.name === 'thp_connection_request');
