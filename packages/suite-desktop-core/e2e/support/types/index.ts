import { NetworkSymbol } from '@suite-common/wallet-config';
import { urlSearchParams } from '@trezor/suite/src/utils/suite/metadata';
import { SuiteAnalyticsEvent } from '@trezor/suite-analytics';

export type Requests = ReturnType<typeof urlSearchParams>[];

export type ExtractByEventType<EventType> = Extract<SuiteAnalyticsEvent, { type: EventType }>;

export type EventPayload<T extends SuiteAnalyticsEvent> = T extends { payload: infer P }
    ? P
    : undefined;

export type PaymentMethods =
    | 'googlePay'
    | 'applePay'
    | 'creditCard'
    | 'paypal'
    | 'bankTransfer'
    | 'revolutPay';

export type PercentageOfBalanceParams = {
    percentage: number;
    balance: string | null;
    symbol: NetworkSymbol;
};
