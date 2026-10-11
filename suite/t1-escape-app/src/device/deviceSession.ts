import type { MessagesSchema as PROTO } from '@trezor/protobuf';
import { type MessageResponse, TRANSPORT_ERROR } from '@trezor/transport-common';
import { type Result, err, ok } from '@trezor/type-utils';

import { diagnosticLog } from '../app/diagnosticLog';

export type DeviceLostReason = 'disconnected' | 'session-taken' | 'bridge-unreachable';

export type DeviceCallError =
    /** The device is gone or another client took over the session. Nothing may be retried. */
    | { type: 'device-lost'; reason: DeviceLostReason }
    | { type: 'transport'; code: string }
    /** The device answered with a `Failure` message. */
    | { type: 'failure'; code: string; message: string }
    /** The user dismissed the PIN or passphrase prompt in the app. */
    | { type: 'cancelled'; prompt: 'pin' | 'passphrase' }
    | { type: 'unexpected-response'; received: string }
    /** Another call is still running. The device handles one call at a time. */
    | { type: 'busy' };

export type TransportCallParams = {
    name: string;
    data: Record<string, unknown>;
};

export type TransportCallError = {
    code: string;
    message?: string;
};

/** One request-response exchange with the device, as the bridge transport performs it. */
export type TransportCall = (
    params: TransportCallParams,
) => Promise<Result<MessageResponse, TransportCallError>>;

/** Error thrown by the `TypedCall` adapter, which has to reject like the one in connect-core. */
export class DeviceCallFailure extends Error {
    readonly callError: DeviceCallError;

    constructor(callError: DeviceCallError) {
        super(`Device call failed: ${callError.type}`);
        this.name = 'DeviceCallFailure';
        this.callError = callError;
    }
}

export type DeviceCall = <T extends PROTO.WireInMessage, R extends PROTO.WireOutMessage>(
    type: T,
    expectedType: R,
    message?: PROTO.MessagePayload<T>,
) => Promise<Result<PROTO.MessageResponse<R>, DeviceCallError>>;

export type DeviceSessionDeps = {
    transportCall: TransportCall;
    /** Tells whether the device was unplugged or taken by another client in the meantime. */
    getDeviceLostReason: () => DeviceLostReason | undefined;
    /** Asks the user for the PIN as matrix positions. Resolves to undefined when dismissed. */
    requestPin: () => Promise<string | undefined>;
    /** Provides the passphrase the device should use. Resolves to undefined when dismissed. */
    requestPassphrase: () => Promise<string | undefined>;
    onButtonRequest: () => void;
};

export type DeviceSession = {
    /** Sends a message and drives button, PIN and passphrase prompts until the answer comes. */
    call: DeviceCall;
    /** The same exchange with the throwing contract `signTx` from connect-core expects. */
    typedCall: PROTO.TypedCall;
};

const toCallError = (code: string): DeviceCallError => {
    switch (code) {
        case TRANSPORT_ERROR.SESSION_NOT_FOUND:
        case TRANSPORT_ERROR.SESSION_WRONG_PREVIOUS:
            return { type: 'device-lost', reason: 'session-taken' };
        case TRANSPORT_ERROR.DEVICE_DISCONNECTED_DURING_ACTION:
        case TRANSPORT_ERROR.DEVICE_NOT_FOUND:
            return { type: 'device-lost', reason: 'disconnected' };
        case TRANSPORT_ERROR.HTTP_ERROR:
            return { type: 'device-lost', reason: 'bridge-unreachable' };
        default:
            return { type: 'transport', code };
    }
};

const isResponseOfType = <R extends PROTO.WireOutMessage>(
    response: MessageResponse,
    expectedTypes: readonly R[],
): response is PROTO.MessageResponse<R> => expectedTypes.some(type => type === response.type);

export const createDeviceSession = (deps: DeviceSessionDeps): DeviceSession => {
    let isCallInProgress = false;

    const exchange = async (
        name: string,
        data: Record<string, unknown>,
    ): Promise<Result<MessageResponse, DeviceCallError>> => {
        const lostBeforeCall = deps.getDeviceLostReason();
        if (lostBeforeCall) {
            diagnosticLog.error('device', `${name} not sent, device lost`, {
                reason: lostBeforeCall,
            });

            return err({ type: 'device-lost', reason: lostBeforeCall });
        }

        // Only the message name is logged. The payload can hold the PIN or the passphrase.
        diagnosticLog.info('device', `-> ${name}`);
        const startedAt = Date.now();
        const response = await deps.transportCall({ name, data });
        const durationMs = Date.now() - startedAt;

        // A response that arrives after the session was taken may come from a call another
        // client interleaved, so it is never trusted.
        const lostDuringCall = deps.getDeviceLostReason();
        if (lostDuringCall) {
            diagnosticLog.error('device', `${name} answered after the device was lost`, {
                reason: lostDuringCall,
                durationMs,
            });

            return err({ type: 'device-lost', reason: lostDuringCall });
        }

        if (!response.success) {
            diagnosticLog.error('device', `${name} failed in transport`, {
                code: response.error.code,
                message: response.error.message,
                durationMs,
            });

            return err(toCallError(response.error.code));
        }

        diagnosticLog.info('device', `<- ${response.payload.type}`, { durationMs });

        return ok(response.payload);
    };

    const cancelPrompt = async (prompt: 'pin' | 'passphrase') => {
        diagnosticLog.warn('device', `${prompt} prompt dismissed in the app`);
        // The device keeps waiting for the acknowledgement until it is told to stop. Its
        // answer to the cancellation carries no information beyond the cancellation itself.
        await exchange('Cancel', {});

        return err({ type: 'cancelled' as const, prompt });
    };

    const runCallLoop = async (
        type: string,
        message: Record<string, unknown>,
    ): Promise<Result<MessageResponse, DeviceCallError>> => {
        let [name, data] = [type, message];

        while (true) {
            const response = await exchange(name, data);
            if (!response.success) return response;

            const { payload } = response;

            switch (payload.type) {
                case 'Failure':
                    diagnosticLog.warn('device', 'Failure', {
                        code: payload.message.code,
                        message: payload.message.message,
                    });

                    return err({
                        type: 'failure',
                        code: payload.message.code ?? 'Failure_UnknownCode',
                        message: payload.message.message ?? '',
                    });
                case 'ButtonRequest':
                    diagnosticLog.info('device', 'ButtonRequest, waiting for the device', {
                        code: payload.message.code,
                    });
                    deps.onButtonRequest();
                    [name, data] = ['ButtonAck', {}];
                    break;
                case 'PinMatrixRequest': {
                    // Only unlocking is expected. A request for a new PIN would mean the
                    // device is in a flow this app never starts.
                    const requestType = payload.message.type;
                    diagnosticLog.info('device', 'PinMatrixRequest', { type: requestType });
                    if (requestType != null && requestType !== 'PinMatrixRequestType_Current') {
                        await exchange('Cancel', {});

                        return err({ type: 'unexpected-response', received: requestType });
                    }

                    const pin = await deps.requestPin();
                    if (pin === undefined) return cancelPrompt('pin');

                    // A wrong PIN comes back as a Failure and ends the loop above. It is
                    // never retried here, because every wrong attempt counts towards the
                    // device wiping itself.
                    [name, data] = ['PinMatrixAck', { pin }];
                    break;
                }
                case 'PassphraseRequest': {
                    diagnosticLog.info('device', 'PassphraseRequest');
                    const passphrase = await deps.requestPassphrase();
                    if (passphrase === undefined) return cancelPrompt('passphrase');

                    [name, data] = ['PassphraseAck', { passphrase }];
                    break;
                }
                default:
                    return ok(payload);
            }
        }
    };

    const callExpecting = async <R extends PROTO.WireOutMessage>(
        type: string,
        expectedTypes: readonly R[],
        message: Record<string, unknown>,
    ): Promise<Result<PROTO.MessageResponse<R>, DeviceCallError>> => {
        if (isCallInProgress) return err({ type: 'busy' });

        isCallInProgress = true;
        try {
            const response = await runCallLoop(type, message);
            if (!response.success) return response;

            const { payload } = response;
            if (!isResponseOfType(payload, expectedTypes)) {
                diagnosticLog.warn('device', 'unexpected response', {
                    expected: expectedTypes,
                    received: payload.type,
                });

                return err({ type: 'unexpected-response', received: payload.type });
            }

            return ok(payload);
        } finally {
            isCallInProgress = false;
        }
    };

    const call: DeviceCall = (type, expectedType, message) =>
        callExpecting(type, [expectedType], message ?? {});

    function typedCall<T extends PROTO.WireInMessage, R extends PROTO.WireOutMessage[]>(
        type: T,
        resType: R,
        message?: PROTO.MessagePayload<T>,
    ): Promise<PROTO.MessageResponse<R[number]>>;
    function typedCall<T extends PROTO.WireInMessage, R extends PROTO.WireOutMessage>(
        type: T,
        resType: R,
        message?: PROTO.MessagePayload<T>,
    ): Promise<PROTO.MessageResponse<R>>;
    async function typedCall(
        type: PROTO.WireInMessage,
        resType: PROTO.WireOutMessage | PROTO.WireOutMessage[],
        message: Record<string, unknown> = {},
    ) {
        const expectedTypes = Array.isArray(resType) ? resType : [resType];
        const response = await callExpecting(type, expectedTypes, message);
        if (!response.success) throw new DeviceCallFailure(response.error);

        return response.payload;
    }

    return { call, typedCall };
};
