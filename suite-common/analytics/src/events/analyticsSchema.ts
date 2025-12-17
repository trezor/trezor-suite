import type { AnalyticsBaseAttribute, AnalyticsBaseEvent } from './types';

export type AttributeDef<T> = AnalyticsBaseAttribute & {
    value?: T;
};

export type EventDef<Name extends string, A> = AnalyticsBaseEvent & {
    name: Name;
    attributes: A;
};
