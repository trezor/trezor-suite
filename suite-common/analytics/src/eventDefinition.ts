export type AppVersion = `${number}.${number}.${number}`;

export type BaseData = {
    changelog: Array<{ version: AppVersion; notes: string }>;
    limitations?: string;
    description?: string;
};

export type AnalyticsBaseAttribute = BaseData & {
    definition?: string;
};

export type AnalyticsBaseEvent = BaseData & {
    name: string;
    descriptionTrigger: string;
};

export type AttributeDef<T> = AnalyticsBaseAttribute & {
    value?: T;
};

type Domain = string; //'promo' | 'shared' | 'desktop' | 'mobile' | 'web';
type EventName = `${Domain}/${string}` | `${string}`; // @TODO

export type EventDef<A, N extends EventName = EventName> = AnalyticsBaseEvent & {
    name: N;
    attributes: A;
};

type AttrsOf<E extends EventDef<any, any>> = E['attributes'];

type AttributePayload<T> = NonNullable<T> extends AttributeDef<infer V> ? { value: V } : never;

export type EventInstance<E extends EventDef<any, any>> = {
    type: E['name'];
    timestamp?: string;
    attributes: {
        [K in keyof AttrsOf<E>]: AttributePayload<AttrsOf<E>[K]>;
    };
};
