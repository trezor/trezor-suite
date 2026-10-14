import { createMockDeps } from '@trezor/dependency-injection';

import {
    type RegenerateNetworkIconsDeps,
    createRegenerateNetworkIcons,
} from './createRegenerateNetworkIcons';

const createDeps = () =>
    createMockDeps<RegenerateNetworkIconsDeps>({
        repositoryRoot: '/repo',
        readDirectory: directory =>
            Promise.resolve(
                directory.endsWith('cryptoIcons')
                    ? ['test.svg', 'btc.svg', 'new.svg', 'token.svg', 'README.md']
                    : ['new.svg', 'btc.svg'],
            ),
        resolvePrettierConfig: () => Promise.resolve(null),
        formatTypescript: source => Promise.resolve(source),
        writeFile: () => Promise.resolve(),
    });

it('writes only TypeScript while preserving aliases, declared symbols, and crypto-only assets', async () => {
    const deps = createDeps();
    await createRegenerateNetworkIcons(deps)({
        family: 'bitcoin',
        supportedNetworks: ['btc', 'test'],
        icons: {
            test: {
                getIcons: () => {
                    throw new Error('Regeneration must not load SVG modules.');
                },
                getIconPaths: () => ({
                    coin: '/repo/networks/bitcoin/network-bitcoin-assets/assets/cryptoIcons/test.svg',
                    network: '/repo/networks/bitcoin/network-bitcoin-assets/assets/networkIcons/btc.svg',
                }),
            },
        },
    });

    const generatedFiles = new Map(
        deps.writeFile.mock.calls.map(([filePath, content]) => [filePath, content.toString()]),
    );
    expect([...generatedFiles.keys()]).toEqual([
        '/repo/networks/bitcoin/network-bitcoin-assets/src/cryptoIcons.ts',
        '/repo/networks/bitcoin/network-bitcoin-assets/src/networkIcons.ts',
        '/repo/networks/bitcoin/network-bitcoin-assets/src/bitcoinAssets.ts',
    ]);
    const cryptoLoaders = generatedFiles.get(
        '/repo/networks/bitcoin/network-bitcoin-assets/src/cryptoIcons.ts',
    );
    expect(cryptoLoaders).toContain("require.resolve('../assets/cryptoIcons/new.svg')");
    expect(cryptoLoaders).toContain("require.resolve('../assets/cryptoIcons/token.svg')");
    const facade = generatedFiles.get(
        '/repo/networks/bitcoin/network-bitcoin-assets/src/bitcoinAssets.ts',
    );
    expect(facade).toContain('export const bitcoinAssets');
    expect(facade).toContain('regenerateIcons: deps => deps.regenerateNetworkIcons');
    expect(facade).toContain('coin: bitcoinCryptoIcons.test.getIcon()');
    expect(facade).toContain('network: bitcoinNetworkIcons.btc.getIconPath()');
    expect(facade).toContain("export type BitcoinAssetSymbol = BitcoinNetworkSymbol | 'new';");
    expect(facade).not.toContain('bitcoinNetworkIcons.token');
});

it('rejects a missing network icon before modifying files', async () => {
    const deps = createDeps();
    deps.readDirectory.mockImplementation(directory =>
        Promise.resolve(directory.endsWith('cryptoIcons') ? ['unknown.svg'] : ['btc.svg']),
    );

    await expect(
        createRegenerateNetworkIcons(deps)({
            family: 'bitcoin',
            supportedNetworks: ['unknown'],
            icons: {},
        }),
    ).rejects.toThrow("Missing network icon 'unknown'");
    expect(deps.writeFile).not.toHaveBeenCalled();
});
