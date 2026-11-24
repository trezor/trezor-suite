import { encodeIDBVersion } from '@suite/idb-migration-utils';

import * as migrations from './index';

// make:migration names each export after its file: `m26_12_0_1` for `26.12.0.1.ts`.
const fileVersion = (exportName: string) => exportName.slice(1).replace(/_/g, '.');

describe('migration versions', () => {
    it.each(Object.entries(migrations))(
        '%s declares the version of its file',
        (exportName, migration) => {
            expect(migration.threshold).toBe(encodeIDBVersion(fileVersion(exportName)));
        },
    );
});
