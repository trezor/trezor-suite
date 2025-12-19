import { AttributeDef, EventDef, sharedEventsData } from '@suite-common/analytics';

import * as mobileEventsData from './events';

export const mobileEvents = mobileEventsData;
export const sharedEvents = sharedEventsData;

export type AnyMobileEventDef = (typeof mobileEvents)[keyof typeof mobileEvents];
export type AnySharedEventDef = (typeof sharedEvents)[keyof typeof sharedEvents];

type AttrsOf<E extends EventDef<any, any>> = E['attributes'];

type AttributePayload<T> = NonNullable<T> extends AttributeDef<infer V> ? { value: V } : never;

export type EventInstance<E extends EventDef<any, any>> = {
    type: E['name'];
    timestamp?: string;
    attributes: {
        [K in keyof AttrsOf<E>]: AttributePayload<AttrsOf<E>[K]>;
    };
};

export type AnalyticsMobileEvent = EventInstance<AnyMobileEventDef>;
export type AnalyticsSharedEvent = EventInstance<AnySharedEventDef>;
