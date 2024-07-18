import { getCoinLabel } from '../getCoinLabel';

describe('utils/suite/getCoinLabel', () => {
    it('should return custom backend label', () => {
        expect(getCoinLabel(['tokens'], true, true)).toBe('TR_CUSTOM_BACKEND');
    });
    it('should return testnet label', () => {
        expect(getCoinLabel(['tokens'], true, false)).toBe('TR_TESTNET_COINS_LABEL');
    });
    it('should return tokens label', () => {
        expect(getCoinLabel(['tokens'], false, false)).toBe('TR_INCLUDING_TOKENS');
    });
    it('should return tokens and staking label', () => {
        expect(getCoinLabel(['tokens', 'staking'], false, false)).toBe(
            'TR_INCLUDING_TOKENS_AND_STAKING',
        );
    });
});
