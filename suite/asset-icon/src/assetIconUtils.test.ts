import {
    ZERO_ADDRESS,
    getCoingeckoIdAndContractAddressIncludesNativeTokens,
    shouldShowNetworkIcon,
} from './assetIconUtils';

it('uses the native coin logo for an L2 native asset while keeping its token platform ID', () => {
    expect(getCoingeckoIdAndContractAddressIncludesNativeTokens('arbitrum-one', undefined)).toEqual(
        {
            coingeckoId: 'ethereum',
            contractAddresses: [ZERO_ADDRESS],
        },
    );
    expect(getCoingeckoIdAndContractAddressIncludesNativeTokens('arbitrum-one', ['token'])).toEqual(
        {
            coingeckoId: 'arbitrum-one',
            contractAddresses: ['token'],
        },
    );
});

it('shows the network badge only for supported tokens', () => {
    expect(shouldShowNetworkIcon('eth', 'token')).toBe(true);
    expect(shouldShowNetworkIcon('eth')).toBe(false);
    expect(shouldShowNetworkIcon('btc', 'token')).toBe(false);
});
