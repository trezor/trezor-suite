import type { BlockchainEventMessage } from './blockchain';
import type { MethodCallMessage, MethodResponseMessage } from './call';
import type { DeviceEventMessage } from './device';
import type { IFrameEventMessage } from './iframe';
import type { PopupEventMessage } from './popup';
import type { TransportEventMessage } from './transport';
import type { UiEventMessage } from './ui-request';
import type { UiResponseMessage } from './ui-response';
import type { Unsuccessful } from '../types/params';

export const CORE_EVENT = 'CORE_EVENT';

export type CoreMessage = {
    id?: number; // response id in ResponseMessage
    success?: boolean; // response status in ResponseMessage
} & (
    | BlockchainEventMessage
    | DeviceEventMessage
    | TransportEventMessage
    | UiEventMessage
    | UiResponseMessage
    | MethodCallMessage
    | MethodResponseMessage
    | IFrameEventMessage
    | PopupEventMessage
);

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
export const ErrorMessage = (error: Error & { code?: string }): Unsuccessful => ({
    success: false,
    payload: {
        error: error.message,
        code: error.code,
    },
});
