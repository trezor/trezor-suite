// import { Messages } from '@trezor/protobuf';
import { thp as protocolThp } from '@trezor/protocol';

import { ERRORS } from '../../constants';
import { DEVICE } from '../../events';
import type { Device } from '../Device';

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
    ThpCreateNewSession: 'Success'; // todo from protobuf
    // ButtonAck: never;
    // Success: never;
};

// map ThpTypedCall with real THP definitions
type ThpMessage = protocolThp.ThpMessageType & { Success: {} };
// type ThpMessage = protocolThp.ThpMessageType;
// type ThpMessage = protocolThp.ThpMessageType;
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

// protocolThp.ThpMessagePayload
type ThpMessagePayload<T extends MessageKey = MessageKey> = ThpMessage[T];

export const thpCall = async <T extends MessageKey>(
    device: Device,
    name: T,
    data?: ThpMessagePayload<T>,
): Promise<ThpCallResponse[T]> => {
    const session = device.getLocalSession();
    if (!session) {
        throw new Error('THPCall Failure transportSession missing'); // hmm
    }
    const thpState = device.getThpState();
    if (!thpState) {
        throw ERRORS.TypedError('Device_ThpStateMissing');
    }

    console.warn('thpCall', name);

    const result = await device.transport.call({
        session,
        name,
        data: data || {},
        protocol: device.protocol,
        thpState,
    });
    if (!result.success) {
        throw ERRORS.serializeError({ code: result.error, message: result.message });
    }

    console.warn('thpCall res', result.payload.type);

    if (result.payload.type === 'ButtonRequest') {
        if (result.payload.message.code === 'ButtonRequest_PassphraseEntry') {
            device.emit(DEVICE.PASSPHRASE_ON_DEVICE);
        } else {
            device.emit(DEVICE.BUTTON, { device, payload: result.payload.message });
        }

        // resType is protocolThp.ThpMessageType while typedCall accepts only protobuf.MessageType
        // return device.getCurrentSession().typedCall('ButtonAck', resType as any, {});
        // hacky way: ButtonAck is not defined in ThpTypedCall
        return thpCall(device, 'ButtonAck' as any, {}) as unknown as ThpCallResponse[T];
    }

    // @ts-expect-error Failure_ActionCancelled missing in proto?
    if (result.payload.type === 'Failure' || result.payload.type === 'Failure_ActionCancelled') {
        throw ERRORS.serializeError(result.payload.message);
    }

    if (result.payload.type === 'ThpError') {
        throw ERRORS.serializeError(result.payload.message);
    }

    return result.payload as ThpCallResponse[T];
};

export const abortThpWorkflow = (device: Device) => {
    const thpState = device.getThpState();
    if (!thpState) {
        return Promise.resolve(); // not a THP device
    }

    if (device.transport.name === 'BridgeTransport') {
        // TODO: this is needed only only if there is pending thpCall: message was sent, now reading from device
        thpState.updateSyncBit('send');
        thpState.updateNonce('send');
    }

    thpState.setExpectedResponses([]);

    // TODO: check if workflow is actually running
    return device.transport.send({
        name: 'Cancel',
        data: {},
        session: device.getLocalSession()!,
        protocol: device.protocol,
        thpState,
        // signal: readAbort.signal,
    });
};
