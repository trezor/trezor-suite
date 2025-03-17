/* eslint-disable no-console */
import fs from 'fs';

import { validateJsonSchema } from '@trezor/node-utils';

import { CONFIG_PATH, SCHEMA_PATH } from './constants';

console.log('Validating config against schema...');
try {
    const config = fs.readFileSync(CONFIG_PATH, 'utf-8');
    const schema = fs.readFileSync(SCHEMA_PATH, 'utf-8');

    validateJsonSchema(config, schema);
    console.log('Config is valid!');
} catch (error) {
    console.error(error.message);
    throw error;
}
