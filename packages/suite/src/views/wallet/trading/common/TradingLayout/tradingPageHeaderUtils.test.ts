import {
    getBackRoute,
    getTradingHeaderTitle,
    isTradingTopLevelRoute,
} from './tradingPageHeaderUtils';

describe('tradingPageHeaderUtils', () => {
    describe('isTradingTopLevelRoute', () => {
        it.each([
            'wallet-trading-buy',
            'wallet-trading-sell',
            'wallet-trading-exchange',
            'wallet-trading-concierge',
        ] as const)('returns true for %s', route => {
            expect(isTradingTopLevelRoute(route)).toBe(true);
        });

        it.each([
            'wallet-trading-buy-detail',
            'wallet-trading-buy-confirm',
            'wallet-trading-transactions',
            'suite-index',
            undefined,
        ] as const)('returns false for %s', route => {
            expect(isTradingTopLevelRoute(route)).toBe(false);
        });
    });

    describe('getBackRoute — trade history (transactions)', () => {
        it.each([
            'wallet-trading-buy',
            'wallet-trading-sell',
            'wallet-trading-exchange',
            'wallet-trading-concierge',
        ] as const)('returns the top-level tab %s the user opened it from', prevRoute => {
            expect(getBackRoute('wallet-trading-transactions', prevRoute)).toBe(prevRoute);
        });

        it.each([
            ['buy', 'wallet-trading-buy'],
            ['exchange', 'wallet-trading-exchange'],
        ] as const)(
            'falls back to the %s section form when the previous route is not a top-level tab',
            (activeSection, expected) => {
                expect(
                    getBackRoute(
                        'wallet-trading-transactions',
                        'wallet-trading-buy-detail',
                        activeSection,
                    ),
                ).toBe(expected);
            },
        );

        it.each([
            ['buy', 'wallet-trading-buy'],
            ['sell', 'wallet-trading-sell'],
            ['exchange', 'wallet-trading-exchange'],
        ] as const)(
            'falls back to the %s section form when there is no previous route',
            (activeSection, expected) => {
                expect(getBackRoute('wallet-trading-transactions', undefined, activeSection)).toBe(
                    expected,
                );
            },
        );

        it('defaults to the buy form when no active section is provided', () => {
            expect(getBackRoute('wallet-trading-transactions')).toBe('wallet-trading-buy');
        });
    });

    describe('getBackRoute — trade detail', () => {
        it.each([
            'wallet-trading-buy-detail',
            'wallet-trading-sell-detail',
            'wallet-trading-exchange-detail',
        ] as const)('returns trade history when %s was opened from trade history', route => {
            expect(getBackRoute(route, 'wallet-trading-transactions')).toBe(
                'wallet-trading-transactions',
            );
        });

        it.each([
            ['wallet-trading-buy-detail', 'wallet-trading-buy-confirm', 'wallet-trading-buy'],
            ['wallet-trading-sell-detail', 'wallet-trading-sell', 'wallet-trading-sell'],
            [
                'wallet-trading-exchange-detail',
                'wallet-trading-exchange',
                'wallet-trading-exchange',
            ],
        ] as const)(
            'returns the section form when %s was reached from an active flow via %s',
            (route, prevRoute, expected) => {
                expect(getBackRoute(route, prevRoute)).toBe(expected);
            },
        );
    });

    describe('getBackRoute — confirm', () => {
        it.each([
            ['wallet-trading-buy-confirm', 'wallet-trading-transactions', 'wallet-trading-buy'],
            ['wallet-trading-sell-confirm', undefined, 'wallet-trading-sell'],
            ['wallet-trading-exchange-confirm', undefined, 'wallet-trading-exchange'],
        ] as const)(
            'returns the section form for %s regardless of the previous route',
            (route, prevRoute, expected) => {
                expect(getBackRoute(route, prevRoute)).toBe(expected);
            },
        );
    });

    describe('getBackRoute — fallback', () => {
        it.each(['wallet-trading-redirect', undefined] as const)(
            'returns suite-index for %s',
            route => {
                expect(getBackRoute(route)).toBe('suite-index');
            },
        );
    });

    describe('getTradingHeaderTitle', () => {
        it.each([
            'wallet-trading-buy-detail',
            'wallet-trading-sell-detail',
            'wallet-trading-exchange-detail',
        ] as const)('returns TR_TRADING_TRADE_DETAIL for %s', route => {
            expect(getTradingHeaderTitle(route)).toBe('TR_TRADING_TRADE_DETAIL');
        });

        it('returns the trade history title for the transactions route', () => {
            expect(getTradingHeaderTitle('wallet-trading-transactions')).toBe(
                'TR_TRADING_LAST_TRANSACTIONS',
            );
        });

        it.each([
            'wallet-trading-buy',
            'wallet-trading-concierge',
            'wallet-trading-buy-confirm',
        ] as const)('returns TR_NAV_TRADE for %s', route => {
            expect(getTradingHeaderTitle(route)).toBe('TR_NAV_TRADE');
        });
    });
});
