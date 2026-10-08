import {
    type RuntimeEvmNetworkInput,
    checkRuntimeEvmNetworkInput,
} from './checkRuntimeEvmNetworkInput';

const input: RuntimeEvmNetworkInput = {
    name: ' Example Chain ',
    chainId: '777',
    symbol: 'EXC',
    nativeSymbol: 'EXC',
    rpcUrl: ' https://rpc.example.com ',
    explorerUrl: 'https://explorer.example.com/',
};

const getDeps = (servedChainId: number | null = 777) => ({
    reservedSymbols: new Set(['eth']),
    reservedChainIds: new Set([1]),
    getRpcChainId: jest.fn().mockResolvedValue(servedChainId),
});

describe(checkRuntimeEvmNetworkInput.name, () => {
    it("makes a user's definition once its node serves the chain it names", async () => {
        const deps = getDeps();

        await expect(checkRuntimeEvmNetworkInput(input, deps)).resolves.toEqual({
            success: true,
            definition: {
                symbol: 'exc',
                chainId: 777,
                name: 'Example Chain',
                nativeSymbol: 'EXC',
                decimals: 18,
                rpcUrls: ['https://rpc.example.com'],
                explorer: {
                    tx: 'https://explorer.example.com/tx/',
                    address: 'https://explorer.example.com/address/',
                },
                source: 'user',
            },
        });
        expect(deps.getRpcChainId).toHaveBeenCalledWith('https://rpc.example.com');
    });

    it('refuses a node that serves another chain', async () => {
        await expect(checkRuntimeEvmNetworkInput(input, getDeps(1))).resolves.toEqual({
            success: false,
            message: 'The node serves chain 1, not chain 777.',
        });
    });

    it('refuses a node it cannot reach', async () => {
        await expect(checkRuntimeEvmNetworkInput(input, getDeps(null))).resolves.toEqual({
            success: false,
            message: 'The node at rpc.example.com cannot be reached.',
        });
    });

    it.each([
        [{ chainId: '' }, 'The chain ID must be a positive whole number.'],
        [{ chainId: '1' }, 'Another network already uses this chain ID.'],
        [{ symbol: 'ETH' }, 'Another network already uses this symbol.'],
        [{ symbol: 'ex-c' }, 'The network symbol takes 2 to 10 lowercase letters or digits.'],
        [
            { rpcUrl: 'http://rpc.example.com' },
            'The RPC URL must use https (http only on this computer).',
        ],
        [{ explorerUrl: 'http://explorer.example.com' }, 'The explorer URL must use https.'],
    ])('refuses %j without asking the node', async (change, message) => {
        const deps = getDeps();

        await expect(checkRuntimeEvmNetworkInput({ ...input, ...change }, deps)).resolves.toEqual({
            success: false,
            message,
        });
        expect(deps.getRpcChainId).not.toHaveBeenCalled();
    });
});
