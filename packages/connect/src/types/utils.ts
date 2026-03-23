import type { UnionToIntersection } from '@trezor/type-utils';

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
