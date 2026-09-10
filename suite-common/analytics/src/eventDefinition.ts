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

// An event can describe its data in two ways:
// 1. List every field separately in `attributes` with a prescribed structure, e.g. `amount: AttributeDef<number>` (real example: `createBackupEvent`).
// 2. Arbitrary object payload with no per-field documentation, via `payloadType` (real example: `accountsNonZeroBalanceEvent`).
// `HasKeys` checks whether the attributes list is empty. `IsAttributeMap` tells these two kinds of
// event apart.
type HasKeys<T> = keyof T extends never ? false : true;
type IsAttributeMap<T> = T extends Record<string, AttributeDef<any>> ? true : false;

// `AttributeDef<string>` contains documentation plus `value?: string`. We never read `value`; it is
// only a clue for TypeScript that this attribute will contain a string when the event is reported.
// `AttributePayload` pulls out that string type. `NonNullable` first removes `undefined`, which may
// be there when the attribute is optional.
//
// `AttributeEventInstance` then repeats this for every attribute:
// `{ label: AttributeDef<string> }` becomes `payload: { label: string }`.
// Optional attributes stay optional. If the attributes list is empty, the event has only `type`
// and does not require a useless empty payload.
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
        : // This is effectively a fallback for events that don't conform to Attribute Map (events with more arbitrary data that are assignable to this).
          AnalyticsBaseEvent & {
              name: N;
              // Never used at runtime, it's only to give `EventInstance` something to `infer A` from, so it can recover the payload type below.
              payloadType?: A;
          };

// `EventInstance` is the final translator from an event description to the object the app reports:
// `EventDef<{ amount: AttributeDef<number> }, 'buy'>`
// becomes `{ type: 'buy'; payload: { amount: number } }`.
//
// `infer` pulls the data type (`A`) and event name (`N`) out of `EventDef`. If `E` contains several
// event definitions joined with `|`, TypeScript translates each one separately. This keeps every
// event name paired with the correct payload.
export type EventInstance<E extends EventDef<any, any>> =
    E extends EventDef<infer A, infer N>
        ? IsAttributeMap<A> extends true
            ? AttributeEventInstance<A, N>
            : PayloadEventInstance<A, N>
        : never;
