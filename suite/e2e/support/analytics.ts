import { Page } from '@playwright/test';

import { SuiteDesktopLegacyAnalyticsEvents } from '@suite/analytics';
import { urlSearchParams } from '@trezor/suite/src//utils/suite/metadata';

import { step } from './common';
import { expect } from './testExtends/customMatchers';
import { EventPayload, Requests } from './types';

export class AnalyticsFixture {
    private page: Page;
    private lastRequestCount = 0;
    requests: Requests = [];

    constructor(page: Page) {
        this.page = page;
    }

    findAnalyticsEventByType<T extends SuiteDesktopLegacyAnalyticsEvents>(eventType: T['type']) {
        const event = this.requests.find(req => req.c_type === eventType) as EventPayload<T>;

        if (!event) {
            throw new Error(`Event with type ${eventType} not found.`);
        }

        return event;
    }

    findLatestRequestByType(eventType: SuiteDesktopLegacyAnalyticsEvents['type']) {
        return [...this.requests].reverse().find(req => req.c_type === eventType);
    }

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
            .poll(
                () => this.requests.length,
                `expected ${expectedNewRequests} new analytics requests.
Last request count was ${this.lastRequestCount} so we should have total of ${this.lastRequestCount + expectedNewRequests}.
Currently intercepted: \n${JSON.stringify(this.requests, null, 2)}`,
            )
            .toBeGreaterThanOrEqual(this.lastRequestCount + expectedNewRequests);
        this.lastRequestCount = this.requests.length;
    }
}
