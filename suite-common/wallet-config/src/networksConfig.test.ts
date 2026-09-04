import { isTestnet } from './networksConfig';

describe(isTestnet.name, () => {
    it('returns false for a mainnet', () => {
        expect(isTestnet('btc')).toBe(false);
    });

    it('returns true for a testnet', () => {
        expect(isTestnet('test')).toBe(true);
    });
});
