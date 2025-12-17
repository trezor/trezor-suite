import { Analytics } from '@trezor/analytics';
import { getSuiteVersion } from '@trezor/env-utils';

import {
    AnalyticsMobileEvent,
    AnalyticsSharedEvent,
    AnyMobileEventDef,
    AnySharedEventDef,
} from '../analyticsEvents';
import type { AttributeDef, EventDef } from '../analyticsSchema';
import { type SuiteNativeAnalyticsEvent } from './types';
import { SuiteSharedAnalyticsEvent } from '../shared/types';

/** @deprecated use `reportAnalytics` instead */
export const analytics = new Analytics<SuiteNativeAnalyticsEvent | SuiteSharedAnalyticsEvent>({
    version: getSuiteVersion(),
    app: 'suite',
});

export const newAnalytics = new Analytics<AnalyticsMobileEvent | AnalyticsSharedEvent>({
    version: getSuiteVersion(),
    app: 'suite',
});

type PayloadFor<E extends EventDef<any, any>> = {
    [K in keyof E['attributes']]: NonNullable<E['attributes'][K]> extends AttributeDef<infer V>
        ? V
        : never;
};

type PayloadByEventName = {
    [E in AnyMobileEventDef | AnySharedEventDef as E['name']]: PayloadFor<E>;
};

export function reportAnalytics<N extends keyof PayloadByEventName>(args: {
    type: N;
    payload: PayloadByEventName[N];
    timestamp?: string;
    config?: any;
}) {
    const { type, payload, timestamp, config } = args;

    const attributes: Record<string, { value: unknown }> = {};

    for (const key of Object.keys(payload)) {
        attributes[key] = { value: (payload as any)[key] };
    }

    newAnalytics.report(
        {
            type,
            timestamp,
            attributes,
        } as any,
        config,
    );
}
