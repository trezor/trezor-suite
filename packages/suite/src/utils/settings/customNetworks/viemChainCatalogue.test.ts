import { type ViemChain, buildViemChainCatalogue } from './viemChainCatalogue';

type MockChainOverrides = Partial<ViemChain>;

const mockChain = (overrides: MockChainOverrides = {}): ViemChain => ({
    id: 146,
    name: 'Sonic',
    nativeCurrency: { name: 'Sonic', symbol: 'S', decimals: 18 },
    rpcUrls: { default: { http: ['https://rpc.soniclabs.com'] } },
    blockExplorers: { default: { url: 'https://sonicscan.org' } },
    ...overrides,
});

const defaultParams = { excludedChainIds: [], includeTestnets: false };

describe('buildViemChainCatalogue', () => {
    it('maps a chain to a custom network definition', () => {
        const result = buildViemChainCatalogue([mockChain()], defaultParams);

        expect(result).toEqual([
            {
                symbol: 'evm146',
                chainId: 146,
                name: 'Sonic',
                displaySymbol: 'S',
                currencyName: 'Sonic',
                rpcUrls: ['https://rpc.soniclabs.com'],
                explorerUrl: 'https://sonicscan.org',
                testnet: false,
            },
        ]);
    });

    it('falls back to an empty explorer URL when the chain has none', () => {
        const result = buildViemChainCatalogue(
            [mockChain({ blockExplorers: undefined })],
            defaultParams,
        );

        expect(result.map(({ explorerUrl }) => explorerUrl)).toEqual(['']);
    });

    it('dedupes chains by id and keeps the first one', () => {
        const result = buildViemChainCatalogue(
            [mockChain({ name: 'Sonic' }), mockChain({ name: 'Sonic (deprecated alias)' })],
            defaultParams,
        );

        expect(result.map(({ name }) => name)).toEqual(['Sonic']);
    });

    it('drops chains whose native currency does not have 18 decimals', () => {
        const result = buildViemChainCatalogue(
            [mockChain({ nativeCurrency: { name: 'Sonic', symbol: 'S', decimals: 6 } })],
            defaultParams,
        );

        expect(result).toEqual([]);
    });

    it('drops chains without a default http RPC URL', () => {
        const result = buildViemChainCatalogue(
            [mockChain({ rpcUrls: { default: { http: [] } } })],
            defaultParams,
        );

        expect(result).toEqual([]);
    });

    it('drops excluded chain ids', () => {
        const result = buildViemChainCatalogue([mockChain({ id: 1 }), mockChain({ id: 2 })], {
            ...defaultParams,
            excludedChainIds: new Set([1]),
        });

        expect(result.map(({ chainId }) => chainId)).toEqual([2]);
    });

    it('drops testnets unless they are requested', () => {
        const chains = [mockChain({ id: 1, testnet: true }), mockChain({ id: 2 })];

        expect(
            buildViemChainCatalogue(chains, defaultParams).map(({ chainId }) => chainId),
        ).toEqual([2]);

        const withTestnets = buildViemChainCatalogue(chains, {
            ...defaultParams,
            includeTestnets: true,
        });

        expect(withTestnets.map(({ chainId, testnet }) => [chainId, testnet])).toEqual([
            [1, true],
            [2, false],
        ]);
    });

    it('sorts the result by name', () => {
        const result = buildViemChainCatalogue(
            [
                mockChain({ id: 1, name: 'Zora' }),
                mockChain({ id: 2, name: 'Abstract' }),
                mockChain({ id: 3, name: 'Mantle' }),
            ],
            defaultParams,
        );

        expect(result.map(({ name }) => name)).toEqual(['Abstract', 'Mantle', 'Zora']);
    });

    it('does not share the chain RPC URL array with the definition', () => {
        const chain = mockChain();
        const [definition] = buildViemChainCatalogue([chain], defaultParams);

        definition?.rpcUrls.push('https://example.com');

        expect(chain.rpcUrls.default.http).toEqual(['https://rpc.soniclabs.com']);
    });
});
