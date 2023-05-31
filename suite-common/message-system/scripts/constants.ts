import { join, resolve } from 'path';

import { VERSION } from '../src/messageSystemConstants';

const SCHEMA_FILENAME = `config.schema.v${VERSION}.json`;
const CONFIG_FILENAME = `config.v${VERSION}.json`;
const SUITE_TYPES_FILENAME = 'messageSystem.ts';

export const PACKAGE_ROOT = resolve(__dirname, '..'); // suite-common/message-system

export const SCHEMA_PATH = join(PACKAGE_ROOT, 'schema', SCHEMA_FILENAME);
export const CONFIG_PATH = join(PACKAGE_ROOT, 'config', CONFIG_FILENAME);
export const TYPES_PATH = join(PACKAGE_ROOT, '..', 'suite-types', 'src', SUITE_TYPES_FILENAME); // pointing to "suite-types" package to prevent circular dependency with "test-utils" package
