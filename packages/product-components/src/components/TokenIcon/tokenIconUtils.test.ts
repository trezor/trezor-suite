import {
    ZERO_ADDRESS,
    getCoingeckoIdAndContractAddressIncludesNativeTokens,
} from './tokenIconUtils';

describe('getCoingeckoIdAndContractAddressIncludesNativeTokens', () => {
    it.each([
        ['a token keeps the platform id', 'ethereum', ['0xabc'], 'ethereum', ['0xabc']],
        ['a native coin uses its trade id', 'avalanche', undefined, 'avalanche-2', [ZERO_ADDRESS]],
        [
            'an L2 native coin uses the settlement coin trade id',
            'optimistic-ethereum',
            [ZERO_ADDRESS],
            'ethereum',
            [ZERO_ADDRESS],
        ],
        [
            'a network with a foreign native asset uses that asset',
            'arc',
            [ZERO_ADDRESS],
            'usd-coin',
            [ZERO_ADDRESS],
        ],
        ['a token on such a network keeps the platform id', 'arc', ['0xabc'], 'arc', ['0xabc']],
        ['a native asset passed without an address', 'arc', undefined, 'usd-coin', [ZERO_ADDRESS]],
    ])('%s', (_, coingeckoId, contractAddresses, expectedCoingeckoId, expectedAddresses) => {
        expect(
            getCoingeckoIdAndContractAddressIncludesNativeTokens(coingeckoId, contractAddresses),
        ).toEqual({ coingeckoId: expectedCoingeckoId, contractAddresses: expectedAddresses });
    });
});
