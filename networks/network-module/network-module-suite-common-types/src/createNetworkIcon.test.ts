import type { NetworkAssetsModule } from '@trezor/network-assets-types';
import { asNetworkSymbol } from '@trezor/network-module-types';

import { type NetworkIconDeps, createNetworkIcon } from './createNetworkIcon';

type TestNetworkSymbol = 'aaa' | 'taaa';

const assets: NetworkAssetsModule<TestNetworkSymbol> = {
    getSupportedNetworks: () => ['aaa', 'taaa'],
    getIconPaths: symbol => ({ coin: `${symbol}.svg`, network: `${symbol}-network.svg` }),
    getIcons: symbol => ({
        coin: symbol === 'aaa' ? 'coin.svg' : 42,
        network: symbol === 'aaa' ? 'network.svg' : 43,
        testnet: symbol === 'taaa',
    }),
};
const deps: NetworkIconDeps<TestNetworkSymbol> = {
    supportedNetworks: ['aaa', 'taaa'],
    assets,
};

it('keeps native asset references and returns URLs only for web icon lookups', () => {
    const icon = createNetworkIcon(deps);

    expect(icon.getCryptoIcon('aaa')).toBe('coin.svg');
    expect(icon.getNetworkIcon(asNetworkSymbol('aaa'))).toBe('network.svg');
    expect(icon.getIcon(asNetworkSymbol('taaa'))).toEqual({ coin: 42, network: 43, testnet: true });
    expect(icon.getCryptoIcon('taaa')).toBeUndefined();
    expect(icon.getNetworkIcon(asNetworkSymbol('taaa'))).toBeUndefined();
    expect(icon.isTestnetNetworkIcon(asNetworkSymbol('taaa'))).toBe(true);
});

it('rejects missing mandatory icons and preserves unknown-symbol fallbacks', () => {
    const icon = createNetworkIcon(deps);

    expect(icon.hasNetworkIcon('aaa')).toBe(true);
    expect(icon.hasCryptoIcon('unknown')).toBe(false);
    expect(icon.hasNetworkIcon('unknown')).toBe(false);
    expect(icon.getCryptoIcon('unknown')).toBeUndefined();
    expect(icon.getNetworkIcon(asNetworkSymbol('unknown'))).toBeUndefined();
    expect(() => icon.getIcon(asNetworkSymbol('unknown'))).toThrow(
        'Unsupported network symbol: unknown',
    );
    expect(icon.getTokenLogoIdentifiers('unknown', 'TOKEN')).toEqual(['TOKEN']);
    expect(icon.getTokenLogoIdentifiers('aaa')).toEqual([]);
    expect(icon.isWrappedNativeToken('aaa', 'TOKEN')).toBe(false);
});

it('delegates token behavior only for supported symbols with a contract', async () => {
    const tokenDeps: NetworkIconDeps<TestNetworkSymbol> = {
        ...deps,
        isWrappedNativeToken: (symbol, contract) => symbol === 'aaa' && contract === 'wrapped',
        getTokenLogoIdentifiers: (symbol, contract) =>
            Promise.resolve([symbol, contract.toLowerCase()]),
    };
    const icon = createNetworkIcon(tokenDeps);

    expect(icon.isWrappedNativeToken('aaa', 'wrapped')).toBe(true);
    expect(icon.isWrappedNativeToken('taaa', 'wrapped')).toBe(false);
    expect(icon.isWrappedNativeToken('unknown', 'wrapped')).toBe(false);
    expect(icon.isWrappedNativeToken('aaa')).toBe(false);
    expect(await icon.getTokenLogoIdentifiers('aaa', 'TOKEN')).toEqual(['aaa', 'token']);
});

it('keeps extra asset symbols outside the module supported networks', () => {
    const assetDeps: NetworkIconDeps<'aaa'> = {
        ...deps,
        supportedNetworks: ['aaa'],
    };
    const icon = createNetworkIcon(assetDeps);

    expect(icon.hasCryptoIcon('taaa')).toBe(false);
    expect(icon.hasNetworkIcon('taaa')).toBe(false);
    expect(icon.getCryptoIcon('taaa')).toBeUndefined();
    expect(() => icon.getIcon(asNetworkSymbol('taaa'))).toThrow('Unsupported network symbol: taaa');
});

it('resolves original icon paths without loading bundler assets', () => {
    const getIcons = jest.fn(() => {
        throw new Error('SVG sources must not be loaded by a path lookup.');
    });
    const pathDeps: NetworkIconDeps<TestNetworkSymbol> = {
        ...deps,
        assets: { ...assets, getIcons },
    };
    const icon = createNetworkIcon(pathDeps);

    expect(icon.getIconPaths(asNetworkSymbol('aaa'))).toEqual({
        coin: 'aaa.svg',
        network: 'aaa-network.svg',
    });
    expect(getIcons).not.toHaveBeenCalled();
    expect(() => icon.getIconPaths(asNetworkSymbol('unknown'))).toThrow(
        'Unsupported network symbol: unknown',
    );
});
