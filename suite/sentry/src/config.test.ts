import type { Breadcrumb, ErrorEvent } from '@sentry/core';

import { COINJOIN_NETWORK_TAG, COINJOIN_REPORT_TAG } from '@suite-common/sentry';

import { beforeBreadcrumb, redactCoinjoinData, redactUserPath } from './config';

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

    it('keeps other breadcrumbs', () => {
        const breadcrumb: Breadcrumb = {
            category: 'fetch',
            data: { url: 'https://example.com/api' },
        };

        expect(beforeBreadcrumb?.(breadcrumb)).toBe(breadcrumb);
    });
});
