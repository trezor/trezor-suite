/* eslint-disable no-console */
import fs from 'fs/promises';
import { join } from 'path';
import { z } from 'zod';

import { createHttpClient, isResponseError } from '@suite-common/http-client';
import {
    type Network,
    getNetwork,
    getNetworkByCoingeckoId,
    isWrappedNativeToken,
} from '@suite-common/wallet-config';

import { rasterizeSvg } from './images';
import {
    COIN_IMAGE_SIZES,
    type CoinImageSize,
    ICONS_URL_BASE,
    createCoinImageName,
} from '../../src/coinImages';
import { type NetworkIconSymbol } from '../../src/iconSymbols';
import { isCryptoIconSymbol } from '../../src/iconUtils';
import { CRYPTO_ICONS_SVG_PATH, FILES_CRYPTOICONS_PATH, YIELD_VAULTS_URL } from '../constants';
import { type YieldVault, yieldVaultsSchema } from '../schemas';

const earnYieldApi = createHttpClient({
    onError: error => {
        console.error('Vault icons: error fetching yield vaults:', error);
    },
});

const fetchYieldVaults = earnYieldApi(YIELD_VAULTS_URL, {
    method: 'GET',
    schema: yieldVaultsSchema,
});

// Errors are handled per icon by the caller (a missing rendition only skips that one file), so this
// client stays silent instead of logging every expected 404 twice.
const iconsCdnApi = createHttpClient({});

const fetchPublishedIcon = (fileName: string) =>
    iconsCdnApi(`${ICONS_URL_BASE}/${fileName}`, {
        method: 'GET',
        parseResponse: response => response.arrayBuffer(),
        schema: z.instanceof(ArrayBuffer),
        // The CDN is the source of every vault icon, so ride out a transient 5xx rather than
        // silently leaving the icon unpublished until the next nightly run.
        retry: {
            attempts: 2,
            delay: 1000,
            when: ({ response }) => (response?.status ?? 0) >= 500,
        },
    })();

/**
 * Where the icon of the asset a vault is denominated in comes from: either an already published
 * CoinGecko rendition, or — for a native coin — the bundled design-system disc the apps render
 * themselves instead of the CoinGecko one.
 */
type VaultIconSource =
    | { kind: 'published'; coingeckoId: string }
    | { kind: 'bundled'; networkSymbol: NetworkIconSymbol };

/**
 * A vault-position token renders as the asset the vault is denominated in — except that a
 * wrapped-native underlying reads as the native coin: a WETH vault is an ETH vault. On an L2 the
 * native coin is the settlement layer's, so ETH is resolved through `settlementLayer` rather than
 * from the L2 itself.
 */
const resolveIconSource = (network: Network, vault: YieldVault): VaultIconSource | undefined => {
    if (!isWrappedNativeToken(network.symbol, vault.underlyingToken)) {
        return { kind: 'published', coingeckoId: vault.coingeckoId };
    }

    const nativeSymbol = network.settlementLayer ?? network.symbol;

    // `TokenIcon` resolves a native coin the same way and renders it through `NativeTokenIcon`, so
    // deriving the vault icon from any other source would make it differ from the coin it stands
    // for everywhere else in the app.
    if (isCryptoIconSymbol(nativeSymbol)) {
        return { kind: 'bundled', networkSymbol: nativeSymbol };
    }

    const coingeckoId = getNetwork(nativeSymbol).tradeCryptoId;

    return coingeckoId ? { kind: 'published', coingeckoId } : undefined;
};

const fetchPublishedSourceIcon = async (
    coingeckoId: string,
    size: CoinImageSize,
): Promise<Buffer | undefined> => {
    const fileName = createCoinImageName({ coingeckoId, size });

    try {
        return Buffer.from(await fetchPublishedIcon(fileName));
    } catch (error) {
        if (isResponseError(error)) {
            console.error('Vault icons: source icon is not published:', fileName, error.status);
        } else {
            console.error('Vault icons: failed to fetch source icon:', fileName, error);
        }

        return undefined;
    }
};

const renderBundledSourceIcon = async (
    networkSymbol: NetworkIconSymbol,
    size: CoinImageSize,
): Promise<Buffer | undefined> => {
    const svgPath = join(CRYPTO_ICONS_SVG_PATH, `${networkSymbol}.svg`);

    try {
        return await rasterizeSvg(await fs.readFile(svgPath), size);
    } catch (error) {
        console.error('Vault icons: failed to render the bundled icon:', svgPath, error);

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
export const downloadVaultIcons = async (): Promise<void> => {
    const vaults = await fetchYieldVaults();

    // The same underlying backs vaults on several platforms, so load each source rendition once.
    const sourceIconCache = new Map<string, Buffer | undefined>();
    const savedIcons: string[] = [];

    for (const [assetPlatformId, platformVaults] of Object.entries(vaults)) {
        if (platformVaults.length === 0) {
            continue;
        }

        const network = getNetworkByCoingeckoId(assetPlatformId);
        if (!network) {
            console.error(
                `Vault icons: no network known for CoinGecko asset platform "${assetPlatformId}", skipping its vaults:`,
                platformVaults.map(vault => vault.yieldId),
            );
            continue;
        }

        for (const vault of platformVaults) {
            const source = resolveIconSource(network, vault);
            if (!source) {
                console.error(
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

                await fs.writeFile(join(FILES_CRYPTOICONS_PATH, fileName), imageBuffer);
                savedIcons.push(fileName);
            }
        }
    }

    console.log(`Vault icons: 🟢 Saved ${savedIcons.length} files:\n`, savedIcons);
};
