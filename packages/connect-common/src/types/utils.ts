import type { UnionToIntersection } from '@trezor/type-utils';

export type MessageFactoryFn<Group, Event> = UnionToIntersection<
    Event extends { type: string }
        ? Event extends { payload: any }
            ? (
                  type: Event['type'],
                  payload: Event['payload'],
                  requestId?: string,
              ) => {
                  event: Group;
                  type: Event['type'];
                  payload: Event['payload'];
                  requestId?: string;
              }
            : (
                  type: Event['type'],
                  payload?: undefined,
                  requestId?: string,
              ) => { event: Group; type: Event['type']; payload: undefined; requestId?: string }
        : never
>;
