import { AnalyticsDesktopEvents, SuiteDesktopLegacyAnalyticsEvents } from '@suite/analytics';
import { NetworkSymbol } from '@suite-common/wallet-config';
import { urlSearchParams } from '@trezor/suite/src//utils/suite/metadata';
export type Requests = ReturnType<typeof urlSearchParams>[];

/**
 * Union of legacy and migrated (new) desktop analytics events.
 * Use this for e2e so findAnalyticsEventByType works for both legacy events
 * and events migrated from legacyAnalytics to the new analytics (e.g. DeviceConnect).
 */
export type SuiteDesktopAnalyticsEventsForE2e =
    | SuiteDesktopLegacyAnalyticsEvents
    | AnalyticsDesktopEvents;

export type ExtractByEventType<EventType> = Extract<
    SuiteDesktopAnalyticsEventsForE2e,
    { type: EventType }
>;

export type EventPayload<T extends SuiteDesktopAnalyticsEventsForE2e> = T extends {
    payload: infer P;
}
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

declare global {
    interface Window {
        // Needed for Cypress and Playwright
        Playwright?: any;
        store?: any;
    }
}
