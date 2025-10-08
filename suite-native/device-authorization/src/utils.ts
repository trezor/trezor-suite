import { G } from '@mobily/ts-belt';
import { UnknownAction } from '@reduxjs/toolkit';

import { UI } from '@trezor/connect';

type PinButtonRequestPayload = {
    code: 'ButtonRequest_PinEntry' | 'PinMatrixRequestType_Current';
};

type PinButtonRequestAction = {
    type: typeof UI.REQUEST_BUTTON;
    payload: PinButtonRequestPayload;
};

export const isPinButtonRequestCode = (action: UnknownAction): action is PinButtonRequestAction =>
    action.type === UI.REQUEST_BUTTON &&
    G.isNotNullable(action.payload) &&
    'code' in action.payload &&
    (action.payload.code === 'ButtonRequest_PinEntry' || // T2 with PIN entry on device
        action.payload.code === 'PinMatrixRequestType_Current'); // T1 with PIN matrix in app

type PinRequestAction = { type: typeof UI.REQUEST_PIN } | PinButtonRequestAction;

export const isPinRequestAction = (action: UnknownAction): action is PinRequestAction =>
    action.type === UI.REQUEST_PIN || isPinButtonRequestCode(action);
