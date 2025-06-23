import type { DBSchema } from 'idb';
import * as semver from 'semver';

import { semverToIDBVersion } from './encode';
import { DBMigration } from './types';

export const createMigration = <Schema extends DBSchema>(
    version: `${number}.${number}.${number}`,
    migrate: DBMigration<Schema>['migrate'],
): DBMigration<Schema> => {
    if (!semver.valid(version)) {
        throw new Error(`createMigration: Invalid version format: ${version}`);
    }

    return {
        threshold: semverToIDBVersion(version),
        migrate,
    };
};
