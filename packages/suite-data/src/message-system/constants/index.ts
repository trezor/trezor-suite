import { join, resolve } from 'path';

/*
 * Bump version in case the new version of message system is not backward compatible.
 * Have to be in sync with constant in messageSystemConstants.ts file in 'suite' package.
 */
const VERSION = 1;

const SCHEMA_FILENAME = `config.schema.v${VERSION}.json`;
const CONFIG_FILENAME = `config.v${VERSION}.json`;

export const JWS_CONFIG_FILENAME = `config.v${VERSION}.jws`;

export const SUITE_TYPES_FILENAME = 'messageSystem.ts';
export const SUITE_CONFIG_FILENAME = 'config.json';

export const PROJECT_ROOT = resolve(__dirname, '..'); // suite-data/src/message-system
export const PACKAGE_ROOT = resolve(PROJECT_ROOT, '../..'); // suite-data
export const PACKAGES_ROOT = resolve(PROJECT_ROOT, '../../..');

export const SCHEMA_PATH = join(PROJECT_ROOT, 'schema', SCHEMA_FILENAME);
export const CONFIG_PATH = join(PROJECT_ROOT, 'config', CONFIG_FILENAME);
