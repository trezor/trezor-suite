/* eslint-disable no-console */
import fs from 'fs';

import { validateJsonSchema } from '@trezor/node-utils';
import { type MessageSystem } from '@suite-common/suite-types';

import { CONFIG_PATH, SCHEMA_PATH } from './constants';
import { parsePromoBannerMessages } from '../src/promoBannerUtils';

console.log('Validating config against schema...');
try {
    const config = fs.readFileSync(CONFIG_PATH, 'utf-8');
    const schema = fs.readFileSync(SCHEMA_PATH, 'utf-8');

    validateJsonSchema(config, schema);

    const parsedConfig = JSON.parse(config) as MessageSystem;
    const { errors } = parsePromoBannerMessages(parsedConfig.actions.map(action => action.message));

    if (errors.length > 0) {
        throw new Error(errors.join('\n'));
    }

    console.log('Config is valid!');
} catch (error) {
    console.error(error.message);
    throw error;
}
