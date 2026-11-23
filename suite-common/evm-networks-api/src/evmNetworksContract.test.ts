import {
    type EvmNetwork,
    getChainIdFromCaip2,
    parseEvmNetworksResponse,
} from './evmNetworksContract';

const GENERATED_AT = '2026-11-18T00:00:00.000Z';

const mantleRow = {
    caip2: 'eip155:5000',
    name: 'Mantle',
    nativeCurrency: { symbol: 'MNT', name: 'Mantle', decimals: 18 },
    networkType: 'mainnet',
    rpcUrls: ['https://rpc.mantle.xyz'],
    explorerUrl: 'https://mantlescan.xyz',
    coingeckoId: 'mantle',
    iconUrl: 'https://coin-images.coingecko.com/mantle.png',
    nativeAssetCryptoId: 'mantle',
    mayClearSign: false,
    simulationSupport: true,
};

const parseNetworks = (networks: unknown[]): readonly EvmNetwork[] => {
    const result = parseEvmNetworksResponse({ generatedAt: GENERATED_AT, networks });

    if (!result.success) {
        throw new Error(result.error.detail);
    }

    return result.payload.networks;
};

describe(parseEvmNetworksResponse.name, () => {
    it('reads a well-formed row', () => {
        expect(parseNetworks([mantleRow])).toEqual([
            {
                caip2: 'eip155:5000',
                name: 'Mantle',
                nativeCurrency: { symbol: 'MNT', name: 'Mantle', decimals: 18 },
                networkType: 'mainnet',
                rpcUrls: ['https://rpc.mantle.xyz'],
                explorerUrl: 'https://mantlescan.xyz',
                coingeckoId: 'mantle',
                iconUrl: 'https://coin-images.coingecko.com/mantle.png',
                nativeAssetCryptoId: 'mantle',
                mayClearSign: false,
                simulationSupport: true,
            },
        ]);
    });

    it('ignores unknown fields', () => {
        const [network] = parseNetworks([{ ...mantleRow, futureField: 1 }]);

        expect(network).not.toHaveProperty('futureField');
    });

    it('keeps a network type it does not know as given', () => {
        const [network] = parseNetworks([{ ...mantleRow, networkType: 'devnet' }]);

        expect(network?.networkType).toBe('devnet');
    });

    it('drops URLs that are not https', () => {
        const [network] = parseNetworks([
            {
                ...mantleRow,
                rpcUrls: ['http://rpc.mantle.xyz', 'https://rpc.mantle.xyz'],
                explorerUrl: 'http://mantlescan.xyz',
                iconUrl: 'http://coin-images.coingecko.com/mantle.png',
            },
        ]);

        expect(network?.rpcUrls).toEqual(['https://rpc.mantle.xyz']);
        expect(network).not.toHaveProperty('explorerUrl');
        expect(network).not.toHaveProperty('iconUrl');
    });

    it.each([
        ['a non-EIP-155 id', { caip2: 'solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp' }],
        ['a zero chain id', { caip2: 'eip155:0' }],
        ['a leading zero', { caip2: 'eip155:01' }],
        ['an unsafe chain id', { caip2: `eip155:${Number.MAX_SAFE_INTEGER}0` }],
        ['an empty name', { name: '' }],
        ['negative decimals', { nativeCurrency: { symbol: 'X', name: 'X', decimals: -1 } }],
        ['missing currency', { nativeCurrency: undefined }],
        ['a missing flag', { simulationSupport: undefined }],
        ['an RPC URL that is not a URL', { rpcUrls: [42] }],
    ])('drops a row with %s', (_, override) => {
        expect(parseNetworks([{ ...mantleRow, ...override }])).toEqual([]);
    });

    it('keeps the first row of a chain id', () => {
        const networks = parseNetworks([mantleRow, { ...mantleRow, name: 'Mantle copy' }]);

        expect(networks.map(({ name }) => name)).toEqual(['Mantle']);
    });

    it.each([
        ['a non-object body', []],
        ['a missing generatedAt', { networks: [] }],
        ['networks that are not an array', { generatedAt: GENERATED_AT }],
    ])('rejects %s', (_, body) => {
        expect(parseEvmNetworksResponse(body)).toMatchObject({ success: false });
    });
});

describe(getChainIdFromCaip2.name, () => {
    it.each([
        ['eip155:1', 1],
        ['eip155:5000', 5000],
        ['eip155:0', undefined],
        ['cosmos:1', undefined],
        [undefined, undefined],
    ])('reads %s as %s', (caip2, chainId) => {
        expect(getChainIdFromCaip2(caip2)).toBe(chainId);
    });
});
