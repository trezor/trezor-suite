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
            expect(getApp('/wallet')).toEqual('wallet');
            expect(getApp('/wallet/')).toEqual('wallet');
            expect(getApp('/onboarding')).toEqual('onboarding');
            expect(getApp('/onboarding/')).toEqual('onboarding');
            expect(getApp('/unknown-route/')).toEqual('unknown');
        });
    });

    describe('getApp with assetPrefix', () => {
        it('should return string indicating the current app', () => {
            process.env.assetPrefix = '/next';
            expect(getApp('/next/wallet/')).toEqual('wallet');
            expect(getApp('/next/wallet/receive/#/btc/0')).toEqual('wallet');
            expect(getApp('/next/onboarding/')).toEqual('onboarding');
            expect(getApp('/unknown-route/')).toEqual('unknown');
        });
    });

    describe('getPrefixedURL', () => {
        it('should return url not prefixed since assetPrefix is not set', () => {
            process.env.assetPrefix = '';
            expect(getPrefixedURL('/wallet')).toEqual(`/wallet`);
        });
        it('should return url prefixed with assetPrefix env variable', () => {
            const prefix = '/test/asset/prefix';
            process.env.assetPrefix = prefix;
            expect(getPrefixedURL('/wallet')).toEqual(`${prefix}/wallet`);
            expect(getPrefixedURL(`${prefix}/wallet`)).toEqual(`${prefix}/wallet`);
            expect(getPrefixedURL('/suite-web/wallet/receive/#/btc/0')).toEqual(
                `${prefix}/suite-web/wallet/receive/#/btc/0`,
            );
        });
    });

    describe('getRoute', () => {
        it('should return the route for given name', () => {
            // @ts-ignore: invalid params
            expect(getRoute('unknown-route')).toEqual('/');
            expect(getRoute('wallet-index')).toEqual('/wallet');
            // tests below with intentionally mixed # params
            expect(
                getRoute('wallet-index', {
                    symbol: 'btc',
                    accountIndex: 0,
                    accountType: 'legacy',
                }),
            ).toEqual('/wallet#/btc/0/legacy');
            expect(
                getRoute('wallet-index', {
                    accountIndex: 0,
                    accountType: 'segwit',
                    symbol: 'btc',
                }),
            ).toEqual('/wallet#/btc/0/segwit');
            expect(
                getRoute('wallet-index', {
                    accountType: 'normal',
                    symbol: 'btc',
                    accountIndex: 0,
                }),
            ).toEqual('/wallet#/btc/0');
            expect(
                // @ts-ignore: invalid params
                getRoute('wallet-index', {
                    accountIndex: 1,
                    symbol: 'btc',
                }),
            ).toEqual('/wallet#/btc/1');
            expect(
                getRoute('onboarding-index', {
                    cancelable: true,
                }),
            ).toEqual('/onboarding#/true');
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
            expect(stripPrefixedPathname('/wallet/send/#/btc/0')).toEqual('/wallet/send');
            expect(stripPrefixedPathname('/wallet/send/#/42')).toEqual('/wallet/send');
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
            expect(getAppWithParams('/wallet/#/btc/0')).toEqual(resp);
            expect(getAppWithParams('/wallet/#/btc/0/normal')).toEqual(resp);
            expect(getAppWithParams('/wallet/#/btc/1/segwit')).toEqual({
                ...resp,
                params: {
                    symbol: 'btc',
                    accountIndex: 1,
                    accountType: 'segwit',
                },
            });
            expect(getAppWithParams('/wallet/#/btc/1/legacy')).toEqual({
                ...resp,
                params: {
                    symbol: 'btc',
                    accountIndex: 1,
                    accountType: 'legacy',
                },
            });
            expect(getAppWithParams('/wallet/#/btc/NaN')).toEqual({
                ...resp,
                params: undefined,
            });
            expect(getAppWithParams('/wallet/#/btc-invalid/0')).toEqual({
                ...resp,
                params: undefined,
            });
            expect(getAppWithParams('/wallet/#/btc/0/unknown-type')).toEqual({
                ...resp,
                params: undefined,
            });
            expect(getAppWithParams('/wallet/#/btc')).toEqual({
                ...resp,
                params: undefined,
            });
            expect(getAppWithParams('/wallet')).toEqual({
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

            expect(getAppWithParams('/onboarding#/true')).toEqual({
                app: 'onboarding',
                params: { cancelable: true },
                route: findRouteByName('onboarding-index'),
            });

            expect(getAppWithParams('/onboarding#/false')).toEqual({
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
            process.env.assetPrefix = undefined;
            expect(getTopLevelRoute('/')).toEqual(undefined);
            expect(getTopLevelRoute('/wallet')).toEqual(undefined);
            expect(getTopLevelRoute('/wallet/receive')).toEqual('/wallet');
            expect(getTopLevelRoute('dummy-data-without-slash')).toEqual(undefined);
            // @ts-ignore: intentional invalid param type
            expect(getTopLevelRoute(1)).toEqual(undefined);
        });

        it('should return value if url is a nested page (with prefix)', () => {
            const prefix = '/test/asset/prefix';
            process.env.assetPrefix = prefix;
            expect(getTopLevelRoute(`${prefix}/`)).toEqual(undefined);
            expect(getTopLevelRoute(`${prefix}/wallet`)).toEqual(undefined);
            expect(getTopLevelRoute(`${prefix}/wallet/receive`)).toEqual(`${prefix}/wallet`);
        });
    });
});
