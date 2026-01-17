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

type Domain = string;
type EventName = `${Domain}/${string}` | `${string}`;

export type EventDef<A, N extends EventName = EventName> = AnalyticsBaseEvent & {
    name: N;
    attributes: A;
};

type AttributePayload<T> = NonNullable<T> extends AttributeDef<infer V> ? V : never;

export type EventInstance<E extends EventDef<any, any>> =
    E extends EventDef<infer A, infer N>
        ? {
              type: N;
              timestamp?: string;
              payload: {
                  [K in keyof A]: AttributePayload<A[K]>;
              };
          }
        : never;
