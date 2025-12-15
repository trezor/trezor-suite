import type { BLOCKCHAIN_EVENT, BlockchainEvent } from '../../events/blockchain';
import type { DEVICE_EVENT, DeviceEvent } from '../../events/device';
import type { TRANSPORT_EVENT, TransportEvent } from '../../events/transport';
import type { UI_EVENT, UiEvent } from '../../events/ui-request';

type EventType<Event> = Event extends { type: string } ? Event['type'] : never;
export type EventListenerType =
    | typeof BLOCKCHAIN_EVENT
    | typeof DEVICE_EVENT
    | typeof TRANSPORT_EVENT
    | typeof UI_EVENT
    | EventType<TransportEvent>
    | EventType<UiEvent>
    | EventType<DeviceEvent>
    | EventType<BlockchainEvent>;

export declare function off(type: EventListenerType, cb: (...args: any[]) => any): void;
