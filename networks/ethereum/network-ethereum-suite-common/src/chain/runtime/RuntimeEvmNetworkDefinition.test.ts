import { validateRuntimeEvmNetworkDefinition } from './RuntimeEvmNetworkDefinition';

const options = {
    source: 'user' as const,
    reservedSymbols: new Set(['eth', 'base']),
    reservedChainIds: new Set([1, 8453]),
};

const input = {
    symbol: 'ink',
    chainId: 57073,
    name: 'Ink',
    nativeSymbol: 'ETH',
    decimals: 18,
    rpcUrls: ['https://rpc-gel.inkonchain.com'],
    explorer: {
        tx: 'https://explorer.inkonchain.com/tx/',
        address: 'https://explorer.inkonchain.com/address/',
    },
};

describe(validateRuntimeEvmNetworkDefinition.name, () => {
    it('makes a definition of valid input, with its source', () => {
        expect(validateRuntimeEvmNetworkDefinition(input, options)).toEqual({
            success: true,
            definition: { ...input, source: 'user' },
        });
    });

    it.each([
        ['invalid-shape', null],
        ['invalid-shape', { ...input, name: ' ' }],
        ['invalid-symbol', { ...input, symbol: 'in-k' }],
        ['invalid-symbol', { ...input, symbol: 'INK' }],
        ['reserved-symbol', { ...input, symbol: 'base' }],
        ['invalid-chain-id', { ...input, chainId: -1 }],
        ['invalid-chain-id', { ...input, chainId: '57073' }],
        ['reserved-chain-id', { ...input, chainId: 1 }],
        ['unsupported-decimals', { ...input, decimals: 6 }],
        ['invalid-rpc-url', { ...input, rpcUrls: [] }],
        ['invalid-rpc-url', { ...input, rpcUrls: ['http://rpc.example.com'] }],
        ['invalid-rpc-url', { ...input, rpcUrls: ['not a url'] }],
        ['invalid-explorer-url', { ...input, explorer: { tx: 'http://x/tx/', address: 'x' } }],
    ])('refuses %s input', (error, candidate) => {
        expect(validateRuntimeEvmNetworkDefinition(candidate, options)).toEqual({
            success: false,
            error,
        });
    });

    it('accepts a node on this machine over plain HTTP', () => {
        expect(
            validateRuntimeEvmNetworkDefinition(
                { ...input, rpcUrls: ['http://127.0.0.1:8545'] },
                options,
            ),
        ).toMatchObject({ success: true });
    });
});
