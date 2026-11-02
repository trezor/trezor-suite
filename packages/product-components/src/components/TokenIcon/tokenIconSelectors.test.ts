import { type NetworkConfigState, asNetworkSymbol } from '@trezor/network-module-types';

import { selectCoingeckoIdAndContractAddressIncludesNativeTokens } from './tokenIconSelectors';
import { ZERO_ADDRESS } from './tokenIconUtils';

const ethereum = asNetworkSymbol('eth');
const ethereumConfig = {
    name: 'Ethereum',
    displaySymbol: 'ETH',
    coingeckoId: 'ethereum',
    tradeCryptoId: 'ethereum-native',
};
const arc = asNetworkSymbol('arc');
const arcConfig = {
    name: 'Arc',
    displaySymbol: 'ARC',
    coingeckoId: 'arc',
    tradeCryptoId: 'arc-native',
    nativeAssetCryptoId: 'usd-coin',
};
const state: NetworkConfigState = { networks: { [ethereum]: ethereumConfig, [arc]: arcConfig } };

type TokenIconTestCase = {
    description: string;
    state: NetworkConfigState;
    coingeckoId?: string;
    contractAddresses: readonly string[] | undefined;
    expected: ReturnType<typeof selectCoingeckoIdAndContractAddressIncludesNativeTokens>;
};

const cases: TokenIconTestCase[] = [
    {
        description: 'keeps token logo identifiers for token contracts',
        state,
        contractAddresses: ['contract'],
        expected: { coingeckoId: 'ethereum', contractAddresses: ['contract'] },
    },
    {
        description: 'uses the native trade ID when contract addresses are undefined',
        state,
        contractAddresses: undefined,
        expected: { coingeckoId: 'ethereum-native', contractAddresses: [ZERO_ADDRESS] },
    },
    {
        description: 'uses the native trade ID when contract addresses are empty',
        state,
        contractAddresses: [],
        expected: { coingeckoId: 'ethereum-native', contractAddresses: [ZERO_ADDRESS] },
    },
    {
        description: 'uses the native trade ID when a native candidate accompanies token contracts',
        state,
        contractAddresses: ['contract', ZERO_ADDRESS],
        expected: {
            coingeckoId: 'ethereum-native',
            contractAddresses: ['contract', ZERO_ADDRESS],
        },
    },
    {
        description: 'keeps the supplied Coingecko ID when network config is unavailable',
        state: { networks: null },
        contractAddresses: undefined,
        expected: { coingeckoId: 'ethereum', contractAddresses: [ZERO_ADDRESS] },
    },
    {
        description: 'keeps the supplied Coingecko ID when the native trade ID is unavailable',
        state: { networks: { [ethereum]: { ...ethereumConfig, tradeCryptoId: undefined } } },
        contractAddresses: undefined,
        expected: { coingeckoId: 'ethereum', contractAddresses: [ZERO_ADDRESS] },
    },
    {
        description: 'uses the native asset ID of a network whose native asset is a foreign coin',
        state,
        coingeckoId: 'arc',
        contractAddresses: [ZERO_ADDRESS],
        expected: { coingeckoId: 'usd-coin', contractAddresses: [ZERO_ADDRESS] },
    },
    {
        description: 'keeps the platform ID for token contracts on such a network',
        state,
        coingeckoId: 'arc',
        contractAddresses: ['contract'],
        expected: { coingeckoId: 'arc', contractAddresses: ['contract'] },
    },
];

it.each(cases)(
    '$description',
    ({ state: configuredState, coingeckoId = 'ethereum', contractAddresses, expected }) => {
        expect(
            selectCoingeckoIdAndContractAddressIncludesNativeTokens(
                configuredState,
                coingeckoId,
                contractAddresses,
            ),
        ).toEqual(expected);
    },
);

it('keeps the selected result stable across unrelated state changes and updates native metadata', () => {
    const selected = selectCoingeckoIdAndContractAddressIncludesNativeTokens(
        state,
        'ethereum',
        undefined,
    );
    const unrelatedUpdate: NetworkConfigState = {
        networks: { ...state.networks, [asNetworkSymbol('btc')]: { name: 'Bitcoin' } },
    };
    expect(
        selectCoingeckoIdAndContractAddressIncludesNativeTokens(
            unrelatedUpdate,
            'ethereum',
            undefined,
        ),
    ).toBe(selected);

    const nativeUpdate: NetworkConfigState = {
        networks: { [ethereum]: { ...ethereumConfig, tradeCryptoId: 'updated-native' } },
    };
    expect(
        selectCoingeckoIdAndContractAddressIncludesNativeTokens(
            nativeUpdate,
            'ethereum',
            undefined,
        ),
    ).toEqual({ coingeckoId: 'updated-native', contractAddresses: [ZERO_ADDRESS] });
});
