import type { Analytics, Event as AnalyticsEventBase } from '@trezor/analytics';
import { typedObjectKeys } from '@trezor/utils';

import type { AttributeDef } from './analyticsSchema';

type AnyEventDefLike = {
    name: string;
    attributes: Record<string, unknown>;
};
type AttrValue<T> = NonNullable<T> extends AttributeDef<infer V> ? V : never;

type OptionalKeys<T> = {
    [K in keyof T]-?: undefined extends T[K] ? K : never;
}[keyof T];

type RequiredKeys<T> = Exclude<keyof T, OptionalKeys<T>>;

export type PayloadFor<E extends AnyEventDefLike> = {
    [K in RequiredKeys<E['attributes']> & string]: AttrValue<E['attributes'][K]>;
} & { [K in OptionalKeys<E['attributes']> & string]?: AttrValue<E['attributes'][K]> | undefined };

export function createReportAnalytics<
    AnyEventDefUnion extends AnyEventDefLike,
    AnalyticsEventUnion extends AnalyticsEventBase,
>(analytics: Analytics<AnalyticsEventUnion>) {
    type PayloadByEventName = {
        [E in AnyEventDefUnion as E['name']]: PayloadFor<E>;
    };

    return function reportAnalytics<N extends keyof PayloadByEventName>(args: {
        type: N;
        payload: PayloadByEventName[N];
        timestamp?: string;
        config?: any;
    }) {
        const { type, payload, timestamp, config } = args;

        type Payload = PayloadByEventName[N];
        const attributes = {} as Record<Extract<keyof Payload, string>, { value: unknown }>;

        for (const key of typedObjectKeys(payload as unknown as Record<any, any>)) {
            const k = key as Extract<keyof Payload, string>;
            attributes[k] = { value: payload[k] };
        }

        analytics.report(
            {
                type,
                timestamp,
                attributes,
            } as any,
            config,
        );
    };
}
