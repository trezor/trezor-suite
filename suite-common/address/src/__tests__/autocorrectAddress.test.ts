import { autocorrectAddress } from '../autocorrectAddress';

describe('autocorrectAddress', () => {
    it('lowercases uppercase bech32 BTC address', () => {
        expect(autocorrectAddress('BC1QAFK4YHQVJ4WEP57M62DGRMUTLDUSQDE8ADH20D', 'btc')).toEqual({
            corrected: 'bc1qafk4yhqvj4wep57m62dgrmutldusqde8adh20d',
            type: 'lowercase',
        });
    });

    it('lowercases uppercase bech32 LTC address', () => {
        expect(autocorrectAddress('LTC1QKZYARPKHDECU5RZEUJ78PWPR5SFM798AFNY4N6', 'ltc')).toEqual({
            corrected: 'ltc1qkzyarpkhdecu5rzeuj78pwpr5sfm798afny4n6',
            type: 'lowercase',
        });
    });

    it('lowercases uppercase BCH CashAddr address', () => {
        expect(
            autocorrectAddress('BITCOINCASH:QZ8GJEXL9X7GAG53XL08MT7QSKVJG8X2WUEEJJMTTC', 'bch'),
        ).toEqual({
            corrected: 'bitcoincash:qz8gjexl9x7gag53xl08mt7qskvjg8x2wueejjmttc',
            type: 'lowercase',
        });
    });

    it('adds bitcoincash: prefix to BCH address without it', () => {
        const result = autocorrectAddress('qz8gjexl9x7gag53xl08mt7qskvjg8x2wueejjmttc', 'bch');
        expect(result).toEqual({
            corrected: 'bitcoincash:qz8gjexl9x7gag53xl08mt7qskvjg8x2wueejjmttc',
            type: 'bchPrefix',
        });
    });

    it('adds bitcoincash: prefix and lowercases uppercase BCH address without prefix', () => {
        const result = autocorrectAddress('QZ8GJEXL9X7GAG53XL08MT7QSKVJG8X2WUEEJJMTTC', 'bch');
        expect(result).toEqual({
            corrected: 'bitcoincash:qz8gjexl9x7gag53xl08mt7qskvjg8x2wueejjmttc',
            type: 'bchPrefix',
        });
    });

    it('returns null for already-correct lowercase bech32 address', () => {
        expect(autocorrectAddress('bc1qafk4yhqvj4wep57m62dgrmutldusqde8adh20d', 'btc')).toBeNull();
    });

    it('returns null for already-correct BCH address with prefix', () => {
        expect(
            autocorrectAddress('bitcoincash:qz8gjexl9x7gag53xl08mt7qskvjg8x2wueejjmttc', 'bch'),
        ).toBeNull();
    });

    it('returns null for ETH address (no autocorrection needed)', () => {
        expect(autocorrectAddress('0xE37c0D48d68da5c5b14E5c1a9f1CFE802776D9FF', 'eth')).toBeNull();
    });

    it('returns null for non-BCH symbol even without prefix', () => {
        expect(autocorrectAddress('qz8gjexl9x7gag53xl08mt7qskvjg8x2wueejjmttc', 'btc')).toBeNull();
    });

    it('does not lowercase bech32-looking address on wrong network', () => {
        expect(autocorrectAddress('BC1SW50QA3JX3S', 'eth')).toBeNull();
    });
});
