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
import { CoinListData } from './types';
import {
    COIN_IMAGE_SIZES,
    LEGACY_COIN_IMAGE_SIZES,
    createCoinImageName,
    createCoinImageNameLegacy,
} from '../src/coinImages';
import { getCoinData, getCoinList, getUpdatedIconsList } from './utils/fetchCoins';
import { sleep } from './utils/sleep';

async function writeImage(fileName: string, imageBuffer: Buffer) {
    const destinationFile = join(FILES_CRYPTOICONS_PATH, fileName);

    await fs.writeFile(destinationFile, Buffer.from(imageBuffer));
}

async function resizeImage(imageBuffer: ArrayBuffer, size: number) {
    const fullQualityImageBuffer = await sharp(imageBuffer)
        .resize(size, size)
        .webp({ quality: 100 })
        .toBuffer();

    const lossLessImageBuffer = await sharp(imageBuffer)
        .resize(size, size)
        .webp({ lossless: true })
        .toBuffer();

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

const updateIcon = async (coin: CoinListData) => {
    try {
        const coinData = await getCoinData(coin.id);
        if (!coinData) {
            console.error('No coin data for:', coin.id);

            return;
        }

        if (!isValidUrl(coinData.image.large)) {
            console.error(`Invalid url (${coin.id}):`, coinData.image.large);

            return;
        }

        const originImage = await fetch(coinData.image.large);
        if (!originImage.ok) {
            console.error(
                `Invalid image (${coin.id}):`,
                coinData.image.large,
                originImage.status,
                originImage.statusText,
            );

            return;
        }

        const originImageBuffer = await originImage.arrayBuffer();
        const platforms = Object.entries(coinData.platforms).filter(
            ([platform, contract]) => platform && contract,
        );

        // Legacy naming – Make sure it's backwards compatible for older versions of the Trezor Suite
        for (const size of LEGACY_COIN_IMAGE_SIZES) {
            const finalImageBuffer = await resizeImage(originImageBuffer, size);

            const fileNameLegacy = createCoinImageNameLegacy({ coingeckoId: coinData.id, size });
            console.log(`[legacy] Writing image (${coin.id}):`, fileNameLegacy);
            await writeImage(fileNameLegacy, finalImageBuffer);

            for (const [coingeckoId, contractAddress] of platforms) {
                const fileNameLegacyPlatform = createCoinImageNameLegacy({
                    coingeckoId,
                    contractAddress,
                    size,
                });
                console.log(`[legacy] Writing image (${coin.id}):`, fileNameLegacyPlatform);
                await writeImage(fileNameLegacyPlatform, finalImageBuffer);
            }
        }

        // New naming
        for (const size of COIN_IMAGE_SIZES) {
            const finalImageBuffer = await resizeImage(originImageBuffer, size);

            for (const [coingeckoId, contractAddress] of platforms) {
                const fileName = createCoinImageName({ coingeckoId, contractAddress, size });
                console.log(`Writing image (${coin.id}):`, fileName);
                await writeImage(fileName, finalImageBuffer);
            }

            const fileName = createCoinImageName({ coingeckoId: coinData.id, size });
            console.log(`Writing image (${coin.id}):`, fileName);
            await writeImage(fileName, finalImageBuffer);
        }
    } catch (error) {
        console.error(`Error (${coin.id}):`, error);
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
    const startedAt = Date.now();
    const updatedIcons = (await getUpdatedIconsList()) ?? {};

    const coins = await getCoinList();
    if (!coins || coins.length === 0) {
        throw new Error('No coins found');
    }

    // process missing icons and icons updated the longest time ago first
    coins.sort(
        (a, b) => (updatedIcons[a.id]?.updatedAt ?? 0) - (updatedIcons[b.id]?.updatedAt ?? 0),
    );

    const newIconsCount = coins.length - Object.keys(updatedIcons).length;

    console.log(`Total coins: ${coins.length}, new icons: ${newIconsCount}`);

    await ensureDirectoryExists(FILES_CRYPTOICONS_PATH);

    for (let i = 0; i < coins.length; i++) {
        const coin = coins[i];
        if (!coin) {
            continue;
        }

        console.log(`${i + 1}/${coins.length}: Start icon updating for ${coin.id}`);
        await updateIcon(coin);

        updatedIcons[coin.id] = {
            updatedAt: Math.floor(Date.now() / 1000),
        };

        await fs.writeFile(UPDATED_ICONS_LIST_FILE, JSON.stringify(updatedIcons, null, 2));

        if (Date.now() - startedAt > RUN_LIMIT_SECONDS * 1000) {
            console.log(`${i + 1 / coins.length}: Run limit reached`);
            break;
        }

        await sleep(Math.ceil((60 / RATE_LIMIT_PER_MINUTE) * 1000));
    }
})();
