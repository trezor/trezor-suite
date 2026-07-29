/* eslint-disable no-console */
import fs from 'fs';
import { join } from 'path';

import { DEFINITIONS_FILENAME_SUFFIX, FILES_PATH } from './constants';
import { buildCoinDataForPlatform, fetchAllCoins } from './utils/fetchCoins';
import { fetchNftData } from './utils/fetchNft';
import { fetchVaultDefinitions } from './utils/fetchVaultDefinitions';
import { signData } from './utils/sign';
import { validateStructure } from './utils/validate';
import { DefinitionType, TokenStructure, TokenStructureType } from '../src/tokenDefinitionsTypes';

const writeDefinitionFiles = (
    assetPlatformId: string,
    type: DefinitionType,
    structure: TokenStructureType,
    data: TokenStructure,
) => {
    const fileName = `${assetPlatformId}.${structure}.${type}.${DEFINITIONS_FILENAME_SUFFIX}`;
    fs.mkdirSync(FILES_PATH, { recursive: true });
    const signedData = signData(data);
    fs.writeFileSync(join(FILES_PATH, `${fileName}.jws`), signedData);
    fs.writeFileSync(join(FILES_PATH, `${fileName}.json`), JSON.stringify(data));
    console.log('JSON definitions saved to ', join(FILES_PATH, fileName, '.[jws,json]'));
};

const countRecords = (data: TokenStructure, structure: TokenStructureType) =>
    structure === TokenStructureType.SIMPLE
        ? (data as string[]).length
        : Object.keys(data as Record<string, unknown>).length;

const printSummary = (
    type: DefinitionType,
    structure: TokenStructureType,
    counts: Record<string, number>,
) => {
    const entries = Object.entries(counts).sort((a, b) => b[1] - a[1]);
    const total = entries.reduce((sum, [, n]) => sum + n, 0);

    console.log('\n==================== SUMMARY ====================');
    console.log(`Type: ${type}, Structure: ${structure}`);
    for (const [platform, n] of entries) {
        console.log(`${platform.padEnd(22, ' ')} : ${n}`);
    }
    console.log('-----------------------------------------------');
    console.log(`TOTAL records: ${total}`);
    console.log('================================================\n');
};

const main = async () => {
    const argv = process.argv.slice(2);

    const rawType = argv[0];
    const rawStructure = argv[1];
    const assetPlatformIds = argv.slice(2);

    if (!rawType || !Object.values(DefinitionType).includes(rawType as DefinitionType)) {
        throw new Error('Missing or invalid type, please specify "nft" or "coin"');
    }
    if (
        !rawStructure ||
        !Object.values(TokenStructureType).includes(rawStructure as TokenStructureType)
    ) {
        throw new Error('Missing or invalid structure, please specify "simple" or "advanced"');
    }

    const type = rawType as DefinitionType;
    const structure = rawStructure as TokenStructureType;

    if (!assetPlatformIds.length) {
        throw new Error(
            'Missing platform id(s). Provide one or more (e.g. "ethereum polygon-pos").',
        );
    }

    console.log(
        `Type: ${type}, structure: ${structure}, platforms: ${assetPlatformIds.join(', ')}`,
    );

    const counts: Record<string, number> = {};

    if (type === DefinitionType.COIN) {
        const allCoins = await fetchAllCoins();

        const vaultDefinitions =
            structure === TokenStructureType.SIMPLE ? await fetchVaultDefinitions() : null;

        for (const assetPlatformId of assetPlatformIds) {
            console.log('Building coin data for:', assetPlatformId);
            const coinData = await buildCoinDataForPlatform(allCoins, assetPlatformId, structure);

            const vaults = vaultDefinitions?.[assetPlatformId];
            if (Array.isArray(vaults) && coinData instanceof Set) {
                vaults.forEach(vault => coinData.add(vault.address));

                console.log(
                    `Merged vault address(es) from the earn-yield worker for ${assetPlatformId}`,
                );
            }

            const data: TokenStructure = coinData instanceof Set ? Array.from(coinData) : coinData;

            const length = countRecords(data, structure);
            console.log('Records for specific platform:', length);
            if (!length)
                throw new Error(`No definitions available for platform: ${assetPlatformId}`);

            validateStructure(data, structure);
            writeDefinitionFiles(assetPlatformId, type, structure, data);
            counts[assetPlatformId] = length;
        }
    }

    if (type === DefinitionType.NFT) {
        for (const assetPlatformId of assetPlatformIds) {
            console.log('Fetching NFT data for:', assetPlatformId);
            const data = await fetchNftData(assetPlatformId, structure);

            const length = countRecords(data, structure);
            console.log('Records for specific platform:', length);
            if (!length)
                throw new Error(`No definitions available for platform: ${assetPlatformId}`);

            validateStructure(data, structure);
            writeDefinitionFiles(assetPlatformId, type, structure, data);
            counts[assetPlatformId] = length;
        }
    }

    printSummary(type, structure, counts);
};

main().catch(err => {
    console.error(err);
    process.exit(1);
});
