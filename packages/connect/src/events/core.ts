import type { BlockchainEventMessage } from './blockchain';
import type { DeviceEventMessage } from './device';
import type { IframeEventMessage } from './iframe';
import type { PopupEventMessage } from './popup';
import type { TransportEventMessage } from './transport';
import type { UiEventMessage } from './ui-request';
import type { UiResponseMessage } from './ui-response';
import type { Unsuccessful, Response } from '../types/params';

export const CORE_EVENT = 'CORE_EVENT';
export const RESPONSE_EVENT = 'RESPONSE_EVENT';

export type ResponseMessageType = {
    event: typeof RESPONSE_EVENT;
    type: typeof RESPONSE_EVENT;
    id: number;
    success: boolean;
    payload: Response<any>;
};

export type CoreMessage = {
    id?: number; // response id in ResponseMessage
    success?: boolean; // response status in ResponseMessage
} & (
    | BlockchainEventMessage
    | DeviceEventMessage
    | TransportEventMessage
    | UiEventMessage
    | UiResponseMessage
    | ResponseMessageType
    | IframeEventMessage
    | PopupEventMessage
);
// REF-TODO: add IFRAME.CALL + UiResponse

export type PostMessageEvent = MessageEvent<CoreMessage>;

// parse MessageEvent .data into CoreMessage
export const parseMessage = (messageData: any): CoreMessage => {
    const message: CoreMessage = {
        event: messageData.event,
        type: messageData.type,
        payload: messageData.payload,
    };

    if (typeof messageData.id === 'number') {
        message.id = messageData.id;
    }

    if (typeof messageData.success === 'boolean') {
        message.success = messageData.success;
    }

    return message;
};

// common response used straight from npm index (not from Core)
export const ErrorMessage = (error: Error & { code?: any }) =>
    ({
        success: false,
        payload: {
            error: error.message,
            code: error.code,
        },
    } as Unsuccessful);

export const ResponseMessage = (
    id: number,
    success: boolean,
    payload: any = null,
): CoreMessage => ({
    event: RESPONSE_EVENT,
    type: RESPONSE_EVENT,
    id,
    success,
    // convert Error/TypeError object into payload error type (Error object/class is converted to string while sent via postMessage)
    payload: success ? payload : { error: payload.error.message, code: payload.error.code },
});
