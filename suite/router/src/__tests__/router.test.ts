import { type Route } from '../route';
import {
    getAppWithParams,
    getPrefixedURL,
    getRoute,
    getRouteHash,
    stripPrefixedURL,
} from '../router';
import type { RouteParams } from '../routes';

const OLD_ENV = { ...process.env };

describe('router', () => {
    afterEach(() => {
        process.env = OLD_ENV;
    });

    describe('getPrefixedURL', () => {
        it('should return url not prefixed since ASSET_PREFIX is not set', () => {
            process.env.ASSET_PREFIX = '';
            expect(getPrefixedURL('/accounts')).toEqual(`/accounts`);
        });
        it('should return url prefixed with ASSET_PREFIX env variable', () => {
            const prefix = '/test/asset/prefix';
            process.env.ASSET_PREFIX = prefix;
            expect(getPrefixedURL('/accounts')).toEqual(`${prefix}/accounts`);
            expect(getPrefixedURL(`${prefix}/accounts`)).toEqual(`${prefix}/accounts`);
            expect(getPrefixedURL('/suite-web/accounts/receive/#/btc/0')).toEqual(
                `${prefix}/suite-web/accounts/receive/#/btc/0`,
            );
        });
    });

    describe('getRoute', () => {
        it('should return the route for given name', () => {
            const test = (name: Route['name'], params?: RouteParams) => {
                const route = getRoute(name);
                const hash = getRouteHash(route, params);

                return `${route?.pattern ?? '/'}${hash}`;
            };

            // @ts-expect-error: invalid params
            expect(test('unknown-route')).toEqual('/');
            expect(test('wallet-index')).toEqual('/accounts');
            expect(
                test('earn-deposit', {
                    symbol: 'eth',
                    accountIndex: 0,
                    accountType: 'normal',
                    yieldId: 'vault-1',
                    contractAddress: '0xabc',
                }),
            ).toEqual('/earn/deposit#/eth/0/normal/vault-1/0xabc');
            expect(
                test('earn-withdraw', {
                    symbol: 'eth',
                    accountIndex: 0,
                    accountType: 'normal',
                    yieldId: 'vault-1',
                }),
            ).toEqual('/earn/withdraw#/eth/0/normal/vault-1');
            expect(
                test('earn-claim', {
                    symbol: 'eth',
                    accountIndex: 0,
                    accountType: 'normal',
                }),
            ).toEqual('/earn/claim#/eth/0/normal');
            // tests below with intentionally mixed # params
            expect(
                test('wallet-index', {
                    symbol: 'btc',
                    accountIndex: 0,
                    accountType: 'legacy',
                }),
            ).toEqual('/accounts#/btc/0/legacy');
            expect(
                test('wallet-index', {
                    accountIndex: 0,
                    accountType: 'segwit',
                    symbol: 'btc',
                }),
            ).toEqual('/accounts#/btc/0/segwit');
            expect(
                test('wallet-index', {
                    accountType: 'normal',
                    symbol: 'btc',
                    accountIndex: 0,
                }),
            ).toEqual('/accounts#/btc/0/normal');
            expect(
                test('wallet-index', {
                    accountIndex: 1,
                    symbol: 'btc',
                }),
            ).toEqual('/accounts#/btc/1');
            // route shouldn't have params
            expect(
                test('onboarding-index', {
                    symbol: 'btc',
                }),
            ).toEqual('/onboarding');
        });
    });

    describe('stripPrefixedUrl', () => {
        it('should strip prefix from the URL', () => {
            const prefix = '/test/asset/prefix';
            process.env.ASSET_PREFIX = prefix;
            expect(stripPrefixedURL(`${prefix}/accounts/send/#/btc/0`)).toEqual(
                `/accounts/send/#/btc/0`,
            );
            process.env.ASSET_PREFIX = '';
            expect(stripPrefixedURL(`${prefix}/accounts/send/#/btc/0`)).toEqual(
                `${prefix}/accounts/send/#/btc/0`,
            );
        });
    });

    describe('getAppWithParams', () => {
        it('wallet params validation', () => {
            const resp = {
                app: 'wallet',
                params: {
                    symbol: 'btc',
                    accountIndex: 0,
                    accountType: 'normal',
                },
                route: getRoute('wallet-index'),
            };
            expect(getAppWithParams({ pathname: '/accounts', hash: '#/btc/0/normal' })).toEqual(
                resp,
            );
            expect(getAppWithParams({ pathname: '/accounts', hash: '#/btc/1/segwit' })).toEqual({
                ...resp,
                params: {
                    symbol: 'btc',
                    accountIndex: 1,
                    accountType: 'segwit',
                },
            });
            expect(getAppWithParams({ pathname: '/accounts', hash: '#/btc/1/legacy' })).toEqual({
                ...resp,
                params: {
                    symbol: 'btc',
                    accountIndex: 1,
                    accountType: 'legacy',
                },
            });
            expect(getAppWithParams({ pathname: '/accounts', hash: '#/btc/NaN' })).toEqual({
                ...resp,
                params: undefined,
            });
            expect(getAppWithParams({ pathname: '/accounts', hash: '#/btc-invalid/0' })).toEqual({
                ...resp,
                params: undefined,
            });
            expect(
                getAppWithParams({ pathname: '/accounts', hash: '#/btc/0/unknown-type' }),
            ).toEqual({
                ...resp,
                params: undefined,
            });
            expect(getAppWithParams({ pathname: '/accounts', hash: '#/btc' })).toEqual({
                ...resp,
                params: undefined,
            });
            expect(getAppWithParams({ pathname: '/accounts', hash: '' })).toEqual({
                ...resp,
                params: undefined,
                route: getRoute('wallet-index'),
            });
        });

        it('other params validation', () => {
            expect(getAppWithParams({ pathname: '/' })).toEqual({
                app: 'dashboard',
                params: undefined,
                route: getRoute('suite-index'),
            });

            expect(getAppWithParams({ pathname: '/onboarding/' })).toEqual({
                app: 'onboarding',
                params: undefined,
                route: getRoute('onboarding-index'),
            });

            expect(getAppWithParams({ pathname: '/unknown-route/' })).toEqual({
                app: 'unknown',
                params: undefined,
                route: undefined,
            });

            expect(
                getAppWithParams({
                    pathname: '/earn/deposit',
                    hash: '#/eth/0/normal/vault-1/0xabc',
                }),
            ).toEqual({
                app: 'earn',
                params: {
                    symbol: 'eth',
                    accountIndex: 0,
                    accountType: 'normal',
                    yieldId: 'vault-1',
                    contractAddress: '0xabc',
                },
                route: getRoute('earn-deposit'),
            });

            expect(
                getAppWithParams({
                    pathname: '/earn/withdraw',
                    hash: '#/eth/0/normal/vault-1',
                }),
            ).toEqual({
                app: 'earn',
                params: {
                    symbol: 'eth',
                    accountIndex: 0,
                    accountType: 'normal',
                    yieldId: 'vault-1',
                    contractAddress: undefined,
                },
                route: getRoute('earn-withdraw'),
            });

            expect(
                getAppWithParams({
                    pathname: '/earn/deposit',
                    hash: '#/eth/0/normal',
                }),
            ).toEqual({
                app: 'earn',
                params: undefined,
                route: getRoute('earn-deposit'),
            });

            expect(
                getAppWithParams({
                    pathname: '/earn/claim',
                    hash: '#/eth/0/normal',
                }),
            ).toEqual({
                app: 'earn',
                params: {
                    symbol: 'eth',
                    accountIndex: 0,
                    accountType: 'normal',
                },
                route: getRoute('earn-claim'),
            });
        });
    });
});
