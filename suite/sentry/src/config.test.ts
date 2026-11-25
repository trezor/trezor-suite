import type { Breadcrumb, ErrorEvent, SpanJSON } from '@sentry/core';

import { COINJOIN_NETWORK_TAG, COINJOIN_REPORT_TAG } from '@suite-common/sentry';

import {
    SENTRY_BROWSER_CONFIG,
    SENTRY_CONFIG,
    addVersionToSegmentSpan,
    beforeBreadcrumb,
    redactCoinjoinData,
    redactEventUrlParams,
    redactUserPath,
} from './config';

describe('redactUserPath', () => {
    it('returns null for null event', () => {
        expect(redactUserPath(null)).toBeNull();
    });

    it('redacts user path in all places of the event', () => {
        const event: ErrorEvent = {
            type: undefined,
            message: 'Error in /Users/satoshi/file.txt',
            exception: { values: [{ value: 'C:\\Users\\satoshi\\file.txt' }] },
            breadcrumbs: [{ message: '/Users/satoshi/other.txt' }],
            extra: { arguments: ['/Users/satoshi/arg.txt'] },
        };

        expect(redactUserPath(event)).toEqual({
            type: undefined,
            message: 'Error in /Users/[*]/file.txt',
            exception: { values: [{ value: 'C:\\Users\\[*]\\file.txt' }] },
            breadcrumbs: [{ message: '/Users/[*]/other.txt' }],
            extra: { arguments: ['/Users/[*]/arg.txt'] },
        });
    });
});

describe('redactCoinjoinData', () => {
    it('returns null for null event', () => {
        expect(redactCoinjoinData(null)).toBeNull();
    });

    it('strips all but necessary data from coinjoin event', () => {
        const event: ErrorEvent = {
            type: undefined,
            message: 'Coinjoin error',
            release: '1.0.0',
            level: 'error',
            tags: { [COINJOIN_REPORT_TAG]: true, [COINJOIN_NETWORK_TAG]: 'btc' },
            extra: { secret: 'data' },
            breadcrumbs: [{ message: 'breadcrumb' }],
        };

        expect(redactCoinjoinData(event)).toEqual({
            type: undefined,
            message: 'Coinjoin error',
            release: '1.0.0',
            level: 'error',
            tags: { coinjoinReport: true, coinjoinNetworkTag: 'btc' },
        });
    });

    it('returns non-coinjoin event unchanged', () => {
        const event: ErrorEvent = {
            type: undefined,
            message: 'Other error',
            tags: { other: 'tag' },
            extra: { some: 'data' },
        };

        expect(redactCoinjoinData(event)).toBe(event);
    });
});

describe('redactEventUrlParams', () => {
    it('returns null for null event', () => {
        expect(redactEventUrlParams(null)).toBeNull();
    });

    it('replaces the query and hash of URLs in the request, tags and electron context', () => {
        const event: ErrorEvent = {
            type: undefined,
            request: { url: 'https://suite.trezor.io/web/?uri=bitcoin:bc1qaddress?amount=0.5' },
            tags: {
                routerURL: '/coinmarket-redirect#offers/btc/normal/0/qc/CZ/usd/0.5/btc/card',
                version: '26.11.0',
                isTor: false,
            },
            contexts: { electron: { crashed_url: 'app:///index.html#/accounts' } },
        };

        expect(redactEventUrlParams(event)).toEqual({
            type: undefined,
            request: { url: 'https://suite.trezor.io/web/?redacted' },
            tags: {
                routerURL: '/coinmarket-redirect#redacted',
                version: '26.11.0',
                isTor: false,
            },
            contexts: { electron: { crashed_url: 'app:///index.html#redacted' } },
        });
    });

    it('keeps URLs without a query or hash', () => {
        const event: ErrorEvent = {
            type: undefined,
            request: { url: 'https://suite.trezor.io/web/settings' },
            tags: { routerURL: '/settings' },
        };

        expect(redactEventUrlParams(event)).toEqual({
            type: undefined,
            request: { url: 'https://suite.trezor.io/web/settings' },
            tags: { routerURL: '/settings' },
        });
    });
});

describe('beforeBreadcrumb', () => {
    it('filters out analytics requests', () => {
        const breadcrumb: Breadcrumb = {
            category: 'fetch',
            data: { url: 'https://data.trezor.io/suite/log/web/stable.log?c_type=x' },
        };

        expect(beforeBreadcrumb?.(breadcrumb)).toBeNull();
    });

    it('filters out image fetches', () => {
        const breadcrumb: Breadcrumb = {
            category: 'xhr',
            data: { url: 'http://localhost:8000/assets/images/image.png' },
        };

        expect(beforeBreadcrumb?.(breadcrumb)).toBeNull();
    });

    it('filters out console breadcrumbs', () => {
        const breadcrumb: Breadcrumb = { category: 'console', message: 'log message' };

        expect(beforeBreadcrumb?.(breadcrumb)).toBeNull();
    });

    it('replaces the hash of navigation and request URLs', () => {
        const breadcrumb: Breadcrumb = {
            category: 'navigation',
            data: { from: '/accounts#/btc/0/normal', to: '/coinmarket-redirect#offers/btc/0.5' },
        };

        expect(beforeBreadcrumb?.(breadcrumb)).toEqual({
            category: 'navigation',
            data: { from: '/accounts#redacted', to: '/coinmarket-redirect#redacted' },
        });
    });

    it('keeps other breadcrumbs', () => {
        const breadcrumb: Breadcrumb = {
            category: 'fetch',
            data: { url: 'https://example.com/api' },
        };

        expect(beforeBreadcrumb?.(breadcrumb)).toBe(breadcrumb);
    });
});

describe('addVersionToSegmentSpan', () => {
    const getSpan = (overrides: Partial<SpanJSON> = {}): SpanJSON => ({
        data: { release: '26.12.0.web.abc', transaction: '/suite-web/develop/web/earn' },
        op: 'ui.interaction.click',
        span_id: 'b1f9e1a8c0e13e64',
        start_timestamp: 1795614738.9,
        trace_id: 'e4e5b40f3a1545738b50576406c82a14',
        ...overrides,
    });

    it('is the beforeSendSpan hook of the browser config', () => {
        expect(SENTRY_BROWSER_CONFIG.beforeSendSpan).toBe(addVersionToSegmentSpan);
    });

    it('adds the version tag value to a standalone segment span', () => {
        const span = getSpan({ is_segment: true, segment_id: 'b1f9e1a8c0e13e64' });

        expect(addVersionToSegmentSpan(span).data).toEqual({
            release: '26.12.0.web.abc',
            transaction: '/suite-web/develop/web/earn',
            version: SENTRY_CONFIG.initialScope.tags.version,
        });
    });

    it('keeps a version the segment span already has', () => {
        const span = getSpan({ is_segment: true, data: { version: '26.11.2' } });

        expect(addVersionToSegmentSpan(span).data).toEqual({ version: '26.11.2' });
    });

    it('leaves child spans of a transaction unchanged', () => {
        const span = getSpan({ op: 'http.client', parent_span_id: 'a47d91ed2adc4c3b' });

        expect(addVersionToSegmentSpan(span)).toEqual(
            getSpan({ op: 'http.client', parent_span_id: 'a47d91ed2adc4c3b' }),
        );
    });
});
