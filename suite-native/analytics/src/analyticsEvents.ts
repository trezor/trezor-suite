import type { AnalyticsSharedEvents, EventInstance } from '@suite-common/analytics';

import * as nativeEventsData from './events';

export const nativeEvents = nativeEventsData;
export type AnyNativeEventsDef = (typeof nativeEvents)[keyof typeof nativeEvents];
export type AnalyticsNativeEvents = EventInstance<AnyNativeEventsDef> | AnalyticsSharedEvents;
