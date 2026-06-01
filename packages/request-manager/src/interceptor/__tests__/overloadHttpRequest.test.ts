import type http from 'http';

import type { InterceptorContext } from '../interceptorTypes';
import { overloadHttpRequest } from '../overloadHttpRequest';

const createContext = (overrides: Partial<InterceptorContext> = {}): InterceptorContext => {
    const torIdentitiesStub = {
        getIdentity: jest.fn(() => ({ __mockAgent: true })),
        removeIdentity: jest.fn(),
    };

    return {
        handler: jest.fn(),
        getTorSettings: jest.fn(() => ({ running: true, host: '127.0.0.1', port: 9050 })),
        getWhitelistedDomains: jest.fn(() => []),
        notRequiredTorDomainsList: [],
        allowTorBypass: false,
        requestPool: jest.fn() as unknown as InterceptorContext['requestPool'],
        torIdentities: torIdentitiesStub as unknown as InterceptorContext['torIdentities'],
        ...overrides,
    };
};

describe(overloadHttpRequest.name, () => {
    const validateRequest = jest.fn();

    afterEach(() => {
        jest.clearAllMocks();
    });

    it('attaches Tor agent for signature: request(options)', () => {
        const context = createContext();
        const options: http.RequestOptions = {
            hostname: 'data.trezor.io',
            path: '/firmware/test.dat',
            method: 'GET',
            headers: { Accept: '*/*' },
        };

        const result = overloadHttpRequest({
            context,
            protocol: 'https',
            url: options,
            options: undefined,
            callback: undefined,
            validateRequest,
        });

        expect(result).toBeDefined();
        expect(options.agent).toEqual({ __mockAgent: true });
        expect(context.torIdentities.getIdentity).toHaveBeenCalledWith(
            'default',
            undefined,
            'https',
        );

        // returned tuple matches signature 1: [identity, options, callback]
        const [, ...args] = result!;
        expect(args).toEqual([options, undefined]);
    });

    it('attaches Tor agent for signature: request(urlString, options) — node-fetch v3 case', () => {
        const context = createContext();
        const url = 'https://data.trezor.io/firmware/test.dat';
        const options: http.RequestOptions = {
            path: '/firmware/test.dat',
            method: 'GET',
            headers: { Accept: '*/*' },
        };

        const result = overloadHttpRequest({
            context,
            protocol: 'https',
            url,
            options,
            callback: undefined,
            validateRequest,
        });

        expect(result).toBeDefined();
        expect(options.agent).toEqual({ __mockAgent: true });
        expect(context.torIdentities.getIdentity).toHaveBeenCalledWith(
            'default',
            undefined,
            'https',
        );

        // returned tuple preserves signature 3: [identity, url, options, callback]
        const [, ...args] = result!;
        expect(args).toEqual([url, options, undefined]);
    });

    it('attaches Tor agent for signature: request(URL, options)', () => {
        const context = createContext();
        const url = new URL('https://sol.trezor.io/');
        const options: http.RequestOptions = {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
        };

        const result = overloadHttpRequest({
            context,
            protocol: 'https',
            url,
            options,
            callback: undefined,
            validateRequest,
        });

        expect(result).toBeDefined();
        expect(options.agent).toEqual({ __mockAgent: true });
        const [, ...args] = result!;
        expect(args).toEqual([url, options, undefined]);
    });

    it('skips Tor agent when host is in notRequiredTorDomainsList', () => {
        const context = createContext({
            notRequiredTorDomainsList: ['data.trezor.io'],
        });
        const url = 'https://data.trezor.io/firmware/test.dat';
        const options: http.RequestOptions = {
            method: 'GET',
            headers: { Accept: '*/*' },
        };

        const result = overloadHttpRequest({
            context,
            protocol: 'https',
            url,
            options,
            callback: undefined,
            validateRequest,
        });

        expect(result).toBeUndefined();
        expect(options.agent).toBeUndefined();
        expect(context.torIdentities.getIdentity).not.toHaveBeenCalled();
    });

    it('attaches Tor agent for signature: request(urlString)', () => {
        const context = createContext();
        const url = 'https://data.trezor.io/firmware/test.dat';

        const result = overloadHttpRequest({
            context,
            protocol: 'https',
            url,
            options: undefined,
            callback: undefined,
            validateRequest,
        });

        expect(result).toBeDefined();
        expect(context.torIdentities.getIdentity).toHaveBeenCalledWith(
            'default',
            undefined,
            'https',
        );

        // returned tuple uses URL + synthesized options: [identity, url, options, callback]
        const [, ...args] = result!;
        expect(args).toHaveLength(3);
        expect(args[0]).toBe(url);
        expect(args[1]).toMatchObject({ agent: { __mockAgent: true } });
        expect(args[2]).toBeUndefined();
    });

    it('attaches Tor agent for signature: request(urlString, callback)', () => {
        const context = createContext();
        const url = 'https://data.trezor.io/firmware/test.dat';
        const callback = jest.fn();

        const result = overloadHttpRequest({
            context,
            protocol: 'https',
            url,
            options: callback,
            callback: undefined,
            validateRequest,
        });

        expect(result).toBeDefined();
        expect(context.torIdentities.getIdentity).toHaveBeenCalledWith(
            'default',
            undefined,
            'https',
        );

        const [, ...args] = result!;
        expect(args).toHaveLength(3);
        expect(args[0]).toBe(url);
        expect(args[1]).toMatchObject({ agent: { __mockAgent: true } });
        expect(args[2]).toBe(callback);
    });

    it('always validates the hostname (whitelist check)', () => {
        const context = createContext();

        overloadHttpRequest({
            context,
            protocol: 'https',
            url: 'https://data.trezor.io/firmware/test.dat',
            options: { headers: {} },
            callback: undefined,
            validateRequest,
        });

        expect(validateRequest).toHaveBeenCalledWith({ hostname: 'data.trezor.io' });
    });

    it('blocks requests with Proxy-Authorization header when Tor is disabled and bypass is not allowed', () => {
        const context = createContext({
            getTorSettings: jest.fn(() => ({ running: false, host: '127.0.0.1', port: 9050 })),
            allowTorBypass: false,
        });
        const url = 'https://data.trezor.io/';
        const options: http.RequestOptions = {
            method: 'GET',
            headers: { 'Proxy-Authorization': 'Basic identity-name' },
        };

        expect(() =>
            overloadHttpRequest({
                context,
                protocol: 'https',
                url,
                options,
                callback: undefined,
                validateRequest,
            }),
        ).toThrow('Blocked request with Proxy-Authorization. TOR not enabled.');
    });
});
