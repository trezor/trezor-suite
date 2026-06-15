export type AppVersion = `${number}.${number}.${number}` | '?';

export type AnalyticsPlatform = 'desktop' | 'mobile';

type BaseData = {
    changelog: Array<{ version: AppVersion; notes: string }>;
    description?: string;
};

type AnalyticsBaseAttribute = BaseData;

type AnalyticsBaseEvent = BaseData & {
    name: string;
    descriptionTrigger: string;
    possibleImprovements?: string;
};

export type AttributeDef<T> = AnalyticsBaseAttribute & {
    value?: T;
};

type Domain = string;
type EventName = `${Domain}/${string}` | `${string}`;

type HasKeys<T> = keyof T extends never ? false : true;
type IsAttributeMap<T> = T extends Record<string, AttributeDef<any>> ? true : false;

type AttributePayload<T> = NonNullable<T> extends AttributeDef<infer V> ? V : never;

type AttributeEventInstance<A, N> =
    HasKeys<A> extends true
        ? {
              type: N;
              payload: {
                  [K in keyof A]: AttributePayload<A[K]>;
              };
          }
        : {
              type: N;
          };

type PayloadEventInstance<A, N> = {
    type: N;
    payload: A;
};

export type EventDef<A, N extends EventName = EventName> =
    IsAttributeMap<A> extends true
        ? AnalyticsBaseEvent & {
              name: N;
              attributes: A;
          }
        : AnalyticsBaseEvent & {
              name: N;
              payloadType?: A;
          };

export type EventInstance<E extends EventDef<any, any>> =
    E extends EventDef<infer A, infer N>
        ? IsAttributeMap<A> extends true
            ? AttributeEventInstance<A, N>
            : PayloadEventInstance<A, N>
        : never;
