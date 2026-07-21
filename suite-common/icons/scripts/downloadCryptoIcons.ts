/* eslint-disable no-console */
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
import { COIN_IMAGE_SIZES, createCoinImageName } from '../src/coinImages';
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

// Returns true only if the icon was written successfully, so the caller can persist the
// image-url fingerprint (and thereby skip this coin next run) exclusively on success.
const updateIcon = async (
    coinId: string,
    imageUrl: string,
    coinPlatforms: Record<string, string>,
): Promise<boolean> => {
    try {
        if (!isValidUrl(imageUrl)) {
            console.error(`Invalid url (${coinId}):`, imageUrl);

            return false;
        }

        const originImage = await fetch(imageUrl);
        if (!originImage.ok) {
            console.error(
                `Invalid image (${coinId}):`,
                imageUrl,
                originImage.status,
                originImage.statusText,
            );

            return false;
        }

        const originImageBuffer = await originImage.arrayBuffer();
        const platforms = Object.entries(coinPlatforms);

        for (const size of COIN_IMAGE_SIZES) {
            const finalImageBuffer = await resizeImage(originImageBuffer, size);

            for (const [coingeckoId, contractAddress] of platforms) {
                const fileName = createCoinImageName({ coingeckoId, contractAddress, size });
                console.log(`Writing image (${coinId}):`, fileName);
                await writeImage(fileName, finalImageBuffer);
            }

            const fileName = createCoinImageName({ coingeckoId: coinId, size });
            console.log(`Writing image (${coinId}):`, fileName);
            await writeImage(fileName, finalImageBuffer);
        }

        return true;
    } catch (error) {
        console.error(`Error (${coinId}):`, error);

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
    const updatedIcons = await fetchUpdatedIconsList();

    const startedAt = Date.now();
    const coins = await fetchCoinList();
    if (coins.length === 0) {
        throw new Error('No coins found');
    } else {
        console.log('Total coins in coin list:', coins.length);
    }

    // Image urls in bulk (~250 coins/request) instead of one /coins/{id} request per coin.
    // Only coins with market data are covered here; the rest fall back to getCoinData below.
    const marketImageUrls = await getCoinMarketImageUrls();
    console.log('Total market image urls fetched:', marketImageUrls.size);

    // process missing icons and icons updated the longest time ago first
    coins.sort(
        (a, b) => (updatedIcons[a.id]?.updatedAt ?? 0) - (updatedIcons[b.id]?.updatedAt ?? 0),
    );

    const newIconsCount = coins.length - Object.keys(updatedIcons).length;

    console.log(
        `Total coins: ${coins.length}, new icons: ${newIconsCount}, market image urls: ${marketImageUrls.size}`,
    );

    await ensureDirectoryExists(FILES_CRYPTOICONS_PATH);

    for (let i = 0; i < coins.length; i++) {
        if (Date.now() - startedAt > RUN_LIMIT_SECONDS * 1000) {
            console.log(`${i + 1}/${coins.length}: Run limit reached`);
            break;
        }

        const coin = coins[i];
        if (!coin) {
            continue;
        }

        console.log(`${i + 1}/${coins.length}: Start icon updating for ${coin.id}`);

        let imageUrl = marketImageUrls.get(coin.id);
        let platforms = coin.platforms ?? {};

        // Tail coins (no market data) are absent from /coins/markets — fall back to the
        // per-coin endpoint. This is the only remaining rate-limited call in the loop.
        if (!imageUrl) {
            const apiCallDelay = Math.ceil((60 / RATE_LIMIT_PER_MINUTE) * 1000);

            await sleep(apiCallDelay);
            try {
                const coinData = await getCoinData(coin.id);
                imageUrl = coinData?.image?.large ?? undefined;
                if (Object.keys(platforms).length === 0 && coinData?.platforms) {
                    platforms = coinData.platforms;
                }
            } catch (error) {
                console.error(`Failed to fetch coin data (${coin.id}):`, error);
            }
        }

        if (!imageUrl) {
            console.error(`No image url for: ${coin.id}`);
            continue;
        }

        // Skip coins whose source image is unchanged since the last successful run.
        if (updatedIcons[coin.id]?.imageUrl === imageUrl) {
            console.log(`${i + 1}/${coins.length}: Skipping unchanged icon for ${coin.id}`);
            continue;
        }

        const success = await updateIcon(coin.id, imageUrl, platforms);

        updatedIcons[coin.id] = {
            updatedAt: Math.floor(Date.now() / 1000),
            // Only fingerprint on success so a failed coin is retried on the next run.
            ...(success ? { imageUrl } : {}),
        };

        await fs.writeFile(UPDATED_ICONS_LIST_FILE, JSON.stringify(updatedIcons, null, 2));
    }
})();
