import { resolve } from 'path';

import { JSON_RELEASES_FILENAME, VERSION } from '../src/constants';

export const MESSAGE_RELEASE_PATH = resolve(__dirname, '..', 'releases', JSON_RELEASES_FILENAME);
export const MESSAGE_RELEASE_SCHEMA_PATH = resolve(
    __dirname,
    '..',
    'schema',
    `releases.schema.v${VERSION}.json`,
);
