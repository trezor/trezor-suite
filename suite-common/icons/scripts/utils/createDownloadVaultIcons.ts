import { join } from 'path';

import { isResponseError } from '@suite-common/http-client';
import type {
    GetIconPathsDep,
    GetNetworkByCoingeckoIdDep,
    IsSupportedNetworkDep,
    IsWrappedNativeTokenDep,
    NetworkMetadata,
} from '@suite-common/networks';
import type { NetworkSymbol } from '@trezor/network-module-types';
import type { MkdirDep, ReadFileDep, WriteFileDep } from '@trezor/type-utils';

import type {
    FetchPublishedIconDep,
    FetchYieldVaultsDep,
    IconsLoggerDep,
} from './createVaultIconsClient';
import type { RasterizeSvgDep } from './images';
import { COIN_IMAGE_SIZES, type CoinImageSize, createCoinImageName } from '../../src/coinImages';
import { FILES_CRYPTOICONS_PATH } from '../constants';
import type { YieldVault } from '../schemas';

/**
 * Where the icon of the asset a vault is denominated in comes from: either an already published
 * CoinGecko rendition, or — for a native coin — the bundled design-system disc the apps render
 * themselves instead of the CoinGecko one.
 */
type VaultIconSource =
    { kind: 'published'; coingeckoId: string } | { kind: 'bundled'; networkSymbol: NetworkSymbol };

export type DownloadVaultIconsDeps = GetNetworkByCoingeckoIdDep &
    GetIconPathsDep &
    IsSupportedNetworkDep &
    IsWrappedNativeTokenDep &
    ReadFileDep &
    RasterizeSvgDep &
    WriteFileDep &
    MkdirDep &
    FetchYieldVaultsDep &
    FetchPublishedIconDep &
    IconsLoggerDep;

export type DownloadVaultIcons = () => Promise<void>;

export type DownloadVaultIconsDep = { downloadVaultIcons: DownloadVaultIcons };

export const createDownloadVaultIcons = (deps: DownloadVaultIconsDeps): DownloadVaultIcons => {
    /**
     * A vault-position token renders as the asset the vault is denominated in — except that a
     * wrapped-native underlying reads as the native coin: a WETH vault is an ETH vault. On an L2 the
     * native coin is the settlement layer's, so ETH is resolved through `settlementLayer` rather than
     * from the L2 itself.
     */
    const resolveIconSource = (
        network: NetworkMetadata,
        vault: YieldVault,
    ): VaultIconSource | undefined => {
        if (!deps.isWrappedNativeToken(network.symbol, vault.underlyingToken)) {
            return { kind: 'published', coingeckoId: vault.coingeckoId };
        }

        const nativeSymbol = network.settlementLayer ?? network.symbol;
        if (!deps.isSupportedNetwork(nativeSymbol)) return undefined;

        // `TokenIcon` resolves a native coin the same way and renders it through `NativeTokenIcon`, so
        // deriving the vault icon from any other source would make it differ from the coin it stands
        // for everywhere else in the app.
        return { kind: 'bundled', networkSymbol: nativeSymbol };
    };

    const fetchPublishedSourceIcon = async (
        coingeckoId: string,
        size: CoinImageSize,
    ): Promise<Buffer | undefined> => {
        const fileName = createCoinImageName({ coingeckoId, size });

        try {
            return Buffer.from(await deps.fetchPublishedIcon(fileName));
        } catch (error) {
            if (isResponseError(error)) {
                deps.logger.error(
                    'Vault icons: source icon is not published:',
                    fileName,
                    error.status,
                );
            } else {
                deps.logger.error('Vault icons: failed to fetch source icon:', fileName, error);
            }

            return undefined;
        }
    };

    const renderBundledSourceIcon = async (
        networkSymbol: NetworkSymbol,
        size: CoinImageSize,
    ): Promise<Buffer | undefined> => {
        try {
            const path = deps.getIconPaths(networkSymbol).coin;
            const svg = await deps.readFile(path);

            return await deps.rasterizeSvg(svg, size);
        } catch (error) {
            deps.logger.error(
                'Vault icons: failed to render the bundled icon:',
                networkSymbol,
                error,
            );

            return undefined;
        }
    };

    const loadSourceIcon = (source: VaultIconSource, size: CoinImageSize) =>
        source.kind === 'bundled'
            ? renderBundledSourceIcon(source.networkSymbol, size)
            : fetchPublishedSourceIcon(source.coingeckoId, size);

    const sourceIconKey = (source: VaultIconSource, size: CoinImageSize) =>
        source.kind === 'bundled'
            ? `bundled:${source.networkSymbol}@${size}`
            : createCoinImageName({ coingeckoId: source.coingeckoId, size });

    /**
     * Derives icons for yield-vault position tokens. The vault contracts are not listed on CoinGecko
     * (and even if they were, they would carry the vault operator's branding), so the main
     * CoinGecko-driven pipeline never produces them — instead, write the icon of the asset the vault is
     * denominated in under each vault-address file name.
     */
    return async () => {
        const vaults = await deps.fetchYieldVaults();
        await deps.mkdir(FILES_CRYPTOICONS_PATH, { recursive: true });

        // The same underlying backs vaults on several platforms, so load each source rendition once.
        const sourceIconCache = new Map<string, Buffer | undefined>();
        const savedIcons: string[] = [];

        for (const [assetPlatformId, platformVaults] of Object.entries(vaults)) {
            if (platformVaults.length === 0) {
                continue;
            }

            const network = deps.getNetworkByCoingeckoId(assetPlatformId);
            if (!network) {
                deps.logger.error(
                    `Vault icons: no network known for CoinGecko asset platform "${assetPlatformId}", skipping its vaults:`,
                    platformVaults.map(vault => vault.yieldId),
                );
                continue;
            }

            for (const vault of platformVaults) {
                const source = resolveIconSource(network, vault);
                if (!source) {
                    deps.logger.error(
                        `Vault icons: no source coin resolved for "${vault.yieldId}", skipping it:`,
                        vault.address,
                    );
                    continue;
                }

                for (const size of COIN_IMAGE_SIZES) {
                    const cacheKey = sourceIconKey(source, size);
                    if (!sourceIconCache.has(cacheKey)) {
                        sourceIconCache.set(cacheKey, await loadSourceIcon(source, size));
                    }

                    const imageBuffer = sourceIconCache.get(cacheKey);
                    if (!imageBuffer) {
                        continue;
                    }

                    // All vault platforms are EVM chains, where Suite requests icons by the lowercased
                    // contract address.
                    const fileName = createCoinImageName({
                        coingeckoId: assetPlatformId,
                        contractAddress: vault.address.toLowerCase(),
                        size,
                    });

                    await deps.writeFile(join(FILES_CRYPTOICONS_PATH, fileName), imageBuffer);
                    savedIcons.push(fileName);
                }
            }
        }

        deps.logger.log(`Vault icons: 🟢 Saved ${savedIcons.length} files:\n`, savedIcons);
    };
};
