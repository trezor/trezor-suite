import { asNetworkSymbol } from '@trezor/network-module';

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
