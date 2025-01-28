import type { BlockEvent, FiatRatesEvent, MempoolEvent, NotificationEvent } from './responses';

export interface Events {
    connected: undefined;
    disconnected: undefined;
    notification: NotificationEvent['payload'];
    block: BlockEvent['payload'];
    mempool: MempoolEvent['payload'];
    fiatRates: FiatRatesEvent['payload'];
}
