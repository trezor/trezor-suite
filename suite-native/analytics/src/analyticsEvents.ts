import type { AnalyticsSharedEvents, EventInstance } from '@suite-common/analytics';

import type * as nativeEvents from './events';

type AnyNativeEventsDef = (typeof nativeEvents)[keyof typeof nativeEvents];
export type AnalyticsNativeEvents = EventInstance<AnyNativeEventsDef> | AnalyticsSharedEvents;
