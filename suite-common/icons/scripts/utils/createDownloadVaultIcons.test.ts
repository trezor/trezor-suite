import { join } from 'path';

import { mockNetworkMetadata } from '@suite-common/networks/mocks';
import { createMockDeps } from '@trezor/dependency-injection';
import { type NetworkSymbol, asNetworkSymbol } from '@trezor/network-module-types';

import { type DownloadVaultIconsDeps, createDownloadVaultIcons } from './createDownloadVaultIcons';
import { COIN_IMAGE_SIZES } from '../../src/coinImages';
import { FILES_CRYPTOICONS_PATH } from '../constants';

const svgBuffer = Buffer.from('<svg/>');
const renderedIcon = Buffer.from('rendered-icon');
const publishedIcon = new Uint8Array([1, 2, 3]).buffer;

const createDeps = () => {
    const networks = new Map([
        ['ethereum', mockNetworkMetadata.eth],
        ['base', { ...mockNetworkMetadata.base, settlementLayer: asNetworkSymbol('eth') }],
        ['arc', mockNetworkMetadata.arc],
        ['bitcoin', mockNetworkMetadata.btc],
    ]);

    return createMockDeps<DownloadVaultIconsDeps>({
        getIconPaths: symbol => ({ coin: `${symbol}.svg`, network: `${symbol}-network.svg` }),
        isSupportedNetwork: (_symbol): _symbol is NetworkSymbol => true,
        getNetworkByCoingeckoId: coingeckoId => networks.get(coingeckoId),
        isWrappedNativeToken: () => false,
        fetchYieldVaults: () => Promise.resolve({}),
        fetchPublishedIcon: () => Promise.resolve(publishedIcon),
        readFile: () => Promise.resolve(svgBuffer),
        rasterizeSvg: () => Promise.resolve(renderedIcon),
        writeFile: () => Promise.resolve(),
        mkdir: () => Promise.resolve(undefined),
        logger: {
            log: () => undefined,
            error: () => undefined,
            info: null,
            debug: null,
            warn: null,
        },
    });
};

const ETH_WETH_VAULT = '0x704cfb08969048a8dff298b214f959791d8da509';
const ETH_USDT_VAULT = '0xe4db1c5a1b709ce4d2ada6985d9d506e58f73829';
const ETH_USDC_VAULT = '0x8cb3649114051ca5119141a34c200d65dc0faa73';
const BASE_WETH_VAULT = '0x4edc6ab1964e25eb2c202ab9f201e9548baa53df';
const BASE_USDC_VAULT = '0x5e6fc406960a1c2d9ab6813ff1c914c6836bc53e';

const ETH_USDC = '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48';
const BASE_USDC = '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913';
const ETH_USDT = '0xdAC17F958D2ee523a2206206994597C13D831ec7';

type VaultParams = {
    address: string;
    underlyingToken: string;
    coingeckoId: string;
};

const vault = ({ address, underlyingToken, coingeckoId }: VaultParams) => ({
    yieldId: `vault-${address}`,
    address,
    underlyingToken,
    coingeckoId,
});

const writtenFiles = (deps: ReturnType<typeof createDeps>) =>
    deps.writeFile.mock.calls.map(([path]) => path);

const writtenIcon = (deps: ReturnType<typeof createDeps>, fileName: string): Buffer | undefined =>
    deps.writeFile.mock.calls.find(
        ([path]) => path === join(FILES_CRYPTOICONS_PATH, fileName),
    )?.[1];

describe('downloadVaultIcons', () => {
    it('writes the underlying icon under the vault address file name in every size', async () => {
        const deps = createDeps();
        deps.fetchYieldVaults.mockResolvedValue({
            ethereum: [
                vault({
                    address: ETH_USDT_VAULT,
                    underlyingToken: ETH_USDT,
                    coingeckoId: 'tether',
                }),
            ],
        });

        await createDownloadVaultIcons(deps)();

        expect(deps.mkdir).toHaveBeenCalledWith(FILES_CRYPTOICONS_PATH, { recursive: true });
        for (const size of COIN_IMAGE_SIZES) {
            expect(deps.writeFile).toHaveBeenCalledWith(
                join(FILES_CRYPTOICONS_PATH, `ethereum--${ETH_USDT_VAULT}@${size}.webp`),
                Buffer.from(publishedIcon),
            );
        }
        expect(deps.writeFile).toHaveBeenCalledTimes(COIN_IMAGE_SIZES.length);
        expect(deps.logger.log).toHaveBeenCalledWith(
            `Vault icons: 🟢 Saved ${COIN_IMAGE_SIZES.length} files:\n`,
            writtenFiles(deps).map(path => path.slice(FILES_CRYPTOICONS_PATH.length + 1)),
        );
    });

    it.each([
        { platform: 'ethereum', symbol: 'eth', nativeSymbol: 'eth' },
        { platform: 'base', symbol: 'base', nativeSymbol: 'eth' },
        { platform: 'arc', symbol: 'arc', nativeSymbol: 'arc' },
        { platform: 'bitcoin', symbol: 'btc', nativeSymbol: 'btc' },
    ])(
        'renders the injected $nativeSymbol icon for a wrapped-native vault on $platform',
        async ({ platform, symbol, nativeSymbol }) => {
            const deps = createDeps();
            deps.isWrappedNativeToken.mockReturnValue(true);
            deps.fetchYieldVaults.mockResolvedValue({
                [platform]: [
                    vault({
                        address: ETH_WETH_VAULT,
                        underlyingToken: 'wrapped-native',
                        coingeckoId: 'wrapped-token',
                    }),
                ],
            });

            await createDownloadVaultIcons(deps)();

            expect(deps.fetchPublishedIcon).not.toHaveBeenCalled();
            expect(deps.isWrappedNativeToken).toHaveBeenCalledWith(symbol, 'wrapped-native');
            expect(deps.getIconPaths).toHaveBeenCalledWith(nativeSymbol);
            expect(deps.readFile).toHaveBeenCalledWith(`${nativeSymbol}.svg`);
            for (const size of COIN_IMAGE_SIZES) {
                expect(deps.rasterizeSvg).toHaveBeenCalledWith(svgBuffer, size);
                expect(writtenIcon(deps, `${platform}--${ETH_WETH_VAULT}@${size}.webp`)).toEqual(
                    renderedIcon,
                );
            }
        },
    );

    it('skips a wrapped-native vault when its native network is unsupported', async () => {
        const deps = createDeps();
        deps.isWrappedNativeToken.mockReturnValue(true);
        deps.isSupportedNetwork.mockReturnValue(false);
        deps.fetchYieldVaults.mockResolvedValue({
            ethereum: [
                vault({
                    address: ETH_WETH_VAULT,
                    underlyingToken: 'wrapped-native',
                    coingeckoId: 'wrapped-token',
                }),
            ],
        });

        await createDownloadVaultIcons(deps)();

        expect(deps.readFile).not.toHaveBeenCalled();
        expect(deps.rasterizeSvg).not.toHaveBeenCalled();
        expect(deps.writeFile).not.toHaveBeenCalled();
    });

    it('keeps the underlying coin id for a non-wrapped underlying on the same platform', async () => {
        const deps = createDeps();
        deps.fetchYieldVaults.mockResolvedValue({
            base: [
                vault({
                    address: BASE_USDC_VAULT,
                    underlyingToken: BASE_USDC,
                    coingeckoId: 'usd-coin',
                }),
            ],
        });

        await createDownloadVaultIcons(deps)();

        expect(deps.fetchPublishedIcon).toHaveBeenCalledWith('usd-coin@24.webp');
        expect(writtenFiles(deps)).toContain(
            join(FILES_CRYPTOICONS_PATH, `base--${BASE_USDC_VAULT}@24.webp`),
        );
    });

    it('lowercases the vault address in the written file name', async () => {
        const deps = createDeps();
        deps.fetchYieldVaults.mockResolvedValue({
            base: [
                vault({
                    address: BASE_USDC_VAULT.toUpperCase().replace('0X', '0x'),
                    underlyingToken: BASE_USDC,
                    coingeckoId: 'usd-coin',
                }),
            ],
        });

        await createDownloadVaultIcons(deps)();

        expect(writtenFiles(deps)).toContain(
            join(FILES_CRYPTOICONS_PATH, `base--${BASE_USDC_VAULT}@24.webp`),
        );
    });

    it('skips and reports a platform with no known network, still processing the rest', async () => {
        const deps = createDeps();
        deps.fetchYieldVaults.mockResolvedValue({
            'brand-new-chain': [
                vault({
                    address: '0xabc',
                    underlyingToken: '0xdef',
                    coingeckoId: 'usd-coin',
                }),
            ],
            ethereum: [
                vault({
                    address: ETH_USDT_VAULT,
                    underlyingToken: ETH_USDT,
                    coingeckoId: 'tether',
                }),
            ],
        });

        await createDownloadVaultIcons(deps)();

        expect(deps.logger.error).toHaveBeenCalledWith(
            expect.stringContaining('brand-new-chain'),
            expect.anything(),
        );
        expect(deps.writeFile).toHaveBeenCalledTimes(COIN_IMAGE_SIZES.length);
        expect(writtenFiles(deps).every(path => path.includes('ethereum--'))).toBe(true);
    });

    it('skips sizes whose source icon is not published and writes the remaining ones', async () => {
        const deps = createDeps();
        deps.fetchYieldVaults.mockResolvedValue({
            ethereum: [
                vault({
                    address: ETH_USDT_VAULT,
                    underlyingToken: ETH_USDT,
                    coingeckoId: 'tether',
                }),
            ],
        });

        deps.fetchPublishedIcon.mockImplementation(fileName =>
            fileName.endsWith('@80.webp')
                ? Promise.reject(new Error('Icon is not published'))
                : Promise.resolve(publishedIcon),
        );

        await createDownloadVaultIcons(deps)();

        expect(deps.writeFile).toHaveBeenCalledTimes(COIN_IMAGE_SIZES.length - 1);
        expect(writtenFiles(deps)).not.toContain(
            join(FILES_CRYPTOICONS_PATH, `ethereum--${ETH_USDT_VAULT}@80.webp`),
        );
        expect(deps.logger.error).toHaveBeenCalled();
    });

    it('downloads each source rendition once when several vaults share an underlying', async () => {
        const deps = createDeps();
        deps.fetchYieldVaults.mockResolvedValue({
            ethereum: [
                vault({
                    address: ETH_USDC_VAULT,
                    underlyingToken: ETH_USDC,
                    coingeckoId: 'usd-coin',
                }),
            ],
            base: [
                vault({
                    address: BASE_USDC_VAULT,
                    underlyingToken: BASE_USDC,
                    coingeckoId: 'usd-coin',
                }),
            ],
        });

        await createDownloadVaultIcons(deps)();

        // Both vaults resolve to usd-coin, so each source size is fetched once.
        expect(deps.fetchPublishedIcon).toHaveBeenCalledTimes(COIN_IMAGE_SIZES.length);
        expect(deps.writeFile).toHaveBeenCalledTimes(2 * COIN_IMAGE_SIZES.length);
    });

    it('renders a shared bundled disc once for vaults across platforms', async () => {
        const deps = createDeps();
        deps.isWrappedNativeToken.mockReturnValue(true);
        deps.fetchYieldVaults.mockResolvedValue({
            ethereum: [
                vault({
                    address: ETH_WETH_VAULT,
                    underlyingToken: 'wrapped-native',
                    coingeckoId: 'weth',
                }),
            ],
            base: [
                vault({
                    address: BASE_WETH_VAULT,
                    underlyingToken: 'wrapped-native',
                    coingeckoId: 'l2-standard-bridged-weth-base',
                }),
            ],
        });

        await createDownloadVaultIcons(deps)();

        // Both vaults read as native ETH, so nothing beyond the vault list is fetched and the two
        // vault addresses end up with byte-identical renditions.
        expect(deps.fetchPublishedIcon).not.toHaveBeenCalled();
        expect(deps.writeFile).toHaveBeenCalledTimes(2 * COIN_IMAGE_SIZES.length);
        expect(deps.readFile).toHaveBeenCalledTimes(COIN_IMAGE_SIZES.length);
        expect(deps.rasterizeSvg).toHaveBeenCalledTimes(COIN_IMAGE_SIZES.length);
        expect(writtenIcon(deps, `base--${BASE_WETH_VAULT}@80.webp`)).toEqual(
            writtenIcon(deps, `ethereum--${ETH_WETH_VAULT}@80.webp`),
        );
    });

    it('throws when the vault list cannot be fetched', async () => {
        const deps = createDeps();
        deps.fetchYieldVaults.mockRejectedValue(new Error('Vault list unavailable'));

        await expect(createDownloadVaultIcons(deps)()).rejects.toThrow();
        expect(deps.writeFile).not.toHaveBeenCalled();
    });
});
