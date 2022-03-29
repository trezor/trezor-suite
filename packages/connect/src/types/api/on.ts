import type { BlockchainEvent, BlockchainEventListenerFn } from '../../events/blockchain';
import type { DeviceEvent, DeviceEventListenerFn } from '../../events/device';
import type { TransportEvent, TransportEventListenerFn } from '../../events/transport';
import type { UiEvent, UiEventListenerFn, ProgressEventListenerFn } from '../../events/ui-request';
import type { UnionToIntersection } from '../utils';

type DetailedEvent<Event> = Event extends { type: string }
    ? Event extends { payload: any }
        ? (type: Event['type'], cb: (event: Event['payload']) => any) => void
        : (type: Event['type'], cb: () => any) => void
    : never;

type EventsUnion =
    | BlockchainEventListenerFn
    | DetailedEvent<BlockchainEvent>
    | DeviceEventListenerFn
    | DetailedEvent<DeviceEvent>
    | TransportEventListenerFn
    | DetailedEvent<TransportEvent>
    | UiEventListenerFn
    | DetailedEvent<UiEvent>
    | ProgressEventListenerFn;

export declare const on: UnionToIntersection<EventsUnion>;
