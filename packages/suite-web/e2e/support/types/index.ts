import { SuiteAnalyticsEvent } from '@trezor/suite-analytics';
import { urlSearchParams } from '@trezor/suite/@trezor/metadata/src/utils';

export type Requests = ReturnType<typeof urlSearchParams>[];

export type ExtractByEventType<EventType> = Extract<SuiteAnalyticsEvent, { type: EventType }>;

export type EventPayload<T extends SuiteAnalyticsEvent> = T extends { payload: infer P }
    ? P
    : undefined;
