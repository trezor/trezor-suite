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
import { getCoinData, getCoinList, getUpdatedIconsList } from './utils/fetchCoins';
import { sleep } from './utils/sleep';
import {
    COIN_IMAGE_QUALITIES,
    COIN_IMAGE_SIZES,
    createCoinImageName,
    createCoinImageNameLegacy,
} from '../src/coinImages';

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

const updateIcon = async (coin: CoinListData) => {
    console.log('Start icon updating for:', coin.id);

    const coinData = await getCoinData(coin.id);
    if (!coinData) {
        console.error('No coin data for:', coin.id);

        return;
    }

    try {
        new URL(coinData.image.large);
    } catch {
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

    try {
        const originImageBuffer = await originImage.arrayBuffer();
        const platforms = Object.entries(coinData.platforms).filter(
            // filter out platforms that don't have a contract address (e.g. KASPY had instead of contract address some debug message which caused "too long name" error)
            ([platform, contract]) => platform && contract && contract.startsWith('0x'),
        );

        for (const size of COIN_IMAGE_SIZES) {
            const finalImageBuffer = await resizeImage(originImageBuffer, size);

            for (const quality of COIN_IMAGE_QUALITIES) {
                for (const [platform, contract] of platforms) {
                    const name = `${platform}--${contract}`;

                    const fileName = createCoinImageName(name, { size, quality });
                    console.log(`Writing image (${coin.id}):`, fileName);
                    await writeImage(fileName, finalImageBuffer);

                    // Make sure it's backwards compatible for older versions of the Trezor Suite
                    if (size === 24) {
                        const fileNameLegacy = createCoinImageNameLegacy(name, quality);
                        console.log(`Writing image - legacy (${coin.id}):`, fileNameLegacy);
                        await writeImage(fileNameLegacy, finalImageBuffer);
                    }
                }

                const name = coinData.id;

                const fileName = createCoinImageName(name, { size, quality });
                console.log(`Writing image (${coin.id}):`, fileName);
                await writeImage(fileName, finalImageBuffer);

                // Make sure it's backwards compatible for older versions of the Trezor Suite
                if (size === 24) {
                    const fileNameLegacy = createCoinImageNameLegacy(name, quality);
                    console.log(`Writing image - legacy (${coin.id}):`, fileNameLegacy);
                    await writeImage(fileNameLegacy, finalImageBuffer);
                }
            }
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

    await ensureDirectoryExists(FILES_CRYPTOICONS_PATH);

    for (const coin of coins) {
        await updateIcon(coin);

        updatedIcons[coin.id] = {
            updatedAt: Math.floor(Date.now() / 1000),
        };

        await fs.writeFile(UPDATED_ICONS_LIST_FILE, JSON.stringify(updatedIcons, null, 2));

        if (Date.now() - startedAt > RUN_LIMIT_SECONDS * 1000) {
            console.log('Run limit reached');
            break;
        }

        await sleep(Math.ceil((60 / RATE_LIMIT_PER_MINUTE) * 1000));
    }
})();
