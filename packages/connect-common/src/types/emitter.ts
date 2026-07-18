import { type EventReceiver, TypedEmitter } from '@trezor/utils';

import type {
    BLOCKCHAIN_EVENT,
    BlockchainEvent,
    BlockchainEventMessage,
} from '../events/blockchain';
import type { DEVICE_EVENT, DeviceEvent, DeviceEventMessage } from '../events/device';
import type { PopupEvent, PopupEventMessage } from '../events/popup';
import type { TRANSPORT_EVENT, TransportEvent, TransportEventMessage } from '../events/transport';
import type { UI_EVENT, UiEvent, UiEventMessage } from '../events/ui-request';

type EventPayloadMap<T extends { type: string; payload?: any }> = {
    [E in T as E['type']]: E extends { payload: infer P } ? P : undefined;
};

type ConnectEventMap = {
    [DEVICE_EVENT]: DeviceEventMessage;
    [TRANSPORT_EVENT]: TransportEventMessage;
    [BLOCKCHAIN_EVENT]: BlockchainEventMessage;
    [UI_EVENT]: UiEventMessage | PopupEventMessage;
} & EventPayloadMap<DeviceEvent> &
    EventPayloadMap<TransportEvent> &
    EventPayloadMap<BlockchainEvent> &
    EventPayloadMap<UiEvent> &
    EventPayloadMap<PopupEvent>;

export type ConnectEvents = keyof ConnectEventMap;

export type ConnectEventCallbacks = <T extends ConnectEvents>(
    type: T,
    callback: EventReceiver<ConnectEventMap[T]>,
) => void;

export class ConnectEmitter extends TypedEmitter<ConnectEventMap> {}
