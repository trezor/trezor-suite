import type { BlockEvent, NotificationEvent, FiatRatesEvent } from './responses';

export interface Events {
    connected: undefined;
    disconnected: undefined;
    notification: NotificationEvent['payload'];
    block: BlockEvent['payload'];
    fiatRates: FiatRatesEvent['payload'];
    error: Error;
}
