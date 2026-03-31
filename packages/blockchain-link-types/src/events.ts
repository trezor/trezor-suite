import type {
    AccountBalanceHistoryProgressEvent,
    BlockEvent,
    FiatRatesEvent,
    MempoolEvent,
    NotificationEvent,
} from './responses';

export interface Events {
    accountBalanceHistoryProgress: AccountBalanceHistoryProgressEvent['payload'];
    connected: undefined;
    disconnected: undefined;
    notification: NotificationEvent['payload'];
    block: BlockEvent['payload'];
    mempool: MempoolEvent['payload'];
    fiatRates: FiatRatesEvent['payload'];
}
