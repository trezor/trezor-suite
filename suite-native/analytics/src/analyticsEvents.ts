import type { AnalyticsSharedEvents, EventInstance } from '@suite-common/analytics';

import * as nativeEventsData from './events';

export const nativeEvents = nativeEventsData;
export type AnyNativeEventsDef = (typeof nativeEvents)[keyof typeof nativeEvents];
export type AnalyticsNativeEvents = EventInstance<AnyNativeEventsDef> | AnalyticsSharedEvents;

export type TradingBuyQuotePayload = Omit<
    EventInstance<typeof nativeEvents.tradingBuyEvent>['payload'],
    'step' | 'action'
>;
export type TradingSellQuotePayload = Omit<
    EventInstance<typeof nativeEvents.tradingSellEvent>['payload'],
    'step' | 'action'
>;
export type TradingExchangeQuotePayload = Omit<
    EventInstance<typeof nativeEvents.tradingExchangeEvent>['payload'],
    'step' | 'action'
>;
