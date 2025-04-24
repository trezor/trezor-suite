/* eslint-disable no-console */
import fs from 'fs';

import { validateJsonSchema } from '@trezor/node-utils';

import { MESSAGE_RELEASE_PATH, MESSAGE_RELEASE_SCHEMA_PATH } from '../src/constants';

console.log('Validating release message against schema...');
try {
    if (!fs.existsSync(MESSAGE_RELEASE_PATH)) {
        throw new Error(`Release message file not found at: ${MESSAGE_RELEASE_PATH}`);
    }

    if (!fs.existsSync(MESSAGE_RELEASE_SCHEMA_PATH)) {
        throw new Error(`Schema file not found at: ${MESSAGE_RELEASE_SCHEMA_PATH}`);
    }

    const releaseMessage = fs.readFileSync(MESSAGE_RELEASE_PATH, 'utf-8');
    const schema = fs.readFileSync(MESSAGE_RELEASE_SCHEMA_PATH, 'utf-8');

    validateJsonSchema(releaseMessage, schema);
    console.log('Release message is valid!');
} catch (error) {
    console.error(error.message);
    throw error;
}
