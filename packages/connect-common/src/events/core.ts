import type {
    ErrorCode,
    SerializedError,
    TrezorError,
} from '../constants/errors';
import type { Err } from '@trezor/type-utils';

import type { BlockchainEventMessage } from './blockchain';
import type { CoreCallMessage, MethodResponseMessage } from './call';
import type { DeviceEventMessage } from './device';
import type { PopupClosedMessage, PopupEventMessage } from './popup';
import type {
    TransportDisableWebUSB,
    TransportEventMessage,
    TransportGetInfo,
    TransportRequestWebUSBDevice,
    TransportSetTransports,
} from './transport';
import type { UiEventMessage } from './ui-request';
import type { UiResponseEvent } from './ui-response';

export const CORE_EVENT = 'CORE_EVENT';

export type CoreRequestMessage =
    | PopupClosedMessage
    | TransportDisableWebUSB
    | TransportSetTransports
    | TransportRequestWebUSBDevice
    | TransportGetInfo
    | UiResponseEvent
    | CoreCallMessage;

export type CoreEventMessage = {
    success?: boolean; // response status in ResponseMessage
    channel?: { here: string; peer: string }; // channel name
} & (
    | BlockchainEventMessage
    | DeviceEventMessage
    | TransportEventMessage
    | UiEventMessage
    | MethodResponseMessage
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
        device: messageData.device,
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
export const createErrorMessage = (
    error: (Error & { code?: ErrorCode }) | TrezorError,
): Err<SerializedError> => ({
    success: false,
    error: {
        message: error.message,
        code: error.code ?? 'Failure_UnknownCode',
    },
});
