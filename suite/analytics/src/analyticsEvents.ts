import type { AnalyticsSharedEvents, EventInstance } from '@suite-common/analytics';

import * as desktopEventsData from './events';

export const desktopEvents = desktopEventsData;
export type AnyDesktopEventsDef = (typeof desktopEvents)[keyof typeof desktopEvents];
export type AnalyticsDesktopEvents = EventInstance<AnyDesktopEventsDef> | AnalyticsSharedEvents;
