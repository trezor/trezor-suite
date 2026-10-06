import { asNetworkSymbol } from '@suite-common/wallet-config';

import { getBestPromotedRate, isEarnPromoSymbol } from './promotedRateUtils';

describe('getBestPromotedRate', () => {
    it('promotes the vault rate when there is no staking rate', () => {
        expect(getBestPromotedRate({ vaultApy: 2.48, stakingRate: null })).toEqual({
            apy: 2.48,
            isVaultRate: true,
        });
    });

    it('promotes the staking rate when there is no vault rate', () => {
        expect(getBestPromotedRate({ vaultApy: null, stakingRate: 2.95 })).toEqual({
            apy: 2.95,
            isVaultRate: false,
        });
    });

    it('promotes the staking rate when it beats the vault rate', () => {
        expect(getBestPromotedRate({ vaultApy: 2.48, stakingRate: 2.95 })).toEqual({
            apy: 2.95,
            isVaultRate: false,
        });
    });

    it('promotes the vault rate when it beats the staking rate', () => {
        expect(getBestPromotedRate({ vaultApy: 6.42, stakingRate: 2.95 })).toEqual({
            apy: 6.42,
            isVaultRate: true,
        });
    });

    it('keeps the vault label when both rates are equal', () => {
        expect(getBestPromotedRate({ vaultApy: 2.95, stakingRate: 2.95 })).toEqual({
            apy: 2.95,
            isVaultRate: true,
        });
    });

    it('returns null when neither rate is on offer', () => {
        expect(getBestPromotedRate({ vaultApy: null, stakingRate: null })).toBeNull();
    });

    it.each([
        ['zero', 0],
        ['negative', -1],
        ['not finite', Number.POSITIVE_INFINITY],
    ])('ignores a staking rate that is %s', (_description, stakingRate) => {
        expect(getBestPromotedRate({ vaultApy: 2.48, stakingRate })).toEqual({
            apy: 2.48,
            isVaultRate: true,
        });
    });

    it.each([
        ['zero', 0],
        ['negative', -1],
        ['not finite', Number.POSITIVE_INFINITY],
    ])('ignores a vault rate that is %s', (_description, vaultApy) => {
        expect(getBestPromotedRate({ vaultApy, stakingRate: 2.95 })).toEqual({
            apy: 2.95,
            isVaultRate: false,
        });
    });
});

describe('isEarnPromoSymbol', () => {
    it.each([
        ['eth', true],
        ['sol', true],
        ['ada', false],
        ['trx', false],
        ['btc', false],
    ])('%s is promoted: %s', (symbol, expected) => {
        expect(isEarnPromoSymbol(asNetworkSymbol(symbol))).toBe(expected);
    });

    it.each([
        ['undefined', undefined],
        ['null', null],
    ])('returns false for %s', (_description, symbol) => {
        expect(isEarnPromoSymbol(symbol)).toBe(false);
    });
});
