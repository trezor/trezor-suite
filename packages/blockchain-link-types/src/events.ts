import type { BlockEvent, NotificationEvent, FiatRatesEvent, MempoolEvent } from './responses';

export interface Events {
    connected: undefined;
    disconnected: undefined;
    notification: NotificationEvent['payload'];
    block: BlockEvent['payload'];
    mempool: MempoolEvent['payload'];
    fiatRates: FiatRatesEvent['payload'];
}
