/* eslint-disable no-console */
import { join } from 'path';
import fs from 'fs';

import { fetchNftData } from './utils/fetchNft';
import { signData } from './utils/sign';
import { validateStructure } from './utils/validate';
import { FILES_PATH, DEFINITIONS_FILENAME_SUFFIX } from './constants';
import { fetchCoinData } from './utils/fetchCoins';
import { TokenStructure } from '../src/tokenDefinitionsTypes';

const main = async () => {
    const argv = process.argv.slice(2);

    const type: string = argv[0];
    const structure: string = argv[1];
    const assetPlatformId: string = argv[2];
    const fileType: string = argv[3];

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

    if (!fileType || !['json', 'jws'].includes(fileType)) {
        throw new Error('Missing file type, please specify "json" or "jws"');
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

    const destinationFile = join(
        FILES_PATH,
        `${assetPlatformId}.${structure}.${type}.${DEFINITIONS_FILENAME_SUFFIX}.${fileType}`,
    );

    fs.mkdirSync(FILES_PATH, { recursive: true });

    if (fileType === 'jws') {
        const signedData = signData(data);
        fs.writeFileSync(destinationFile, signedData);

        console.log('JWS definitions saved to', destinationFile);
    } else {
        fs.writeFileSync(destinationFile, JSON.stringify(data));

        console.log('JSON definitions saved to', destinationFile);
    }
};

main();
