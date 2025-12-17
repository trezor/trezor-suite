import type { Analytics, Event as AnalyticsEventBase } from '@trezor/analytics';
import { typedObjectKeys } from '@trezor/utils';

import type { AttributeDef } from './analyticsSchema';

type AnyEventDefLike = {
    name: string;
    attributes: Record<string, unknown>;
};

type PayloadFor<E extends AnyEventDefLike> = {
    [K in keyof E['attributes'] & string]: NonNullable<E['attributes'][K]> extends AttributeDef<
        infer V
    >
        ? V
        : never;
};

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
