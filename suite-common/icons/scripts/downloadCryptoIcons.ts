/* eslint-disable no-console */
import sharp from 'sharp';
import fs from 'fs';
import { join } from 'path';

import {
    COIN_IMAGE_SIZES,
    UPDATED_ICONS_LIST_FILE,
    FILES_CRYPTOICONS_PATH,
    RATE_LIMIT_PER_MINUTE,
    RUN_LIMIT_SECONDS,
} from './constants';
import { CoinListData } from './types';
import { getCoinData, getCoinList, getUpdatedIconsList } from './utils/fetchCoins';
import { sleep } from './utils/sleep';

const updateIcon = async (coin: CoinListData) => {
    console.log('Start icon updating for:', coin.id);

    const coinData = await getCoinData(coin.id);
    if (!coinData) {
        console.error('No coin data for:', coin.id);

        return;
    }

    try {
        new URL(coinData.image.large);
    } catch (error) {
        console.error('Invalid url:', coinData.image.large);

        return;
    }

    const originImage = await fetch(coinData.image.large);
    if (!originImage.ok) {
        console.error(
            'Invalid image:',
            coinData.image.large,
            originImage.status,
            originImage.statusText,
        );

        return;
    }

    try {
        const originImageBuffer = await originImage.arrayBuffer();

        for (const [size, COIN_IMAGE_SIZE] of Object.entries(COIN_IMAGE_SIZES)) {
            const fullQualityImageBuffer = await sharp(originImageBuffer)
                .resize(COIN_IMAGE_SIZE, COIN_IMAGE_SIZE)
                .webp({ quality: 100 })
                .toBuffer();

            const lossLessImageBuffer = await sharp(originImageBuffer)
                .resize(COIN_IMAGE_SIZE, COIN_IMAGE_SIZE)
                .webp({ lossless: true })
                .toBuffer();

            // sometimes lossless image is much smaller than 100 quality compressed image
            const finalImageBuffer =
                fullQualityImageBuffer.byteLength < lossLessImageBuffer.byteLength
                    ? fullQualityImageBuffer
                    : lossLessImageBuffer;

            const platforms = Object.entries(coinData.platforms).filter(
                ([platform, contract]) => platform && contract,
            );
            if (platforms.length > 0) {
                platforms.forEach(([platform, contract]) => {
                    const name = `${platform}--${contract}`;
                    const fileName = `${encodeURIComponent(name)}${size !== '1x' ? `@${size}` : ''}.webp`;
                    const destinationFile = join(FILES_CRYPTOICONS_PATH, fileName);

                    fs.writeFileSync(destinationFile, Buffer.from(finalImageBuffer));
                });
            } else {
                const fileName = `${encodeURIComponent(coinData.id)}${size !== '1x' ? `@${size}` : ''}.webp`;
                const destinationFile = join(FILES_CRYPTOICONS_PATH, fileName);

                fs.writeFileSync(destinationFile, Buffer.from(finalImageBuffer));
            }
        }
    } catch (error) {
        console.error('Error:', error);
    }
};

(async () => {
    const startedAt = Date.now();
    const updatedIcons = (await getUpdatedIconsList()) ?? {};

    const coins = await getCoinList();
    if (!coins || coins.length === 0) {
        throw new Error('No coins found');
    }

    // process missing icons and icons updated the longest time ago first
    coins.sort((a, b) => {
        return (updatedIcons[a.id]?.updatedAt ?? 0) - (updatedIcons[b.id]?.updatedAt ?? 0);
    });

    fs.mkdirSync(FILES_CRYPTOICONS_PATH, { recursive: true });

    for (const coin of coins) {
        await updateIcon(coin);

        updatedIcons[coin.id] = {
            updatedAt: Math.floor(Date.now() / 1000),
        };

        fs.writeFileSync(UPDATED_ICONS_LIST_FILE, JSON.stringify(updatedIcons, null, 2));

        if (Date.now() - startedAt > RUN_LIMIT_SECONDS * 1000) {
            console.log('Run limit reached');
            break;
        }

        await sleep((60 / RATE_LIMIT_PER_MINUTE) * 1000);
    }
})();
