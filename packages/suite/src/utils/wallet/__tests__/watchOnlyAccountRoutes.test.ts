import { isWatchOnlyAccountRouteRestricted } from '../watchOnlyAccountRoutes';

describe(isWatchOnlyAccountRouteRestricted.name, () => {
    it.each([
        ['wallet-send', true],
        ['wallet-receive', true],
        ['wallet-sign-verify', true],
        ['wallet-staking', true],
        ['wallet-trading-buy', true],
        ['wallet-anonymize', true],
        ['wallet-index', false],
        ['wallet-nfts', false],
        ['wallet-trading-transactions', false],
    ] as const)('checks whether %s is restricted', (routeName, expected) => {
        expect(isWatchOnlyAccountRouteRestricted(routeName)).toBe(expected);
    });
});
