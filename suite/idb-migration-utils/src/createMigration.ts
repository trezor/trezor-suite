import type { DBSchema } from 'idb';

import { encodeIDBVersion } from './encode';
import { parseIdbVersion } from './parseIdbVersion';
import { type DBMigration } from './types';

type BaseSemver = `${number}.${number}.${number}`;
type IdbVersionString = `${BaseSemver}` | `${BaseSemver}.${number}`;

export const createMigration = <Schema extends DBSchema>(
    version: IdbVersionString,
    migrate: DBMigration<Schema>['migrate'],
): DBMigration<Schema> => {
    const { versionString: threshold } = parseIdbVersion(version);

    return {
        threshold: encodeIDBVersion(threshold),
        migrate,
    };
};
