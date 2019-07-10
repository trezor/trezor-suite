import {
    getApp,
    getParams,
    getRoute,
    getPrefixedURL,
    toInternalRoute,
    isInternalRoute,
} from '../router';

describe('router', () => {
    describe('getApp', () => {
        it('should return string indicating the current app', () => {
            expect(getApp('/wallet')).toEqual('wallet');
            expect(getApp('/wallet/')).toEqual('wallet');
            expect(getApp('/onboarding')).toEqual('onboarding');
            expect(getApp('/onboarding/')).toEqual('onboarding');
            expect(getApp('/nevim/')).toEqual('unknown');
        });
    });

    describe('getApp with assetPrefix', () => {
        it('should return string indicating the current app', () => {
            process.env = Object.assign(process.env, { assetPrefix: '/next' });
            expect(getApp('/next/wallet/')).toEqual('wallet');
            expect(getApp('/next/wallet/account/receive/#/trop/0')).toEqual('wallet');
            expect(getApp('/next/onboarding/')).toEqual('onboarding');
            expect(getApp('/nevim/')).toEqual('unknown');
        });
    });

    describe('getPrefixedURL', () => {
        it('should return url prefixed with assetPrefix env variable', () => {
            const prefix = '/test/asset/prefix';
            process.env = Object.assign(process.env, { assetPrefix: prefix });
            expect(getPrefixedURL('/wallet')).toEqual(`${prefix}/wallet`);
            expect(getPrefixedURL('/suite-web/wallet/account/receive/#/trop/0')).toEqual(
                `${prefix}/suite-web/wallet/account/receive/#/trop/0`,
            );
        });
    });

    describe('getParams', () => {
        it('should object of params parsed from the url', () => {
            expect(getParams('/suite-web/wallet/account/receive/#/trop/0')).toEqual({
                accountId: '0',
                coin: 'trop',
            });
            expect(getParams('/suite-web/wallet/account/receive/#/eth/1')).toEqual({
                accountId: '1',
                coin: 'eth',
            });
            expect(getParams('/suite-web/wallet/account/receive/#/eth')).toEqual({
                coin: 'eth',
            });
        });
    });

    describe('getRoute', () => {
        it('should return the route for given name', () => {
            expect(getRoute('wallet-settings')).toEqual('/wallet/settings');
            expect(getRoute('wallet-account-transactions')).toEqual('/wallet/account/transactions');
            expect(
                getRoute('wallet-account', {
                    coin: 'eth',
                    accountId: '0',
                }),
            ).toEqual('/wallet/account#/eth/0');
            expect(
                getRoute('wallet-account', {
                    coin: 'eth',
                }),
            ).toEqual('/wallet/account#/eth');
            expect(getRoute('does-not-exist')).toEqual('/');
        });
    });

    describe('toInternalRoute', () => {
        it('should strip params delimited by a hashtag from the URL', () => {
            expect(toInternalRoute('/wallet/account/#/eth/0')).toEqual('/wallet/account');
            expect(toInternalRoute('/wallet/account/#/42')).toEqual('/wallet/account');
        });
    });

    describe('isInternalRoute', () => {
        it('should return true in case of in app route', () => {
            expect(isInternalRoute('/wallet/account/#/eth/0')).toEqual(true);
            expect(isInternalRoute('/wallet/account/#/42')).toEqual(true);
            expect(isInternalRoute('/wallet/account/receive/#/trop/0')).toEqual(true);
            expect(isInternalRoute('/wallet/')).toEqual(true);
            expect(isInternalRoute('/onboarding/')).toEqual(true);
            expect(isInternalRoute('https://example.com')).toEqual(false);
        });
    });
});
