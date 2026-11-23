import { type EvmNetwork } from '@suite-common/evm-networks-api';
import { mockEvmNetwork } from '@suite-common/evm-networks-api/mocks';

import { buildRemoteChainCatalogue } from './remoteChainCatalogue';

const mantle = (overrides: Partial<EvmNetwork> = {}): EvmNetwork =>
    mockEvmNetwork({
        chainId: 5000,
        name: 'Mantle',
        nativeCurrency: { symbol: 'MNT', name: 'Mantle', decimals: 18 },
        rpcUrls: ['https://rpc.mantle.xyz'],
        explorerUrl: 'https://mantlescan.xyz',
        coingeckoId: 'mantle',
        iconUrl: 'https://coin-images.coingecko.com/mantle.png',
        nativeAssetCryptoId: 'mantle',
        mayClearSign: true,
        simulationSupport: true,
        ...overrides,
    });

const defaultParams = { excludedChainIds: [], includeTestnets: false };

describe(buildRemoteChainCatalogue.name, () => {
    it('maps a network to a definition and its labels', () => {
        expect(buildRemoteChainCatalogue([mantle()], defaultParams)).toEqual([
            {
                definition: {
                    symbol: 'evm5000',
                    chainId: 5000,
                    name: 'Mantle',
                    displaySymbol: 'MNT',
                    currencyName: 'Mantle',
                    rpcUrls: ['https://rpc.mantle.xyz'],
                    explorerUrl: 'https://mantlescan.xyz',
                    testnet: false,
                    coingeckoId: 'mantle',
                    nativeAssetCryptoId: 'mantle',
                    tradeCryptoId: undefined,
                },
                iconUrl: 'https://coin-images.coingecko.com/mantle.png',
                mayClearSign: true,
                simulationSupport: true,
                unsupportedReason: undefined,
            },
        ]);
    });

    it('falls back to an empty explorer URL', () => {
        const [entry] = buildRemoteChainCatalogue(
            [mantle({ explorerUrl: undefined })],
            defaultParams,
        );

        expect(entry?.definition.explorerUrl).toBe('');
    });

    it.each([
        [
            'a 6-decimal native currency',
            { nativeCurrency: { symbol: 'X', name: 'X', decimals: 6 } },
            { type: 'nativeCurrencyDecimals', decimals: 6 },
        ],
        ['no RPC URL', { rpcUrls: [] }, { type: 'noRpcUrl' }],
    ])('lists a network with %s as unsupported', (_, overrides, expectedReason) => {
        const [entry] = buildRemoteChainCatalogue([mantle(overrides)], defaultParams);

        expect(entry?.unsupportedReason).toEqual(expectedReason);
    });

    it('drops excluded chain ids', () => {
        const networks = [mantle({ caip2: 'eip155:1' }), mantle({ caip2: 'eip155:2' })];
        const result = buildRemoteChainCatalogue(networks, {
            ...defaultParams,
            excludedChainIds: new Set([1]),
        });

        expect(result.map(({ definition }) => definition.chainId)).toEqual([2]);
    });

    it('drops testnets unless they are requested, but keeps networks of unknown type', () => {
        const networks = [
            mantle({ caip2: 'eip155:1', name: 'A', networkType: 'testnet' }),
            mantle({ caip2: 'eip155:2', name: 'B', networkType: 'unknown' }),
        ];
        const getChainIds = (includeTestnets: boolean) =>
            buildRemoteChainCatalogue(networks, { ...defaultParams, includeTestnets }).map(
                ({ definition }) => [definition.chainId, definition.testnet],
            );

        expect(getChainIds(false)).toEqual([[2, false]]);
        expect(getChainIds(true)).toEqual([
            [1, true],
            [2, false],
        ]);
    });

    it('sorts the supported networks by name before the unsupported ones', () => {
        const result = buildRemoteChainCatalogue(
            [
                mantle({ caip2: 'eip155:1', name: 'Zora' }),
                mantle({ caip2: 'eip155:2', name: 'Abstract', rpcUrls: [] }),
                mantle({ caip2: 'eip155:3', name: 'Mantle' }),
            ],
            defaultParams,
        );

        expect(result.map(({ definition }) => definition.name)).toEqual([
            'Mantle',
            'Zora',
            'Abstract',
        ]);
    });
});
