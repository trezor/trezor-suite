import { Page } from '@playwright/test';

import { urlSearchParams } from '@trezor/suite/src/utils/suite/metadata';
import { SuiteAnalyticsEvent } from '@trezor/suite-analytics';
import { EventPayload, Requests } from '@trezor/suite-web/e2e/support/types';

import { step } from './common';

export class AnalyticsFixture {
    private page: Page;
    requests: Requests = [];

    constructor(page: Page) {
        this.page = page;
    }

    //TODO: #15811 To be refactored
    findAnalyticsEventByType<T extends SuiteAnalyticsEvent>(eventType: T['type']) {
        const event = this.requests.find(req => req.c_type === eventType) as EventPayload<T>;

        if (!event) {
            throw new Error(`Event with type ${eventType} not found.`);
        }

        return event;
    }

    extractRequestTypes() {
        return this.requests.map(request => request['c_type']);
    }

    //TODO: #15811 To be refactored
    @step()
    async interceptAnalytics() {
        await this.page.route('**://data.trezor.io/suite/log/**', route => {
            const url = route.request().url();
            const params = urlSearchParams(url);
            this.requests.push(params);
            route.continue();
        });
    }
}
