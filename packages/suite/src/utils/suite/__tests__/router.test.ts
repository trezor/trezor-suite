import {
    getApp,
    getAppWithParams,
    findRouteByName,
    getRoute,
    getPrefixedURL,
    stripPrefixedPathname,
    isInternalRoute,
    isStatic,
} from '../router';

describe.skip('router', () => {
    beforeEach(() => {
        delete process.env.assetPrefix;
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
            expect(getApp('/next/wallet/account/receive/#/btc/0')).toEqual('wallet');
            expect(getApp('/next/onboarding/')).toEqual('onboarding');
            expect(getApp('/unknown-route/')).toEqual('unknown');
        });
    });

    describe('getPrefixedURL', () => {
        it('should return url not prefixed since assetPrefix is not set', () => {
            expect(getPrefixedURL('/wallet')).toEqual(`/wallet`);
        });
        it('should return url prefixed with assetPrefix env variable', () => {
            const prefix = '/test/asset/prefix';
            process.env.assetPrefix = prefix;
            expect(getPrefixedURL('/wallet')).toEqual(`${prefix}/wallet`);
            expect(getPrefixedURL(`${prefix}/wallet`)).toEqual(`${prefix}/wallet`);
            expect(getPrefixedURL('/suite-web/wallet/account/receive/#/btc/0')).toEqual(
                `${prefix}/suite-web/wallet/account/receive/#/btc/0`,
            );
        });
    });

    describe('getRoute', () => {
        it('should return the route for given name', () => {
            // @ts-ignore: invalid params
            expect(getRoute('unknown-route')).toEqual('/');
            expect(getRoute('wallet-settings')).toEqual('/wallet/settings');
            expect(getRoute('wallet-account-transactions')).toEqual('/wallet/account/transactions');
            // tests below with intentionally mixed # params
            expect(
                getRoute('wallet-account-summary', {
                    symbol: 'btc',
                    accountIndex: 0,
                    accountType: 'legacy',
                }),
            ).toEqual('/wallet/account#/btc/0/legacy');
            expect(
                getRoute('wallet-account-summary', {
                    accountIndex: 0,
                    accountType: 'segwit',
                    symbol: 'btc',
                }),
            ).toEqual('/wallet/account#/btc/0/segwit');
            expect(
                getRoute('wallet-account-summary', {
                    accountType: 'normal',
                    symbol: 'btc',
                    accountIndex: 0,
                }),
            ).toEqual('/wallet/account#/btc/0');
            expect(
                // @ts-ignore: invalid params
                getRoute('wallet-account-summary', {
                    accountIndex: 1,
                    symbol: 'btc',
                }),
            ).toEqual('/wallet/account#/btc/1');
            // route shouldnt have params
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
            expect(stripPrefixedPathname('/wallet/account/#/btc/0')).toEqual('/wallet/account');
            expect(stripPrefixedPathname('/wallet/account/#/42')).toEqual('/wallet/account');
        });
    });

    describe('isInternalRoute', () => {
        it('should return true in case of in app route', () => {
            expect(isInternalRoute('/wallet/account/#/btc/0')).toEqual(true);
            expect(isInternalRoute('/wallet/account/#/42')).toEqual(true);
            expect(isInternalRoute('/wallet/account/receive/#/btc/0')).toEqual(true);
            expect(isInternalRoute('/wallet/')).toEqual(true);
            expect(isInternalRoute('/onboarding/')).toEqual(true);
            expect(isInternalRoute('https://example.com')).toEqual(false);
        });
    });

    describe('isStatic', () => {
        it('should return true if url is a static page', () => {
            expect(isStatic('/onboarding')).toEqual(true);
            expect(isStatic('/bridge')).toEqual(true);
            expect(isStatic('/version')).toEqual(true);
            expect(isStatic('/firmware')).toEqual(true);
            expect(isStatic('/404/page')).toEqual(true);
            expect(isStatic('/wallet/')).toEqual(false);
        });

        it('should return true if url is a static page (with prefix)', () => {
            const prefix = '/test/asset/prefix';
            process.env.assetPrefix = prefix;
            expect(isStatic(`${prefix}/onboarding`)).toEqual(true);
            expect(isStatic(`${prefix}/bridge`)).toEqual(true);
            expect(isStatic(`${prefix}/version`)).toEqual(true);
            expect(isStatic(`${prefix}/firmware`)).toEqual(true);
            expect(isStatic(`${prefix}/404/page`)).toEqual(true);
            expect(isStatic(`${prefix}/wallet`)).toEqual(false);
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
                route: findRouteByName('wallet-account-summary'),
            };
            expect(getAppWithParams('/wallet/account/#/btc/0')).toEqual(resp);
            expect(getAppWithParams('/wallet/account/#/btc/0/normal')).toEqual(resp);
            expect(getAppWithParams('/wallet/account/#/btc/1/segwit')).toEqual({
                ...resp,
                params: {
                    symbol: 'btc',
                    accountIndex: 1,
                    accountType: 'segwit',
                },
            });
            expect(getAppWithParams('/wallet/account/#/btc/1/legacy')).toEqual({
                ...resp,
                params: {
                    symbol: 'btc',
                    accountIndex: 1,
                    accountType: 'legacy',
                },
            });
            expect(getAppWithParams('/wallet/account/#/btc/NaN')).toEqual({
                ...resp,
                params: undefined,
            });
            expect(getAppWithParams('/wallet/account/#/btc-invalid/0')).toEqual({
                ...resp,
                params: undefined,
            });
            expect(getAppWithParams('/wallet/account/#/btc/0/unknown-type')).toEqual({
                ...resp,
                params: undefined,
            });
            expect(getAppWithParams('/wallet/account/#/btc')).toEqual({
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
                app: 'wallet',
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
});
