import { SuiteDesktopLegacyAnalyticsEvents } from '@suite/analytics';
import { NetworkSymbol } from '@suite-common/wallet-config';
import { urlSearchParams } from '@trezor/suite/src//utils/suite/metadata';
export type Requests = ReturnType<typeof urlSearchParams>[];

export type ExtractByEventType<EventType> = Extract<
    SuiteDesktopLegacyAnalyticsEvents,
    { type: EventType }
>;

export type EventPayload<T extends SuiteDesktopLegacyAnalyticsEvents> = T extends {
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
