import { type UnknownAction } from '@reduxjs/toolkit';

import { UI_EVENTS, UI_REQUESTS } from '@trezor/connect';
import type { DeviceButtonRequestPayload, UiRequestDeviceAction } from '@trezor/connect';
import { isNotNullOrUndefined } from '@trezor/utils';

export const pinButtonRequestCodes = [
    'ButtonRequest_PinEntry',
    'PinMatrixRequestType_Current',
] as const;

export const isPinButtonRequestCode = (action: UnknownAction): action is UiRequestDeviceAction =>
    action.type === UI_EVENTS.BUTTON_REQUEST &&
    typeof action.payload === 'object' &&
    isNotNullOrUndefined(action.payload) &&
    'code' in action.payload &&
    pinButtonRequestCodes.includes(action.payload.code as (typeof pinButtonRequestCodes)[number]);

export const isPassphraseButtonRequestCode = (
    action: UnknownAction,
): action is UiRequestDeviceAction =>
    action.type === UI_EVENTS.PASSPHRASE_ON_DEVICE ||
    (action.type === UI_EVENTS.BUTTON_REQUEST &&
        typeof action.payload === 'object' &&
        isNotNullOrUndefined(action.payload) &&
        'code' in action.payload &&
        action.payload.code === 'ButtonRequest_Other' &&
        'name' in action.payload &&
        action.payload.name === 'passphrase_host1');

export const isPassphraseRequest = (action: UnknownAction): action is UiRequestDeviceAction =>
    action.type === UI_REQUESTS.REQUEST_PASSPHRASE;

type ButtonRequestPattern = {
    code: NonNullable<DeviceButtonRequestPayload['code']>;
    name?: DeviceButtonRequestPayload['name'];
};

export const flowEndingButtonRequests: readonly ButtonRequestPattern[] = [
    { code: 'ButtonRequest_ConfirmOutput' },
    { code: 'ButtonRequest_SignTx' },
    { code: 'ButtonRequest_Address' },
    { code: 'ButtonRequest_PublicKey' },
    // For some reason, Cardano does not use `ButtonRequest_ConfirmOutput`, so it has to be matched by name.
    { code: 'ButtonRequest_Other', name: 'confirm_output' },
];

export const isFlowEndingButtonRequest = (action: UnknownAction) => {
    const payload = action.payload as DeviceButtonRequestPayload;

    return flowEndingButtonRequests.some(
        ({ code, name }) => payload.code === code && (name === undefined || payload.name === name),
    );
};

export const isSuiteSyncButtonRequest = (action: UnknownAction) =>
    action.type === UI_EVENTS.BUTTON_REQUEST &&
    typeof action.payload === 'object' &&
    isNotNullOrUndefined(action.payload) &&
    'name' in action.payload &&
    typeof action.payload.name === 'string' &&
    [
        'suite_sync',
        'secure_sync', // Older firmwares use this name.
    ].includes(action.payload.name);
