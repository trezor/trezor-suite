import { getCoinLabel } from './getCoinLabel';

describe('utils/suite/getCoinLabel', () => {
    it('should return testnet label', () => {
        expect(getCoinLabel(['tokens'], true)).toBe('TR_TESTNET_COINS_LABEL');
    });
    it('should return tokens label', () => {
        expect(getCoinLabel(['tokens'], false)).toBe('TR_INCLUDING_TOKENS');
    });
    it('should return tokens and staking label', () => {
        expect(getCoinLabel(['tokens', 'staking'], false)).toBe('TR_INCLUDING_TOKENS_AND_STAKING');
    });
});
