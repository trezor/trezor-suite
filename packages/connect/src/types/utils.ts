// REF-TODO: shared util with desktop-api
export type UnionToIntersection<U> = (U extends any ? (k: U) => void : never) extends (
    k: infer I,
) => void
    ? I
    : never;

export type MessageFactoryFn<Group, Event> = UnionToIntersection<
    Event extends { type: string }
        ? Event extends { payload: any }
            ? (
                  type: Event['type'],
                  payload: Event['payload'],
              ) => { event: Group; type: Event['type']; payload: Event['payload'] }
            : (
                  type: Event['type'],
                  payload?: undefined,
              ) => { event: Group; type: Event['type']; payload: undefined }
        : never
>;
