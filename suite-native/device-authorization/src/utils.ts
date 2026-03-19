import { UI_REQUEST } from '@trezor/connect/src/exports';
import type { UiRequestDeviceAction } from '@trezor/connect/src/exports';
import { isNotNullOrUndefined } from '@trezor/utils';

type ActionWithOptionalPayload = {
    type: string;
    payload?: unknown;
};

export const pinButtonRequestCodes = [
    'ButtonRequest_PinEntry',
    'PinMatrixRequestType_Current',
] as const;

export const isPinButtonRequestCode = (
    action: ActionWithOptionalPayload,
): action is UiRequestDeviceAction =>
    action.type === UI_REQUEST.REQUEST_BUTTON &&
    typeof action.payload === 'object' &&
    isNotNullOrUndefined(action.payload) &&
    'code' in action.payload &&
    pinButtonRequestCodes.includes(action.payload.code as (typeof pinButtonRequestCodes)[number]);

export const isPassphraseButtonRequestCode = (
    action: ActionWithOptionalPayload,
): action is UiRequestDeviceAction =>
    action.type === UI_REQUEST.REQUEST_PASSPHRASE_ON_DEVICE ||
    (action.type === UI_REQUEST.REQUEST_BUTTON &&
        typeof action.payload === 'object' &&
        isNotNullOrUndefined(action.payload) &&
        'code' in action.payload &&
        action.payload.code === 'ButtonRequest_Other' &&
        'name' in action.payload &&
        action.payload.name === 'passphrase_host1');

export const isPassphraseRequest = (
    action: ActionWithOptionalPayload,
): action is UiRequestDeviceAction => action.type === UI_REQUEST.REQUEST_PASSPHRASE;

export const flowEndingButtonRequests = [
    'ButtonRequest_ConfirmOutput',
    'ButtonRequest_SignTx',
    'ButtonRequest_Address',
] as const;

export const isFlowEndingButtonRequest = (action: ActionWithOptionalPayload) =>
    action.type === UI_REQUEST.REQUEST_BUTTON &&
    typeof action.payload === 'object' &&
    isNotNullOrUndefined(action.payload) &&
    'code' in action.payload &&
    flowEndingButtonRequests.includes(
        action.payload.code as (typeof flowEndingButtonRequests)[number],
    );

export const isSuiteSyncButtonRequest = (action: ActionWithOptionalPayload) =>
    action.type === UI_REQUEST.REQUEST_BUTTON &&
    typeof action.payload === 'object' &&
    isNotNullOrUndefined(action.payload) &&
    'name' in action.payload &&
    action.payload.name === 'secure_sync';
