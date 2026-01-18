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
type HasAttributes<A> = keyof A extends never ? false : true;

export type EventDef<A, N extends EventName = EventName> = AnalyticsBaseEvent & {
    name: N;
    attributes: A;
};

type AttributePayload<T> = NonNullable<T> extends AttributeDef<infer V> ? V : never;
export type EventInstance<E extends EventDef<any, any>> =
    E extends EventDef<infer A, infer N>
        ? HasAttributes<A> extends true
            ? {
                  type: N;
                  payload: {
                      [K in keyof A]: AttributePayload<A[K]>;
                  };
              }
            : {
                  type: N;
              }
        : never;
