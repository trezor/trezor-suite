/* eslint-disable no-console */
import { createHash } from 'crypto';
import fs from 'fs/promises';
import { join } from 'path';
// eslint-disable-next-line import/no-extraneous-dependencies
import sharp from 'sharp';

import {
    FILES_CRYPTOICONS_PATH,
    RATE_LIMIT_PER_MINUTE,
    RUN_LIMIT_SECONDS,
    UPDATED_ICONS_LIST_FILE,
} from './constants';
import {
    COIN_IMAGE_SIZES,
    IMAGE_EXTENSION,
    IMAGE_SIZE_SEPARATOR,
    createCoinImageName,
} from '../src/coinImages';
import { downloadVaultIcons } from './utils/downloadVaultIcons';
import {
    fetchCoinList,
    fetchUpdatedIconsList,
    getCoinData,
    getCoinMarketImageUrls,
} from './utils/fetchCoins';
import { sleep } from './utils/sleep';

async function writeImage(fileName: string, imageBuffer: Buffer) {
    const destinationFile = join(FILES_CRYPTOICONS_PATH, fileName);

    await fs.writeFile(destinationFile, Buffer.from(imageBuffer));
}

async function resizeImage(imageBuffer: ArrayBuffer, size: number) {
    const resizedImage = sharp(imageBuffer).resize(size, size);

    const fullQualityImageBuffer = await resizedImage.webp({ quality: 100 }).toBuffer();
    const lossLessImageBuffer = await resizedImage.clone().webp({ lossless: true }).toBuffer();

    // sometimes lossless image is much smaller than 100 quality compressed image
    return fullQualityImageBuffer.byteLength < lossLessImageBuffer.byteLength
        ? fullQualityImageBuffer
        : lossLessImageBuffer;
}

function isValidUrl(url: string): boolean {
    try {
        new URL(url);

        return true;
    } catch {
        return false;
    }
}

// Fingerprint of the files updateIcon derives from a single coin: one icon per platform contract,
// in every image size. Changing either input means new file names, so the coin has to be
// reprocessed even when its source image stayed the same.
function getOutputsHash(platforms: Record<string, string>) {
    const sortedPlatforms = Object.entries(platforms).sort(([a], [b]) => (a < b ? -1 : 1));

    // We don't need a cryptographically secure hash here, just a unique fingerprint of the output file set.
    return (
        createHash('sha1')
            .update(JSON.stringify([sortedPlatforms, COIN_IMAGE_SIZES]))
            .digest('hex')
            // Keep the size of icons.json small. It's better to miss sometime (but extremely rarely) than to serve a large file to every client.
            .slice(0, 16)
    );
}

// Returns true only if the icon was written successfully, so the caller can persist the
// fingerprints (and thereby skip this coin next run) exclusively on success.
const updateIcon = async (
    logPrefix: string,
    coinId: string,
    imageUrl: string,
    coinPlatforms: Record<string, string>,
): Promise<boolean> => {
    try {
        if (!isValidUrl(imageUrl)) {
            console.error(logPrefix, `Invalid url:`, imageUrl);

            return false;
        }

        console.log(logPrefix, `⏳ Fetching`, imageUrl);
        const originImage = await fetch(imageUrl);
        if (!originImage.ok) {
            console.error(
                logPrefix,
                `Invalid image:`,
                imageUrl,
                originImage.status,
                originImage.statusText,
            );

            return false;
        }

        const originImageBuffer = await originImage.arrayBuffer();
        const platforms = Object.entries(coinPlatforms);
        const iconNames = new Set<string>();

        for (const size of COIN_IMAGE_SIZES) {
            const finalImageBuffer = await resizeImage(originImageBuffer, size);

            for (const [coingeckoId, contractAddress] of platforms) {
                const fileName = createCoinImageName({ coingeckoId, contractAddress, size });
                await writeImage(fileName, finalImageBuffer);
                iconNames.add(fileName.split(IMAGE_SIZE_SEPARATOR)[0]!);
            }

            const fileName = createCoinImageName({ coingeckoId: coinId, size });
            await writeImage(fileName, finalImageBuffer);
            iconNames.add(fileName.split(IMAGE_SIZE_SEPARATOR)[0]!);
        }

        console.log(
            logPrefix,
            `🟢 Saved:\n`,
            JSON.stringify(
                Array.from(iconNames).map(iconName =>
                    `${iconName}${IMAGE_SIZE_SEPARATOR}{${COIN_IMAGE_SIZES.join(',')}}${IMAGE_EXTENSION}`.trim(),
                ),
                null,
                2,
            ),
        );

        return true;
    } catch (error) {
        console.error(logPrefix, `🔴 Error:`, error);

        return false;
    }
};

async function ensureDirectoryExists(path: string) {
    try {
        await fs.access(path);
    } catch {
        await fs.mkdir(path, { recursive: true });
    }
}

(async () => {
    const previousIcons = await fetchUpdatedIconsList();

    const startedAt = Date.now();
    const coins = await fetchCoinList();
    if (coins.length === 0) {
        throw new Error('No coins found');
    } else {
        console.log(new Date().toISOString(), 'Total coins in coin list:', coins.length);
    }

    // Image urls in bulk (~250 coins/request) instead of one /coins/{id} request per coin.
    // Only coins with market data are covered here; the rest fall back to getCoinData below.
    const marketImageUrls = await getCoinMarketImageUrls();
    console.log(new Date().toISOString(), 'Total market image urls fetched:', marketImageUrls.size);

    // Drop the entries of coins that are no longer listed. Without pruning, the checkpoint keeps
    // every coin CoinGecko has ever listed, which inflates the file and skews the counts below.
    const listedCoinIds = new Set(coins.map(coin => coin.id));
    const updatedIcons = Object.fromEntries(
        Object.entries(previousIcons).filter(([coinId]) => listedCoinIds.has(coinId)),
    );
    const prunedIconsCount = Object.keys(previousIcons).length - Object.keys(updatedIcons).length;

    // process missing icons and icons updated the longest time ago first
    coins.sort(
        (a, b) => (updatedIcons[a.id]?.updatedAt ?? 0) - (updatedIcons[b.id]?.updatedAt ?? 0),
    );

    const newIconsCount = coins.filter(coin => !updatedIcons[coin.id]).length;

    console.log(
        `Total coins: ${coins.length}, new icons: ${newIconsCount}, delisted icons pruned: ${prunedIconsCount}, market image urls: ${marketImageUrls.size}`,
    );

    await ensureDirectoryExists(FILES_CRYPTOICONS_PATH);

    for (let i = 0; i < coins.length; i++) {
        const logPrefix = `${i + 1}/${coins.length} ${coins[i]?.id}:`;

        if (Date.now() - startedAt > RUN_LIMIT_SECONDS * 1000) {
            console.log(logPrefix, `Run limit reached`);
            break;
        }

        const coin = coins[i];
        if (!coin) {
            continue;
        }

        let imageUrl = marketImageUrls.get(coin.id);
        let platforms = coin.platforms ?? {};

        // Tail coins (no market data) are absent from /coins/markets — fall back to the
        // per-coin endpoint. This is the only remaining rate-limited call in the loop.
        if (!imageUrl) {
            console.log(logPrefix, `No market image url, falling back to /coins/{id} endpoint`);
            const apiCallDelay = Math.ceil((60 / RATE_LIMIT_PER_MINUTE) * 1000);

            await sleep(apiCallDelay);
            try {
                const coinData = await getCoinData(coin.id);
                imageUrl = coinData?.image?.large ?? undefined;
                if (Object.keys(platforms).length === 0 && coinData?.platforms) {
                    platforms = coinData.platforms;
                }
            } catch (error) {
                console.error(logPrefix, `Failed to fetch coin data (${coin.id}):`, error);
            }
        }

        if (!imageUrl) {
            console.error(logPrefix, `No image url.`);
            continue;
        }

        // Skip coins whose source image and derived file set are both unchanged since the last
        // successful run.
        const outputsHash = getOutputsHash(platforms);
        const previousIcon = updatedIcons[coin.id];

        if (previousIcon?.imageUrl === imageUrl && previousIcon?.outputsHash === outputsHash) {
            console.log(logPrefix, `Skipping unchanged icon.`);
            continue;
        }

        const success = await updateIcon(logPrefix, coin.id, imageUrl, platforms);

        updatedIcons[coin.id] = {
            updatedAt: Math.floor(Date.now() / 1000),
            // Only fingerprint on success so a failed coin is retried on the next run.
            ...(success ? { imageUrl, outputsHash } : {}),
        };
    }

    // Vault-position tokens are derived from other icons rather than fetched from CoinGecko —
    // see downloadVaultIcons. A failure there must not discard the CoinGecko icons already
    // produced by this run, so it only logs.
    try {
        await downloadVaultIcons();
    } catch (error) {
        console.error('Vault icons: 🔴 Error:', error);
    }

    console.log('All icons processed, writing updated icons list');
    await fs.writeFile(UPDATED_ICONS_LIST_FILE, JSON.stringify(updatedIcons, null, 2));
})();
