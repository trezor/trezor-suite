import { Page } from '@playwright/test';
import { RequireExactlyOne } from 'type-fest';

import { step } from './common';
import { expect } from './testExtends/customMatchers';
import { EventPayload, SuiteDesktopAnalyticsEventsForE2e } from './types';

type AnalyticsOptions = RequireExactlyOne<
    {
        count?: number;
        timeout?: number;
        filter: (url: URL) => boolean;
        c_types: string[];
    },
    'filter' | 'c_types'
>;

export class AnalyticsHelper {
    private static readonly ANALYTICS_HOST = 'data.trezor.io';

    constructor(private readonly page: Page) {}

    /**
     * Waits for a single analytics event.
     *
     * @param params - Key-value pairs to match against the request URL.
     * @param [timeout] - Optional timeout for the request.
     * @returns A record of all query parameters from the matched analytics request.
     * @example
     * await analyticsHelper.waitForEvent({
     *     c_types: 'staking/navigate', networkSymbol: 'eth'
     * })
     */
    @step()
    async waitForEvent(params: Record<string, string>, timeout?: number) {
        return await this.waitForNetworkRequest(
            url => Object.entries(params).every(([k, v]) => url.searchParams.get(k) === v),
            timeout,
        );
    }

    /**
     * Collects a batch of analytics requests matching specific criteria.
     *
     * @param options - Object.
     * @param [options.count=1] - Number of events to collect.
     * @param [options.timeout] - Optional timeout for a request.
     * @param [options.c_types] - List of event types (`c_type`) to match.
     * @param [options.filter] - Custom predicate: `(url: URL) => boolean`.
     * @returns A list of query parameter objects from matched requests.
     * @example
     * // Example 1:
     * const events = await analyticsHelper.collectEvents({
     *     count: 3,
     *     c_types: [
     *         'wallet-connect/paired',
     *         'wallet-connect/proposal',
     *         'wallet-connect/proposal-approved'
     *     ],
     * })
     * @example
     * // Example 2:
     * const events = await analyticsHelper.collectEvents({
     *     count: 1,
     *     filter: (url: URL) =>
     *         url.searchParams.get('c_type') === 'staking/navigate'
     *         && url.searchParams.get('networkSymbol') === 'eth',
     * })
     */
    @step()
    async collectEvents(options: AnalyticsOptions): Promise<Array<Record<string, string>>> {
        const { count = 1, timeout } = options;
        const results: Array<Record<string, string>> = [];
        let isMatch: (url: URL) => boolean;

        if (options.c_types) {
            isMatch = (url: URL) => this.isTypeMatch(url, options.c_types);
        } else {
            isMatch = options.filter;
        }

        for (let i = 0; i < count; i++) {
            const payload = await this.waitForNetworkRequest(isMatch, timeout);

            results.push(payload);
        }

        return results;
    }

    /**
     * Waits for a network request that matches the provided filter and belongs to the analytics host.
     *
     * @param isMatchingFilter - A predicate function that receives
     * the request URL and returns true if it matches the desired criteria.
     * @param [timeout] - Optional timeout for the request.
     * @returns A parsed object of the request's query parameters.
     * @private
     */
    private async waitForNetworkRequest(isMatchingFilter: (url: URL) => boolean, timeout?: number) {
        const request = await this.page.waitForRequest(
            req => {
                const url = new URL(req.url());

                if (url.hostname !== AnalyticsHelper.ANALYTICS_HOST) return false;

                return isMatchingFilter(url);
            },
            { timeout },
        );

        return Object.fromEntries(new URL(request.url()).searchParams);
    }

    /**
     * Checks if the given URL's 'c_type' parameter exists within the allowed list.
     * @param url - The URL object to inspect.
     * @param cTypes - An array of valid event types.
     * @returns True if the URL contains a matching c_type.
     * @private
     */
    private isTypeMatch(url: URL, cTypes: string[]): boolean {
        return cTypes.includes(url.searchParams.get('c_type') ?? '');
    }
}

export class AnalyticsFixture {
    private page: Page;
    private lastRequestCount = 0;
    requests: Record<string, string>[] = [];

    constructor(page: Page) {
        this.page = page;
    }

    /**
     * Finds analytics event by type. Works for both legacy events and events
     * migrated from older analytics tracking (e.g. DeviceConnect, TransportType when migrated).
     */
    findAnalyticsEventByType<T extends SuiteDesktopAnalyticsEventsForE2e>(eventType: T['type']) {
        const event = this.requests.find(req => req.c_type === eventType) as EventPayload<T>;

        if (!event) {
            throw new Error(`Event with type ${eventType} not found.`);
        }

        return event;
    }

    // @deprecated use findLatestRequestByType for migrated events, or findAnalyticsEventByType where payload is needed
    findLatestRequestByLegacyType(eventType: SuiteDesktopAnalyticsEventsForE2e['type']) {
        return [...this.requests].reverse().find(req => req.c_type === eventType);
    }

    findLatestRequestByType(eventType: string) {
        return [...this.requests].reverse().find(req => req.c_type === eventType);
    }

    @step()
    async interceptAnalytics() {
        await this.page.route('**://data.trezor.io/suite/log/**', route => {
            const url = route.request().url();
            const params = new URLSearchParams(url);
            this.requests.push(Object.fromEntries(params.entries()));
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
