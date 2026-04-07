import type { ParsedUrlQuery } from 'querystring';

import { formatRequestUrl, parseRequestUrl } from '../parseRequestUrl';

type ParseFixture = {
    description: string;
    input: string;
    expected: {
        protocol: string | null;
        hostname: string | null;
        pathname: string | null;
        query: ParsedUrlQuery;
        search: string | null;
        hash: string | null;
    };
};

const parseFixtures: ParseFixture[] = [
    {
        description: 'simple path',
        input: '/foo',
        expected: {
            protocol: null,
            hostname: null,
            pathname: '/foo',
            query: {},
            search: null,
            hash: null,
        },
    },
    {
        description: 'root path',
        input: '/',
        expected: {
            protocol: null,
            hostname: null,
            pathname: '/',
            query: {},
            search: null,
            hash: null,
        },
    },
    {
        description: 'single query param',
        input: '/foo?a=1',
        expected: {
            protocol: null,
            hostname: null,
            pathname: '/foo',
            query: { a: '1' },
            search: '?a=1',
            hash: null,
        },
    },
    {
        description: 'multiple query params',
        input: '/foo?a=1&b=2',
        expected: {
            protocol: null,
            hostname: null,
            pathname: '/foo',
            query: { a: '1', b: '2' },
            search: '?a=1&b=2',
            hash: null,
        },
    },
    {
        description: 'array query params',
        input: '/foo?a=1&a=2',
        expected: {
            protocol: null,
            hostname: null,
            pathname: '/foo',
            query: { a: ['1', '2'] },
            search: '?a=1&a=2',
            hash: null,
        },
    },
    {
        description: 'encoded query param',
        input: '/foo?c=%2Fredirect%2Fdetail',
        expected: {
            protocol: null,
            hostname: null,
            pathname: '/foo',
            query: { c: '/redirect/detail' },
            search: '?c=%2Fredirect%2Fdetail',
            hash: null,
        },
    },
    {
        description: 'hash fragment',
        input: '/foo#bar',
        expected: {
            protocol: null,
            hostname: null,
            pathname: '/foo',
            query: {},
            search: null,
            hash: '#bar',
        },
    },
    {
        description: 'query and hash',
        input: '/foo?a=1#bar',
        expected: {
            protocol: null,
            hostname: null,
            pathname: '/foo',
            query: { a: '1' },
            search: '?a=1',
            hash: '#bar',
        },
    },
    {
        description: 'oauth-like redirect',
        input: '/oauth?code=abc&state=xyz',
        expected: {
            protocol: null,
            hostname: null,
            pathname: '/oauth',
            query: { code: 'abc', state: 'xyz' },
            search: '?code=abc&state=xyz',
            hash: null,
        },
    },
    {
        description: 'buy-redirect with p param',
        input: '/buy-redirect?p=somevalue',
        expected: {
            protocol: null,
            hostname: null,
            pathname: '/buy-redirect',
            query: { p: 'somevalue' },
            search: '?p=somevalue',
            hash: null,
        },
    },
    {
        description: 'query with javascript: xss attempt',
        input: '/foo?ok=meow&notok=javascript:alert(1)',
        expected: {
            protocol: null,
            hostname: null,
            pathname: '/foo',
            query: { ok: 'meow', notok: 'javascript:alert(1)' },
            search: '?ok=meow&notok=javascript:alert(1)',
            hash: null,
        },
    },
    {
        description: 'plus sign in query value is decoded as space (querystring.parse semantics)',
        input: '/oauth?code=a+b&state=x+y',
        expected: {
            protocol: null,
            hostname: null,
            pathname: '/oauth',
            query: { code: 'a b', state: 'x y' },
            search: '?code=a+b&state=x+y',
            hash: null,
        },
    },
    {
        description: 'space encoded as %20 in query value is decoded',
        input: '/foo?q=hello%20world',
        expected: {
            protocol: null,
            hostname: null,
            pathname: '/foo',
            query: { q: 'hello world' },
            search: '?q=hello%20world',
            hash: null,
        },
    },
];

type FormatFixture = {
    description: string;
    input: {
        protocol: string | null;
        hostname: string | null;
        pathname: string | null;
        query: ParsedUrlQuery;
    };
    expected: string;
};

const formatFixtures: FormatFixture[] = [
    {
        description: 'simple path without query',
        input: { protocol: null, hostname: null, pathname: '/foo', query: {} },
        expected: '/foo',
    },
    {
        description: 'path with single query param',
        input: { protocol: null, hostname: null, pathname: '/foo', query: { a: '1' } },
        expected: '/foo?a=1',
    },
    {
        description: 'path with multiple query params',
        input: { protocol: null, hostname: null, pathname: '/foo', query: { a: '1', b: '2' } },
        expected: '/foo?a=1&b=2',
    },
    {
        description: 'path with array query params',
        input: { protocol: null, hostname: null, pathname: '/foo', query: { a: ['1', '2'] } },
        expected: '/foo?a=1&a=2',
    },
    {
        description: 'path with encoded characters',
        input: {
            protocol: null,
            hostname: null,
            pathname: '/foo',
            query: { c: '/redirect/detail' },
        },
        expected: '/foo?c=%2Fredirect%2Fdetail',
    },
    {
        description: 'root path',
        input: { protocol: null, hostname: null, pathname: '/', query: {} },
        expected: '/',
    },
    {
        description: 'space in query value is encoded as %20 (not +)',
        input: { protocol: null, hostname: null, pathname: '/foo', query: { q: 'hello world' } },
        expected: '/foo?q=hello%20world',
    },
    {
        description: 'literal plus sign in query value is percent-encoded',
        input: { protocol: null, hostname: null, pathname: '/oauth', query: { code: 'a+b' } },
        expected: '/oauth?code=a%2Bb',
    },
];

describe('parseRequestUrl', () => {
    it.each(parseFixtures)('$description: $input', ({ input, expected }) => {
        expect(parseRequestUrl(input)).toEqual(expected);
    });
});

describe('formatRequestUrl', () => {
    it.each(formatFixtures)('$description', ({ input, expected }) => {
        expect(formatRequestUrl(input)).toEqual(expected);
    });

    it('round-trips: formatRequestUrl(parseRequestUrl(url)) preserves the url', () => {
        const urls = ['/foo?a=1', '/foo?a=1&b=2', '/foo?a=1&a=2', '/'];
        for (const u of urls) {
            expect(formatRequestUrl(parseRequestUrl(u))).toEqual(u);
        }
    });
});
