import { EventInstance } from '@suite-common/analytics';

import * as mobileEventsData from './events';

export const mobileEvents = mobileEventsData;

export type AnyMobileEventDef = (typeof mobileEvents)[keyof typeof mobileEvents];

export type AnalyticsMobileEvent = EventInstance<AnyMobileEventDef>;
