import { isTestnet } from './networksConfig';
import { asNetworkSymbol } from './types';

const btcSymbol = asNetworkSymbol('btc');
const testSymbol = asNetworkSymbol('test');

describe(isTestnet.name, () => {
    it('returns false for a mainnet', () => {
        expect(isTestnet(btcSymbol)).toBe(false);
    });

    it('returns true for a testnet', () => {
        expect(isTestnet(testSymbol)).toBe(true);
    });
});
