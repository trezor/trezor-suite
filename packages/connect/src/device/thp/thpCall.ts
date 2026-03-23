import { TypedError } from '@trezor/connect-common/src/constants/errors';
import type { thp as protocolThp } from '@trezor/protocol';

import { DEVICE } from '../../events';
import type { IDevice } from '../../types/idevice';

type ThpTypedCall = {
    ThpCreateChannelRequest: 'ThpCreateChannelResponse';
    ThpHandshakeInitRequest: 'ThpHandshakeInitResponse';
    ThpHandshakeCompletionRequest: 'ThpHandshakeCompletionResponse';
    ThpPairingRequest: 'ThpPairingRequestApproved';
    ThpSelectMethod: [
        'ThpCodeEntryCommitment',
        'ThpEndResponse',
        'ThpPairingRequestApproved',
        'ThpPairingPreparationsFinished',
    ];
    ThpCodeEntryChallenge: ['ThpCodeEntryCpaceTrezor'];
    ThpCodeEntryCpaceHostTag: 'ThpCodeEntrySecret';
    ThpQrCodeTag: 'ThpQrCodeSecret';
    ThpNfcTagHost: 'ThpNfcTagTrezor';
    ThpCredentialRequest: 'ThpCredentialResponse';
    ThpEndRequest: 'ThpEndResponse';
    ThpCreateNewSession: 'Success';
};

type ThpMessage = protocolThp.ThpMessageType & { Success: {} };
type TypedPayloadItem<K> = K extends keyof ThpMessage
    ? {
          type: K;
          message: ThpMessage[K];
      }
    : never;
type ExtractFromArray<A extends any[]> = {
    [K in keyof A]: TypedPayloadItem<A[K]>;
}[number];

type MessageKey = keyof ThpTypedCall;
type TypedPayload<T extends MessageKey> = ThpTypedCall[T] extends any[]
    ? ExtractFromArray<ThpTypedCall[T]>
    : TypedPayloadItem<ThpTypedCall[T]>;

type ThpCallResponse = {
    [K in keyof ThpTypedCall]: TypedPayload<K>;
};

type ThpMessagePayload<T extends MessageKey = MessageKey> = ThpMessage[T];

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
