import { isWatchOnlyAccountRouteRestricted } from '../watchOnlyAccountRoutes';

describe(isWatchOnlyAccountRouteRestricted.name, () => {
    it.each([
        'wallet-send',
        'wallet-receive',
        'wallet-sign-verify',
        'wallet-staking',
        'wallet-trading-buy',
        'wallet-anonymize',
    ] as const)('restricts %s', routeName => {
        expect(isWatchOnlyAccountRouteRestricted(routeName)).toBe(true);
    });

    it.each(['wallet-index', 'wallet-nfts', 'wallet-trading-transactions'] as const)(
        'allows %s',
        routeName => {
            expect(isWatchOnlyAccountRouteRestricted(routeName)).toBe(false);
        },
    );
});
