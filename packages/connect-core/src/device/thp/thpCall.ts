import { DEVICE } from '@trezor/connect-common';
import { TypedError } from '@trezor/connect-common/src/constants/errors';
import type { thp as protocolThp } from '@trezor/protocol';

import type { IDevice } from '../../types/idevice';

// Runtime gate: every request maps to the exact set of response types it may receive.
// ThpTypedCall is derived directly from this object, so the type map and the runtime
// check are always in sync — adding or changing a response type here is the only edit needed.
const ALLOWED_RESPONSE_TYPES = {
    ThpCreateChannelRequest: ['ThpCreateChannelResponse'],
    ThpHandshakeInitRequest: ['ThpHandshakeInitResponse'],
    ThpHandshakeCompletionRequest: ['ThpHandshakeCompletionResponse'],
    ThpPairingRequest: ['ThpPairingRequestApproved'],
    ThpSelectMethod: [
        'ThpCodeEntryCommitment',
        'ThpEndResponse',
        'ThpPairingRequestApproved',
        'ThpPairingPreparationsFinished',
    ],
    ThpCodeEntryChallenge: ['ThpCodeEntryCpaceTrezor'],
    ThpCodeEntryCpaceHostTag: ['ThpCodeEntrySecret'],
    ThpQrCodeTag: ['ThpQrCodeSecret'],
    ThpNfcTagHost: ['ThpNfcTagTrezor'],
    ThpCredentialRequest: ['ThpCredentialResponse'],
    ThpEndRequest: ['ThpEndResponse'],
    ThpCreateNewSession: ['Success'],
} as const;

type ThpTypedCall = typeof ALLOWED_RESPONSE_TYPES;

type ThpMessage = protocolThp.ThpMessageType & { Success: Record<never, never> };
type TypedPayloadItem<K> = K extends keyof ThpMessage
    ? {
          type: K;
          message: ThpMessage[K];
      }
    : never;
type ExtractFromArray<A extends readonly any[]> = {
    [K in keyof A]: TypedPayloadItem<A[K]>;
}[number];

type MessageKey = keyof ThpTypedCall;
type TypedPayload<T extends MessageKey> = ExtractFromArray<ThpTypedCall[T]>;

type ThpCallResponse = {
    [K in keyof ThpTypedCall]: TypedPayload<K>;
};

type ThpMessagePayload<T extends MessageKey = MessageKey> = ThpMessage[T];

// TypeScript types ReadonlyArray<T>.includes as (value: T), which rejects a wider string
// argument when the array is a narrow const tuple. This helper widens the element type to
// string so callers don't need a cast at every use site.
const assertResponse = (type: string, allowed: readonly string[]) => {
    if (!allowed.includes(type)) {
        throw TypedError('Device_InvalidState', `Unexpected response type: ${type}`);
    }
};

export const thpCall = async <T extends MessageKey>(
    device: IDevice,
    name: T,
    data: ThpMessagePayload<T>,
): Promise<ThpCallResponse[T]> => {
    const thpState = device.getThpState();
    if (!thpState) {
        throw TypedError('Device_ThpStateMissing');
    }

    const result = await device.getCurrentSession().call(name, data);
    if (!result.success) {
        throw result.error;
    }

    thpState.setCancelablePromise(false);

    if (result.payload.type === 'ButtonRequest') {
        thpState.setCancelablePromise(true);

        if (result.payload.message.code === 'ButtonRequest_PassphraseEntry') {
            device.emit(DEVICE.PASSPHRASE_ON_DEVICE);
        } else {
            device.emit(DEVICE.BUTTON, { device, payload: result.payload.message });
        }

        return thpCall(device, 'ButtonAck' as T, {} as ThpMessagePayload<T>);
    }

    if (result.payload.type === 'Failure') {
        const { code, message } = result.payload.message;
        throw TypedError(code || 'Failure_UnknownCode', message);
    }

    if (result.payload.type === 'ThpError') {
        const { code, message } = result.payload.message;
        throw TypedError(code, message);
    }

    // Runtime gate: reject any response type not in the allowed set for this call.
    // ButtonAck is passed via recursive call and has no entry in ALLOWED_RESPONSE_TYPES.
    if (name in ALLOWED_RESPONSE_TYPES) {
        assertResponse(result.payload.type, ALLOWED_RESPONSE_TYPES[name]);
    }

    return result.payload as ThpCallResponse[T];
};

export const abortThpWorkflow = async (device: IDevice) => {
    const thpState = device.getThpState();
    if (!thpState || !device.currentRun) {
        return Promise.resolve(); // not a THP device
    }

    // check that current workflow is awaiting for Cancel (see ./pairing waitForPairingCancel)
    // - transport is in read state (read Cancel from the device)
    // - @trezor/connect is waiting for UI response (pairing tag)
    // in that case we don't need to update THP sync values because thpState is synchronized
    // in any other case we need to update sync values before current transport.call process is resolved
    if (thpState.pairingTagPromise) {
        await thpState.pairingTagPromise.abort();
        await device.getCurrentSession().cancelCall();
        thpState.resetState();
        device.emit(DEVICE.THP_PAIRING_STATUS_CHANGED, { status: 'canceled' });
    } else if (thpState.cancelablePromise) {
        thpState.sync('send', 'Cancel');
        await device.getCurrentSession().send('Cancel', {});
        await device.currentRun;
    }
};
