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

describe(buildViemChainCatalogue.name, () => {
    it('maps a chain to an unlabelled catalogue entry', () => {
        const result = buildViemChainCatalogue([mockChain()], defaultParams);

        expect(result).toEqual([
            {
                definition: {
                    symbol: 'evm146',
                    chainId: 146,
                    name: 'Sonic',
                    displaySymbol: 'S',
                    currencyName: 'Sonic',
                    rpcUrls: ['https://rpc.soniclabs.com'],
                    explorerUrl: 'https://sonicscan.org',
                    testnet: false,
                },
                unsupportedReason: undefined,
            },
        ]);
    });

    it('falls back to an empty explorer URL when the chain has none', () => {
        const result = buildViemChainCatalogue(
            [mockChain({ blockExplorers: undefined })],
            defaultParams,
        );

        expect(result.map(({ definition }) => definition.explorerUrl)).toEqual(['']);
    });

    it('dedupes chains by id and keeps the first one', () => {
        const result = buildViemChainCatalogue(
            [mockChain({ name: 'Sonic' }), mockChain({ name: 'Sonic (deprecated alias)' })],
            defaultParams,
        );

        expect(result.map(({ definition }) => definition.name)).toEqual(['Sonic']);
    });

    it.each([
        [
            'a 6-decimal native currency',
            { nativeCurrency: { name: 'Sonic', symbol: 'S', decimals: 6 } },
            { type: 'nativeCurrencyDecimals', decimals: 6 },
        ],
        ['no default http RPC URL', { rpcUrls: { default: { http: [] } } }, { type: 'noRpcUrl' }],
        ['no block explorer', { blockExplorers: undefined }, { type: 'noExplorerUrl' }],
        [
            '6 decimals and no RPC URL',
            {
                nativeCurrency: { name: 'Sonic', symbol: 'S', decimals: 6 },
                rpcUrls: { default: { http: [] } },
            },
            { type: 'nativeCurrencyDecimals', decimals: 6 },
        ],
    ])('lists a chain with %s as unsupported', (_, overrides, expectedReason) => {
        const [entry] = buildViemChainCatalogue([mockChain(overrides)], defaultParams);

        expect(entry?.unsupportedReason).toEqual(expectedReason);
    });

    it('drops excluded chain ids', () => {
        const result = buildViemChainCatalogue([mockChain({ id: 1 }), mockChain({ id: 2 })], {
            ...defaultParams,
            excludedChainIds: new Set([1]),
        });

        expect(result.map(({ definition }) => definition.chainId)).toEqual([2]);
    });

    it('drops testnets unless they are requested', () => {
        const chains = [mockChain({ id: 1, testnet: true }), mockChain({ id: 2 })];

        expect(
            buildViemChainCatalogue(chains, defaultParams).map(
                ({ definition }) => definition.chainId,
            ),
        ).toEqual([2]);

        const withTestnets = buildViemChainCatalogue(chains, {
            ...defaultParams,
            includeTestnets: true,
        });

        expect(
            withTestnets.map(({ definition }) => [definition.chainId, definition.testnet]),
        ).toEqual([
            [1, true],
            [2, false],
        ]);
    });

    it('sorts the supported chains by name before the unsupported ones', () => {
        const result = buildViemChainCatalogue(
            [
                mockChain({ id: 1, name: 'Zora' }),
                mockChain({ id: 2, name: 'Abstract', rpcUrls: { default: { http: [] } } }),
                mockChain({ id: 3, name: 'Mantle' }),
            ],
            defaultParams,
        );

        expect(result.map(({ definition }) => definition.name)).toEqual([
            'Mantle',
            'Zora',
            'Abstract',
        ]);
    });

    it('does not share the chain RPC URL array with the definition', () => {
        const chain = mockChain();
        const [entry] = buildViemChainCatalogue([chain], defaultParams);

        entry?.definition.rpcUrls.push('https://example.com');

        expect(chain.rpcUrls.default.http).toEqual(['https://rpc.soniclabs.com']);
    });
});
