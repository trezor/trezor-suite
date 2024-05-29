/* eslint-disable no-console */
import * as fs from 'fs';
// eslint-disable-next-line import/no-extraneous-dependencies
import Ajv from 'ajv';
import { join } from 'path';

import { SCHEMA_FILENAME_SUFFIX, SCHEMA_PATH } from '../constants';
import { TokenStructure } from '../../src/tokenDefinitionsTypes';

// checks that a config meets the criteria specified by the schema
export const validateStructure = (nftData: TokenStructure, structure: string) => {
    const ajv = new Ajv();

    const schema = fs.readFileSync(
        join(SCHEMA_PATH, `${structure}.${SCHEMA_FILENAME_SUFFIX}`),
        'utf-8',
    );

    const validate = ajv.compile(JSON.parse(schema));
    const isValid = validate(nftData);

    if (!isValid) {
        throw Error(`Config is invalid: ${JSON.stringify(validate.errors)}`);
    }

    console.log('Structure is valid');
};
