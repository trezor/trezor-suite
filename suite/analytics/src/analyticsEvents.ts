import { EventInstance } from '@suite-common/analytics';

import * as desktopEventsData from './events';

export const desktopEvents = desktopEventsData;

export type AnyDesktopEventDef = (typeof desktopEvents)[keyof typeof desktopEvents];

export type AnalyticsDesktopEvent = EventInstance<AnyDesktopEventDef>;
