import {
    BLOCKCHAIN_EVENT,
    BlockchainEvent,
    BlockchainEventMessage,
    DEVICE_EVENT,
    DeviceEvent,
    DeviceEventMessage,
    PopupEvent,
    PopupEventMessage,
    TRANSPORT_EVENT,
    TransportEvent,
    TransportEventMessage,
    UI_EVENT,
    UiEvent,
    UiEventMessage,
} from '../events';

type EventPayloadMap<T extends { type: string; payload?: any }> = {
    [E in T as E['type']]: E extends { payload: infer P } ? P : undefined;
};

export type ConnectEvents = {
    [DEVICE_EVENT]: DeviceEventMessage;
    [TRANSPORT_EVENT]: TransportEventMessage;
    [BLOCKCHAIN_EVENT]: BlockchainEventMessage;
    [UI_EVENT]: UiEventMessage | PopupEventMessage;
} & EventPayloadMap<DeviceEvent> &
    EventPayloadMap<TransportEvent> &
    EventPayloadMap<BlockchainEvent> &
    EventPayloadMap<UiEvent> &
    EventPayloadMap<PopupEvent>;
