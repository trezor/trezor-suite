/* eslint-disable no-console */
import { join } from 'path';
import fs from 'fs';

import { fetchNftData } from './utils/fetchNft';
import { signData } from './utils/sign';
import { validateStructure } from './utils/validate';
import { FILES_PATH, DEFINITIONS_FILENAME_SUFFIX } from './constants';
import { TokenStructure } from '../src/types';
import { fetchCoinData } from './utils/fetchCoins';

const main = async () => {
    const argv = process.argv.slice(2);

    const type: string = argv[0];
    const structure: string = argv[1];
    const assetPlatformId: string = argv[2];

    if (!type || !['nft', 'coin'].includes(type)) {
        throw new Error('Missing type, please specify "nft" or "coin"');
    }

    if (!structure || !['simple', 'advanced'].includes(structure)) {
        throw new Error('Missing structure, please specify "simple" or "advanced"');
    }

    if (!assetPlatformId) {
        throw new Error(
            'Missing platform id. Please enter "ethereum", "polygon-pos" or any other from https://pro-api.coingecko.com/api/v3/asset_platforms',
        );
    }

    let data: TokenStructure;
    if (type === 'nft') {
        data = await fetchNftData(assetPlatformId, structure);
    } else {
        data = await fetchCoinData(assetPlatformId, structure);
    }

    if (structure === 'simple') {
        const { length } = data;
        console.log('Records for specific platform:', length);

        if (!length) {
            throw new Error(`No definitions available for platform: ${assetPlatformId}`);
        }
    } else {
        const { length } = Object.keys(data);
        console.log('Records for specific platform:', length);

        if (!length) {
            throw new Error(`No definitions available for platform: ${assetPlatformId}`);
        }
    }

    validateStructure(data, structure);

    const signedData = signData(data);

    const destinationFile = join(
        FILES_PATH,
        `${assetPlatformId}.${structure}.${type}.${DEFINITIONS_FILENAME_SUFFIX}.jws`,
    );

    fs.mkdirSync(FILES_PATH, { recursive: true });
    fs.writeFileSync(destinationFile, signedData);

    console.log('Signed definitions saved to', destinationFile);
};

main();
