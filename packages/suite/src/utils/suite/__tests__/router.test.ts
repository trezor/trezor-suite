import {
    getApp,
    getAppWithParams,
    findRouteByName,
    getRoute,
    getPrefixedURL,
    stripPrefixedPathname,
    getTopLevelRoute,
} from '../router';

const OLD_ENV = { ...process.env };

describe('router', () => {
    afterEach(() => {
        process.env = OLD_ENV;
    });

    describe('getApp', () => {
        it('should return string indicating the current app', () => {
            expect(getApp('/accounts')).toEqual('wallet');
            expect(getApp('/accounts/')).toEqual('wallet');
            expect(getApp('/onboarding')).toEqual('onboarding');
            expect(getApp('/onboarding/')).toEqual('onboarding');
            expect(getApp('/unknown-route/')).toEqual('unknown');
        });
    });

    describe('getApp with ASSET_PREFIX', () => {
        it('should return string indicating the current app', () => {
            process.env.ASSET_PREFIX = '/next';
            expect(getApp('/next/accounts/')).toEqual('wallet');
            expect(getApp('/next/accounts/receive/#/btc/0')).toEqual('wallet');
            expect(getApp('/next/onboarding/')).toEqual('onboarding');
            expect(getApp('/unknown-route/')).toEqual('unknown');
        });
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
            // @ts-ignore: invalid params
            expect(getRoute('unknown-route')).toEqual('/');
            expect(getRoute('wallet-index')).toEqual('/accounts');
            // tests below with intentionally mixed # params
            expect(
                getRoute('wallet-index', {
                    symbol: 'btc',
                    accountIndex: 0,
                    accountType: 'legacy',
                }),
            ).toEqual('/accounts#/btc/0/legacy');
            expect(
                getRoute('wallet-index', {
                    accountIndex: 0,
                    accountType: 'segwit',
                    symbol: 'btc',
                }),
            ).toEqual('/accounts#/btc/0/segwit');
            expect(
                getRoute('wallet-index', {
                    accountType: 'normal',
                    symbol: 'btc',
                    accountIndex: 0,
                }),
            ).toEqual('/accounts#/btc/0');
            expect(
                // @ts-ignore: invalid params
                getRoute('wallet-index', {
                    accountIndex: 1,
                    symbol: 'btc',
                }),
            ).toEqual('/accounts#/btc/1');
            // route shouldn't have params
            expect(
                // @ts-ignore: invalid params
                getRoute('onboarding-index', {
                    symbol: 'btc',
                }),
            ).toEqual('/onboarding');
        });
    });

    describe('stripPrefixedPathname', () => {
        it('should strip params delimited by a hashtag from the URL', () => {
            expect(stripPrefixedPathname('/accounts/send/#/btc/0')).toEqual('/accounts/send');
            expect(stripPrefixedPathname('/accounts/send/#/42')).toEqual('/accounts/send');
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
                route: findRouteByName('wallet-index'),
            };
            expect(getAppWithParams('/accounts/#/btc/0')).toEqual(resp);
            expect(getAppWithParams('/accounts/#/btc/0/normal')).toEqual(resp);
            expect(getAppWithParams('/accounts/#/btc/1/segwit')).toEqual({
                ...resp,
                params: {
                    symbol: 'btc',
                    accountIndex: 1,
                    accountType: 'segwit',
                },
            });
            expect(getAppWithParams('/accounts/#/btc/1/legacy')).toEqual({
                ...resp,
                params: {
                    symbol: 'btc',
                    accountIndex: 1,
                    accountType: 'legacy',
                },
            });
            expect(getAppWithParams('/accounts/#/btc/NaN')).toEqual({
                ...resp,
                params: undefined,
            });
            expect(getAppWithParams('/accounts/#/btc-invalid/0')).toEqual({
                ...resp,
                params: undefined,
            });
            expect(getAppWithParams('/accounts/#/btc/0/unknown-type')).toEqual({
                ...resp,
                params: undefined,
            });
            expect(getAppWithParams('/accounts/#/btc')).toEqual({
                ...resp,
                params: undefined,
            });
            expect(getAppWithParams('/accounts')).toEqual({
                ...resp,
                params: undefined,
                route: findRouteByName('wallet-index'),
            });
        });

        it('other params validation', () => {
            expect(getAppWithParams('/')).toEqual({
                app: 'dashboard',
                params: undefined,
                route: findRouteByName('suite-index'),
            });

            expect(getAppWithParams('/onboarding/')).toEqual({
                app: 'onboarding',
                params: undefined,
                route: findRouteByName('onboarding-index'),
            });

            expect(getAppWithParams('/unknown-route/')).toEqual({
                app: 'unknown',
                params: undefined,
                route: undefined,
            });
        });
    });

    describe('getTopLevelRoute', () => {
        it('should return value if url is a nested page', () => {
            process.env.ASSET_PREFIX = undefined;
            expect(getTopLevelRoute('/')).toEqual(undefined);
            expect(getTopLevelRoute('/accounts')).toEqual(undefined);
            expect(getTopLevelRoute('/accounts/receive')).toEqual('/accounts');
            expect(getTopLevelRoute('dummy-data-without-slash')).toEqual(undefined);
            // @ts-ignore: intentional invalid param type
            expect(getTopLevelRoute(1)).toEqual(undefined);
        });

        it('should return value if url is a nested page (with prefix)', () => {
            const prefix = '/test/asset/prefix';
            process.env.ASSET_PREFIX = prefix;
            expect(getTopLevelRoute(`${prefix}/`)).toEqual(undefined);
            expect(getTopLevelRoute(`${prefix}/accounts`)).toEqual(undefined);
            expect(getTopLevelRoute(`${prefix}/accounts/receive`)).toEqual(`${prefix}/accounts`);
        });
    });
});
