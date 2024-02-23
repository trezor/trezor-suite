import { isValidXpub } from '../validationUtils';

describe('is BTC xpub prefix valid', () => {
    it('should return true for valid BTC xpub prefixes', () => {
        expect(isValidXpub('xpub1234567890', 'btc')).toBe(true);
        expect(isValidXpub('ypub1234567890', 'btc')).toBe(true);
        expect(isValidXpub('zpub1234567890', 'btc')).toBe(true);
        expect(isValidXpub('Ypub1234567890', 'btc')).toBe(true);
        expect(isValidXpub('Zpub1234567890', 'btc')).toBe(true);
    });

    it('should return false for invalid BTC xpub prefix', () => {
        expect(isValidXpub('tpub1234567890', 'btc')).toBe(false);
        expect(isValidXpub('xpriv1234567890', 'btc')).toBe(false);
        expect(isValidXpub('abc', 'btc')).toBe(false);
        expect(isValidXpub('', 'btc')).toBe(false);
    });

    it('should return true for unspecified network symbols', () => {
        expect(isValidXpub('xpub1234567890', 'dgb')).toBe(true);
        expect(isValidXpub('ypub1234567890', 'ltc')).toBe(true);
        expect(isValidXpub('ypub1234567890', 'eth')).toBe(true);
    });
});
