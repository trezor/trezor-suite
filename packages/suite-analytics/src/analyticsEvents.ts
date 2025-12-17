import { AttributeDef, EventDef, sharedEventsData } from '@suite-common/analytics';

import * as desktopEventsData from './events';

export const desktopEvents = desktopEventsData;
export const sharedEvents = sharedEventsData;

export type AnyDesktopEventDef = (typeof desktopEvents)[keyof typeof desktopEvents];
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

export type AnalyticsDesktopEvent = EventInstance<AnyDesktopEventDef>;
export type AnalyticsSharedEvent = EventInstance<AnySharedEventDef>;
