import { G } from '@mobily/ts-belt';
import { UnknownAction } from '@reduxjs/toolkit';

import { UI } from '@trezor/connect';

export const isPinButtonRequestCode = (action: UnknownAction) =>
    action.type === UI.REQUEST_BUTTON &&
    G.isNotNullable(action.payload) &&
    'code' in action.payload &&
    ['ButtonRequest_PinEntry', 'PinMatrixRequestType_Current'].includes(
        action.payload.code as string,
    );

const flowEndingButtonRequests = [
    'ButtonRequest_ConfirmOutput',
    'ButtonRequest_SignTx',
    'ButtonRequest_Address',
] as const;

export const isFlowEndingButtonRequest = (action: UnknownAction) =>
    action.type === UI.REQUEST_BUTTON &&
    G.isNotNullable(action.payload) &&
    'code' in action.payload &&
    flowEndingButtonRequests.includes(
        action.payload.code as (typeof flowEndingButtonRequests)[number],
    );

export const isSuiteSyncButtonRequest = (action: UnknownAction) =>
    action.type === UI.REQUEST_BUTTON &&
    G.isNotNullable(action.payload) &&
    'name' in action.payload &&
    action.payload.name === 'secure_sync';
