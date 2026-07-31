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

// Analytics definitions have two shapes. Attribute-based definitions describe every payload
// property with AttributeDef, while payload-based definitions carry their payload type directly.
// The empty attribute map is still an attribute-based definition, but HasKeys makes its event
// instance a defined event without a payload.
type HasKeys<T> = keyof T extends never ? false : true;
type IsAttributeMap<T> = T extends Record<string, AttributeDef<any>> ? true : false;

// AttributeDef's optional value exists only as a type carrier in analytics metadata. Extract its
// value type and map the metadata keys to the payload accepted by report(). Mapped types preserve
// optional attributes, so an optional AttributeDef becomes an optional payload property.
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

// Infer the payload and event name from each definition. Because E is the checked side of this
// conditional type, TypeScript distributes the conversion over unions and produces a discriminated
// union of event instances. Attribute maps are converted property by property; other payload types
// are carried through unchanged.
export type EventInstance<E extends EventDef<any, any>> =
    E extends EventDef<infer A, infer N>
        ? IsAttributeMap<A> extends true
            ? AttributeEventInstance<A, N>
            : PayloadEventInstance<A, N>
        : never;
