/* eslint-disable no-console */
import fs from 'fs';
import { join } from 'path';

import {
    DEFINITIONS_FILENAME_SUFFIX,
    FILES_PATH,
    RANKED_STRUCTURE,
    UNKNOWN_MARKET_CAP,
} from './constants';
import { buildRankedDefinitions } from './utils/buildRankedDefinitions';
import { buildCoinDataForPlatform, fetchAllCoins } from './utils/fetchCoins';
import { fetchMarketCaps } from './utils/fetchMarketCaps';
import { fetchNftData } from './utils/fetchNft';
import { fetchVaultDefinitions } from './utils/fetchVaultDefinitions';
import { signData } from './utils/sign';
import { validateStructure } from './utils/validate';
import { DefinitionType, TokenStructure, TokenStructureType } from '../src/tokenDefinitionsTypes';

const writeFiles = (fileName: string, data: TokenStructure) => {
    fs.mkdirSync(FILES_PATH, { recursive: true });
    const signedData = signData(data);
    fs.writeFileSync(join(FILES_PATH, `${fileName}.jws`), signedData);
    fs.writeFileSync(join(FILES_PATH, `${fileName}.json`), JSON.stringify(data));
    console.log('JSON definitions saved to ', join(FILES_PATH, fileName, '.[jws,json]'));
};

const writeDefinitionFiles = (
    assetPlatformId: string,
    type: DefinitionType,
    structure: TokenStructureType,
    data: TokenStructure,
) => writeFiles(`${assetPlatformId}.${structure}.${type}.${DEFINITIONS_FILENAME_SUFFIX}`, data);

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
        const isSimpleStructure = structure === TokenStructureType.SIMPLE;

        const allCoins = await fetchAllCoins();
        // Only the simple run builds the ranked definitions, so an advanced run does not pay for
        // paging the whole market data list.
        const marketCaps = isSimpleStructure ? await fetchMarketCaps() : new Map<string, number>();

        const vaultDefinitions = isSimpleStructure ? await fetchVaultDefinitions() : null;
        const marketCapsByPlatform = new Map<string, Map<string, number>>();

        for (const assetPlatformId of assetPlatformIds) {
            console.log('Building coin data for:', assetPlatformId);
            const coinData = await buildCoinDataForPlatform({
                allCoins,
                assetPlatformId,
                structure,
                marketCaps,
            });

            const vaults = vaultDefinitions?.[assetPlatformId];
            if (Array.isArray(vaults) && coinData instanceof Map) {
                // The earn-yield worker only knows the vault addresses, never a market cap.
                vaults.forEach(vault => {
                    if (!coinData.has(vault.address)) {
                        coinData.set(vault.address, UNKNOWN_MARKET_CAP);
                    }
                });

                console.log(
                    `Merged vault address(es) from the earn-yield worker for ${assetPlatformId}`,
                );
            }

            const data: TokenStructure =
                coinData instanceof Map ? Array.from(coinData.keys()) : coinData;

            const length = countRecords(data, structure);
            console.log('Records for specific platform:', length);
            if (!length)
                throw new Error(`No definitions available for platform: ${assetPlatformId}`);

            validateStructure(data, structure);
            writeDefinitionFiles(assetPlatformId, type, structure, data);
            counts[assetPlatformId] = length;

            if (coinData instanceof Map) {
                marketCapsByPlatform.set(assetPlatformId, coinData);
            }
        }

        if (marketCapsByPlatform.size) {
            const ranked = buildRankedDefinitions(marketCapsByPlatform);
            console.log('Records ranked by market cap:', ranked.length);

            validateStructure(ranked, RANKED_STRUCTURE);
            writeFiles(`${RANKED_STRUCTURE}.${type}.${DEFINITIONS_FILENAME_SUFFIX}`, ranked);
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
