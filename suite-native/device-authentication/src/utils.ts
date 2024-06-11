import { AnyAction } from '@reduxjs/toolkit';

import { UI } from '@trezor/connect';

export const isPassphraseAction = (action: AnyAction) => action.type === UI.REQUEST_PASSPHRASE;

export const isPinAction = (action: AnyAction) =>
    (action.type === UI.REQUEST_PIN || action.type === UI.REQUEST_BUTTON) &&
    (action.payload.code === 'ButtonRequest_PinEntry' ||
        action.payload.code === 'PinMatrixRequestType_Current');

export const isCloseWindowActionOrNonAuthorizationAction = (action: AnyAction) =>
    action.type === UI.CLOSE_UI_WINDOW ||
    (action.type === UI.REQUEST_BUTTON &&
        action.payload.code !== 'ButtonRequest_Other' &&
        action.payload.code !== 'ButtonRequest_PinEntry' &&
        action.payload.code !== 'PinMatrixRequestType_Current');
