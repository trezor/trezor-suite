/* eslint-disable no-console */
import fs from 'fs';
import { join } from 'path';

import { DEFINITIONS_FILENAME_SUFFIX, FILES_PATH, RANKED_STRUCTURE } from './constants';
import { buildRankedDefinitions } from './utils/buildRankedDefinitions';
import { signData } from './utils/sign';
import { validateStructure } from './utils/validate';
import { DefinitionType, RankedTokenStructure } from '../src/tokenDefinitionsTypes';

const writeRankedFiles = (data: RankedTokenStructure) => {
    const fileName = `${RANKED_STRUCTURE}.${DefinitionType.COIN}.${DEFINITIONS_FILENAME_SUFFIX}`;

    fs.mkdirSync(FILES_PATH, { recursive: true });
    fs.writeFileSync(join(FILES_PATH, `${fileName}.jws`), signData(data));
    fs.writeFileSync(join(FILES_PATH, `${fileName}.json`), JSON.stringify(data));

    console.log('Ranked definitions saved to', `${join(FILES_PATH, fileName)}.[jws,json]`);
};

const main = async () => {
    const assetPlatformIds = process.argv.slice(2);

    if (!assetPlatformIds.length) {
        throw new Error(
            'Missing platform id(s). Provide one or more (e.g. "ethereum polygon-pos").',
        );
    }

    console.log(`Ranking tokens of platforms: ${assetPlatformIds.join(', ')}`);

    const ranked = await buildRankedDefinitions(assetPlatformIds);
    console.log('Tokens ranked by market cap:', ranked.length);

    validateStructure(ranked, RANKED_STRUCTURE);
    writeRankedFiles(ranked);
};

main().catch(err => {
    console.error(err);
    process.exit(1);
});
