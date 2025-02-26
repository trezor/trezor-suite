import { Page } from '@playwright/test';

import { urlSearchParams } from '@trezor/suite/src/utils/suite/metadata';
import { SuiteAnalyticsEvent } from '@trezor/suite-analytics';

import { step } from './common';
import { EventPayload, Requests } from './types';
import { expect } from '../support/fixtures';

export class AnalyticsFixture {
    private page: Page;
    private lastRequestCount = 0;
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

    findLatestRequestByType(eventType: SuiteAnalyticsEvent['type']) {
        return [...this.requests].reverse().find(req => req.c_type === eventType);
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

    @step()
    async waitForAnalyticsRequests(expectedNewRequests = 1) {
        await expect
            .poll(() => this.requests.length)
            .toBeGreaterThanOrEqual(this.lastRequestCount + expectedNewRequests);
        this.lastRequestCount = this.requests.length;
    }
}
