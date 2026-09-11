import type { TRANSPORT } from '@trezor/transport-common';

import { BLOCKCHAIN, type BlockchainEvent, createBlockchainMessage } from './blockchain';
import { DEVICE, type DeviceEvent, createDeviceMessage } from './device';
import { type TransportEvent, createTransportMessage } from './transport';
import { UI_EVENTS, type UiEvent, createUiEventMessage } from './ui-event';
import { UI_REQUESTS, type UiRequestEvent, createUiRequestMessage } from './ui-request';

/* BLOCKCHAIN MESSAGES */
declare const blockchainError: Extract<
    BlockchainEvent,
    { type: typeof BLOCKCHAIN.ERROR }
>['payload'];
const blockchainMessage = createBlockchainMessage(BLOCKCHAIN.ERROR, blockchainError);
void (blockchainMessage.type satisfies typeof BLOCKCHAIN.ERROR);
void (blockchainMessage.payload satisfies typeof blockchainError);

declare const blockchainNotification: Extract<
    BlockchainEvent,
    { type: typeof BLOCKCHAIN.NOTIFICATION }
>['payload'];
const blockchainMessage2 = createBlockchainMessage(BLOCKCHAIN.NOTIFICATION, blockchainNotification);
void (blockchainMessage2.type satisfies typeof BLOCKCHAIN.NOTIFICATION);
void (blockchainMessage2.payload satisfies typeof blockchainNotification);

// @ts-expect-error Payload is required for blockchain error messages.
createBlockchainMessage(BLOCKCHAIN.ERROR);

/* DEVICE MESSAGES */
declare const deviceButtonRequest: Extract<DeviceEvent, { type: typeof DEVICE.BUTTON }>['payload'];
const deviceMessage = createDeviceMessage(DEVICE.BUTTON, deviceButtonRequest);
void (deviceMessage.type satisfies typeof DEVICE.BUTTON);
void (deviceMessage.payload satisfies typeof deviceButtonRequest);

declare const deviceConnect: Extract<DeviceEvent, { type: typeof DEVICE.CONNECT }>['payload'];
const deviceMessage2 = createDeviceMessage(DEVICE.CONNECT, deviceConnect);
// @ts-expect-error TODO
void (deviceMessage2.type satisfies typeof DEVICE.CONNECT);
// @ts-expect-error TODO
void (deviceMessage2.payload satisfies typeof deviceConnect);

// @ts-expect-error Device button payload is not compatible with blockchain error type.
createDeviceMessage(BLOCKCHAIN.ERROR, deviceButtonRequest);
// @ts-expect-error Device message type is not compatible with the payload.
createDeviceMessage(DEVICE.CONNECT, deviceButtonRequest);

/* TRANSPORT MESSAGES */
declare const transportError: Extract<TransportEvent, { type: typeof TRANSPORT.ERROR }>['payload'];
declare const transportErrorType: typeof TRANSPORT.ERROR;

const transportMessage = createTransportMessage(transportErrorType, transportError);
void (transportMessage.type satisfies typeof TRANSPORT.ERROR);
void (transportMessage.payload satisfies typeof transportError);

// @ts-expect-error
void (transportMessage.payload satisfies typeof blockchainError);

declare const transportStartType: typeof TRANSPORT.START;
declare const transportStart: Extract<TransportEvent, { type: typeof TRANSPORT.START }>['payload'];
const transportMessage1 = createTransportMessage(transportStartType, transportStart);
void (transportMessage1.type satisfies typeof TRANSPORT.START);
void (transportMessage1.payload satisfies typeof transportStart);

declare const transportRequestDevice: typeof TRANSPORT.REQUEST_DEVICE;
// @ts-expect-error Transport request-device is not a transport event message.
createTransportMessage(transportRequestDevice, undefined);

// @ts-expect-error Transport error messages require an error payload.
createTransportMessage(transportErrorType, undefined);

/* UI EVENT MESSAGES */
declare const uiEventPayload: Extract<
    UiEvent,
    { type: typeof UI_EVENTS.BUNDLE_PROGRESS }
>['payload'];

const uiEventMessage = createUiEventMessage(UI_EVENTS.TRANSPORT_MISSING);
void (uiEventMessage.type satisfies typeof UI_EVENTS.TRANSPORT_MISSING);
void (uiEventMessage.payload satisfies undefined);

const uiEventMessage2 = createUiEventMessage(UI_EVENTS.BUNDLE_PROGRESS, uiEventPayload);
void (uiEventMessage2.type satisfies typeof UI_EVENTS.BUNDLE_PROGRESS);
void (uiEventMessage2.payload satisfies typeof uiEventPayload);

// TODO: ts-expect-error Transport missing UI event does not accept a payload.
createUiEventMessage(UI_EVENTS.TRANSPORT_MISSING, undefined);

// @ts-expect-error Bundle progress UI event requires a payload.
createUiEventMessage(UI_EVENTS.BUNDLE_PROGRESS);

/* UI REQUEST MESSAGES */
declare const uiRequestPayload: Extract<
    UiRequestEvent,
    { type: typeof UI_REQUESTS.REQUEST_PIN }
>['payload'];

const uiRequestMessage = createUiRequestMessage(UI_REQUESTS.REQUEST_PIN, uiRequestPayload, {
    requestId: 'request-id',
});
void (uiRequestMessage.type satisfies typeof UI_REQUESTS.REQUEST_PIN);
void (uiRequestMessage.payload satisfies typeof uiRequestPayload);

// TODO: ts-expect-error UI request messages require request options.
// createUiRequestMessage(UI_REQUESTS.REQUEST_PIN, uiRequestPayload);

// TODO: ts-expect-error UI request options require requestId.
createUiRequestMessage(UI_REQUESTS.REQUEST_PIN, uiRequestPayload, {});
