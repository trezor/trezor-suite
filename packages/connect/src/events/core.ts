import type { BlockchainEventMessage } from './blockchain';
import type { IFrameCallMessage, MethodResponseMessage } from './call';
import type { DeviceEventMessage } from './device';
import type { IFrameEventMessage, IFrameInit, IFrameLogRequest } from './iframe';
import type { PopupAnalyticsResponse, PopupClosedMessage, PopupEventMessage } from './popup';
import type {
    TransportEventMessage,
    TransportDisableWebUSB,
    TransportRequestWebUSBDevice,
} from './transport';
import type { UiEventMessage } from './ui-request';
import type { UiResponseEvent } from './ui-response';
import type { Unsuccessful } from '../types/params';

export const CORE_EVENT = 'CORE_EVENT';

export type CoreRequestMessage =
    | PopupClosedMessage
    | PopupAnalyticsResponse
    | TransportDisableWebUSB
    | TransportRequestWebUSBDevice
    | UiResponseEvent
    | IFrameInit
    | IFrameCallMessage
    | IFrameLogRequest;

export type CoreEventMessage = {
    success?: boolean; // response status in ResponseMessage
} & (
    | BlockchainEventMessage
    | DeviceEventMessage
    | TransportEventMessage
    | UiEventMessage
    | MethodResponseMessage
    | IFrameEventMessage
    | PopupEventMessage
);

// parse MessageEvent .data into CoreMessage
export const parseMessage = <T extends CoreRequestMessage | CoreEventMessage = never>(
    messageData: any,
): T => {
    const message = {
        event: messageData.event,
        type: messageData.type,
        payload: messageData.payload,
    };

    if (typeof messageData.id === 'number') {
        (message as any).id = messageData.id;
    }

    if (typeof messageData.success === 'boolean') {
        (message as any).success = messageData.success;
    }

    return message as T;
};

// common response used straight from npm index (not from Core)
export const createErrorMessage = (error: Error & { code?: string }): Unsuccessful => ({
    success: false,
    payload: {
        error: error.message,
        code: error.code,
    },
});
