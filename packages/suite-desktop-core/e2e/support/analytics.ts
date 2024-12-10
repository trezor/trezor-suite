import { Page } from '@playwright/test';

import { SuiteAnalyticsEvent } from '@trezor/suite-analytics';
import { Requests, EventPayload } from '@trezor/suite-web/e2e/support/types';
import { urlSearchParams } from '@trezor/suite/src/utils/suite/metadata';

export class AnalyticsFixture {
    private window: Page;
    requests: Requests = [];

    constructor(window: Page) {
        this.window = window;
    }

    //TODO: #15811 To be refactored
    findAnalyticsEventByType = <T extends SuiteAnalyticsEvent>(eventType: T['type']) => {
        const event = this.requests.find(req => req.c_type === eventType) as EventPayload<T>;

        if (!event) {
            throw new Error(`Event with type ${eventType} not found.`);
        }

        return event;
    };

    //TODO: #15811 To be refactored
    async interceptAnalytics() {
        await this.window.route('**://data.trezor.io/suite/log/**', route => {
            const url = route.request().url();
            const params = urlSearchParams(url);
            this.requests.push(params);
            route.continue();
        });
    }
}
