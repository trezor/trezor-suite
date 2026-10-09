import { asNetworkSymbol } from '@trezor/network-module-types';

import { createNetworkIcon } from './createNetworkIcon';
import { type NetworkModuleDefinition, createNetworkModule } from './createNetworkModule';

const createTestResolver = () => {
    const definition: NetworkModuleDefinition<'aaa' | 'taaa'> = {
        icon: createNetworkIcon({
            supportedNetworks: ['aaa', 'taaa'],
            assets: {
                getIcons: () => ({ testnet: false, coin: 'coin.svg', network: 'network.svg' }),
                getIconPaths: () => ({ coin: 'coin.svg', network: 'network.svg' }),
            },
        }),
        addressValidator: {
            isAddressValid: () => true,
            getAddressType: () => undefined,
        },
        getAccountSyncInterval: symbol => (symbol === 'aaa' ? 40_000 : 60_000),
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

describe('createNetworkModule account sync interval', () => {
    const getAccountSyncInterval = jest.fn((symbol: 'aaa' | 'taaa') =>
        symbol === 'aaa' ? 40_000 : 60_000,
    );
    const networkModule = createNetworkModule(['aaa', 'taaa'], {
        icon: createNetworkIcon({
            supportedNetworks: ['aaa', 'taaa'],
            assets: {
                getIcons: () => ({ testnet: false, coin: 'coin.svg', network: 'network.svg' }),
                getIconPaths: () => ({ coin: 'coin.svg', network: 'network.svg' }),
            },
        }),
        addressValidator: {
            isAddressValid: () => true,
            getAddressType: () => undefined,
        },
        getNetworkConfig: () => {
            throw new Error('Network config is not used by interval tests.');
        },
        getAccountSyncInterval,
    });

    it('uses the interval configured for each supported symbol', () => {
        expect(networkModule.getAccountSyncInterval(asNetworkSymbol('aaa'))).toBe(40_000);
        expect(networkModule.getAccountSyncInterval(asNetworkSymbol('taaa'))).toBe(60_000);
    });

    it('rejects unsupported symbols before looking up their interval', () => {
        getAccountSyncInterval.mockClear();

        expect(() => networkModule.getAccountSyncInterval(asNetworkSymbol('zzz'))).toThrow(
            'Unsupported network symbol: zzz',
        );
        expect(getAccountSyncInterval).not.toHaveBeenCalled();
    });
});
