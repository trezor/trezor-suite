import { BigNumber } from '@trezor/utils';

import { DISPLAY_AMOUNT_CACHE_MAX_SIZE, toBaseCurrencyDisplayAmount } from './baseCurrency';

describe(toBaseCurrencyDisplayAmount.name, () => {
    it('rounds a fiat amount to the two rendered fraction digits', () => {
        const amount = toBaseCurrencyDisplayAmount({
            value: new BigNumber('12.528'),
            baseCurrencyCode: 'usd',
        });

        expect(amount.toFixed()).toBe('12.53');
    });

    it('returns the same instance for amounts that render the same', () => {
        const first = toBaseCurrencyDisplayAmount({
            value: new BigNumber('12.523'),
            baseCurrencyCode: 'usd',
        });
        const second = toBaseCurrencyDisplayAmount({
            value: new BigNumber('12.5238'),
            baseCurrencyCode: 'usd',
        });

        expect(second).toBe(first);
        expect(first.toFixed()).toBe('12.52');
    });

    it('returns a different instance when the rendered amount changes', () => {
        const first = toBaseCurrencyDisplayAmount({
            value: new BigNumber('12.523'),
            baseCurrencyCode: 'usd',
        });
        const second = toBaseCurrencyDisplayAmount({
            value: new BigNumber('12.528'),
            baseCurrencyCode: 'usd',
        });

        expect(second).not.toBe(first);
        expect(second.toFixed()).toBe('12.53');
    });

    it('truncates instead of rounding when a rounding mode is given', () => {
        const amount = toBaseCurrencyDisplayAmount({
            value: new BigNumber('12.528'),
            baseCurrencyCode: 'usd',
            roundingMode: BigNumber.ROUND_DOWN,
        });

        expect(amount.toFixed()).toBe('12.52');
        expect(amount).toBe(
            toBaseCurrencyDisplayAmount({
                value: new BigNumber('12.523'),
                baseCurrencyCode: 'usd',
            }),
        );
    });

    it('keeps satoshi precision for the btc base currency', () => {
        const first = toBaseCurrencyDisplayAmount({
            value: new BigNumber('0.123456781'),
            baseCurrencyCode: 'btc',
        });
        const second = toBaseCurrencyDisplayAmount({
            value: new BigNumber('0.123456789'),
            baseCurrencyCode: 'btc',
        });

        expect(first.toFixed()).toBe('0.12345678');
        expect(second.toFixed()).toBe('0.12345679');
        expect(second).not.toBe(first);
    });

    it('does not collide across base currencies with different precision', () => {
        const fiatAmount = toBaseCurrencyDisplayAmount({
            value: new BigNumber('1.5'),
            baseCurrencyCode: 'usd',
        });
        const btcAmount = toBaseCurrencyDisplayAmount({
            value: new BigNumber('1.5'),
            baseCurrencyCode: 'btc',
        });

        expect(fiatAmount.eq(btcAmount)).toBe(true);
        expect(btcAmount).not.toBe(fiatAmount);
    });

    it('evicts cached instances once the cache exceeds its size cap', () => {
        const toDisplayAmount = (cents: number) =>
            toBaseCurrencyDisplayAmount({
                value: new BigNumber(cents).div(100),
                baseCurrencyCode: 'usd',
            });

        const first = toDisplayAmount(1);
        for (let cents = 2; cents <= DISPLAY_AMOUNT_CACHE_MAX_SIZE + 1; cents++) {
            toDisplayAmount(cents);
        }

        expect(toDisplayAmount(1)).not.toBe(first);
    });
});
