import { AnyAction } from '@reduxjs/toolkit';

import { UI } from '@trezor/connect';

const isUICloseWindowAction = (action: AnyAction) => action.type === UI.CLOSE_UI_WINDOW;

export const isPinButtonRequest = (action: AnyAction) =>
    action.type === UI.REQUEST_BUTTON &&
    (action.payload.code === 'ButtonRequest_PinEntry' ||
        action.payload.code === 'PinMatrixRequestType_Current');

export const isPinAction = (action: AnyAction) =>
    isPinButtonRequest(action) || action.type === UI.REQUEST_PIN;

export const isCloseWindowActionOrNonPinAction = (action: AnyAction) =>
    isUICloseWindowAction(action) || !isPinAction(action);
