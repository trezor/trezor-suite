import type { AnalyticsBaseAttribute, AnalyticsBaseEvent } from './types';

export type AttributeDef<T> = AnalyticsBaseAttribute & {
    value?: T;
};

type Domain = string; //'promo' | 'shared' | 'desktop' | 'mobile' | 'web';
type EventName = `${Domain}/${string}` | `${string}`; // @TODO

export type EventDef<A, N extends EventName = EventName> = AnalyticsBaseEvent & {
    name: N;
    attributes: A;
};
