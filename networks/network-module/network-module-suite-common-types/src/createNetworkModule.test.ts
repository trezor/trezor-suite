import { type NetworkSymbol, asNetworkSymbol } from '@trezor/network-module-types';

import type { WalletConnectAccount, WalletConnectRequestContext } from './WalletConnectAdapter';
import { type NetworkModuleDefinition, createNetworkModule } from './createNetworkModule';

const createTestResolver = () => {
    const definition: NetworkModuleDefinition<'aaa' | 'taaa'> = {
        addressValidator: {
            isAddressValid: () => true,
            getAddressType: () => undefined,
        },
        getNetworkConfig: () => {
            throw new Error('Network config is not used by resolver tests.');
        },
        namedAddressResolver: {
            supportsNamedAddress: symbol => symbol === 'aaa',
            isNameLike: value => value.endsWith('.name'),
            isAddressLike: value => value.startsWith('0x'),
            resolveNamedAddress: value => Promise.resolve(value === 'alice.name' ? '0x123' : null),
            reverseResolveAddress: value =>
                Promise.resolve(value === '0x123' ? 'alice.name' : null),
        },
    };
    const { namedAddressResolver } = createNetworkModule(['aaa', 'taaa'], definition);
    if (!namedAddressResolver) throw new Error('Expected a named address resolver.');

    return namedAddressResolver;
};

describe('createNetworkModule named address resolver', () => {
    it('reports support for supported, disabled, and foreign networks', () => {
        const resolver = createTestResolver();

        expect(resolver.supportsNamedAddress(asNetworkSymbol('aaa'))).toBe(true);
        expect(resolver.supportsNamedAddress(asNetworkSymbol('taaa'))).toBe(false);
        expect(resolver.supportsNamedAddress(asNetworkSymbol('zzz'))).toBe(false);
    });

    it('preserves forward and reverse resolution results', async () => {
        const resolver = createTestResolver();
        const symbol = asNetworkSymbol('aaa');

        await expect(resolver.resolveNamedAddress('alice.name', symbol)).resolves.toBe('0x123');
        await expect(resolver.resolveNamedAddress('missing.name', symbol)).resolves.toBeNull();
        await expect(resolver.reverseResolveAddress('0x123', symbol)).resolves.toBe('alice.name');
        await expect(resolver.reverseResolveAddress('0x456', symbol)).resolves.toBeNull();
    });

    it('rejects foreign symbols through the returned promises', async () => {
        const resolver = createTestResolver();
        const symbol = asNetworkSymbol('zzz');

        await expect(resolver.resolveNamedAddress('alice.name', symbol)).rejects.toThrow(
            'Unsupported network symbol: zzz',
        );
        await expect(resolver.reverseResolveAddress('0x123', symbol)).rejects.toThrow(
            'Unsupported network symbol: zzz',
        );
    });
});

const createTestAccount = (symbol: string): WalletConnectAccount<NetworkSymbol> => ({
    symbol: asNetworkSymbol(symbol),
    descriptor: `${symbol}-descriptor`,
    path: "m/44'/0'/0'",
    visible: true,
    identity: 'identity',
});

const createTestRequestContext = (
    overrides: Partial<WalletConnectRequestContext<NetworkSymbol>> = {},
): WalletConnectRequestContext<NetworkSymbol> => ({
    request: { method: 'aaa_sign', params: {}, chainId: 'aaa:1' },
    accounts: [],
    sessionSymbol: undefined,
    callDevice: () => Promise.reject(new Error('Device is not used by this test.')),
    resolveNonce: () => Promise.reject(new Error('Nonce is not used by this test.')),
    isMevProtectionEnabled: false,
    ...overrides,
});

const createTestWalletConnectAdapter = () => {
    const handleRequest = jest.fn((context: WalletConnectRequestContext<'aaa' | 'taaa'>) =>
        Promise.resolve(context),
    );
    const definition: NetworkModuleDefinition<'aaa' | 'taaa'> = {
        addressValidator: {
            isAddressValid: () => true,
            getAddressType: () => undefined,
        },
        getNetworkConfig: () => {
            throw new Error('Network config is not used by WalletConnect tests.');
        },
        walletConnectAdapter: {
            namespaceId: 'aaa',
            methods: ['aaa_sign'],
            events: ['accountsChanged'],
            getChainIds: symbol => [`aaa:${symbol}`],
            getAccountAddress: account => `${account.symbol}:${account.descriptor}`,
            handleRequest,
        },
    };
    const { walletConnectAdapter } = createNetworkModule(['aaa', 'taaa'], definition);
    if (!walletConnectAdapter) throw new Error('Expected a WalletConnect adapter.');

    return { walletConnectAdapter, handleRequest };
};

describe('createNetworkModule WalletConnect adapter', () => {
    it('keeps the namespace of the module', () => {
        const { walletConnectAdapter } = createTestWalletConnectAdapter();

        expect(walletConnectAdapter.namespaceId).toBe('aaa');
        expect(walletConnectAdapter.methods).toEqual(['aaa_sign']);
        expect(walletConnectAdapter.events).toEqual(['accountsChanged']);
    });

    it('rejects foreign symbols at the edge', () => {
        const { walletConnectAdapter } = createTestWalletConnectAdapter();

        expect(walletConnectAdapter.getChainIds(asNetworkSymbol('aaa'))).toEqual(['aaa:aaa']);
        expect(() => walletConnectAdapter.getChainIds(asNetworkSymbol('zzz'))).toThrow(
            'Unsupported network symbol: zzz',
        );
        expect(walletConnectAdapter.getAccountAddress(createTestAccount('taaa'))).toBe(
            'taaa:taaa-descriptor',
        );
        expect(() => walletConnectAdapter.getAccountAddress(createTestAccount('zzz'))).toThrow(
            'Unsupported network symbol: zzz',
        );
    });

    it('hands only the accounts of the module to the request handler', async () => {
        const { walletConnectAdapter, handleRequest } = createTestWalletConnectAdapter();
        const accounts = [createTestAccount('aaa'), createTestAccount('zzz')];

        await walletConnectAdapter.handleRequest(createTestRequestContext({ accounts }));

        expect(handleRequest).toHaveBeenCalledWith(
            expect.objectContaining({ accounts: [createTestAccount('aaa')] }),
        );
    });

    it.each([
        ['aaa', 'aaa'],
        ['zzz', undefined],
        [undefined, undefined],
    ])('narrows the session symbol %s to %s', async (sessionSymbol, expected) => {
        const { walletConnectAdapter, handleRequest } = createTestWalletConnectAdapter();

        await walletConnectAdapter.handleRequest(
            createTestRequestContext({
                sessionSymbol:
                    sessionSymbol === undefined ? undefined : asNetworkSymbol(sessionSymbol),
            }),
        );

        expect(handleRequest).toHaveBeenCalledWith(
            expect.objectContaining({ sessionSymbol: expected }),
        );
    });

    it('resolves the nonce through the app', async () => {
        const { walletConnectAdapter, handleRequest } = createTestWalletConnectAdapter();
        const resolveNonce = jest.fn(() => Promise.resolve('7'));
        const account = createTestAccount('aaa');

        await walletConnectAdapter.handleRequest(
            createTestRequestContext({ accounts: [account], resolveNonce }),
        );
        const moduleContext = handleRequest.mock.calls[0]?.[0];
        const moduleAccount = moduleContext?.accounts[0];
        if (!moduleContext || !moduleAccount) throw new Error('Expected a handled request.');

        await expect(moduleContext.resolveNonce(moduleAccount)).resolves.toBe('7');
        expect(resolveNonce).toHaveBeenCalledWith(account);
    });
});
