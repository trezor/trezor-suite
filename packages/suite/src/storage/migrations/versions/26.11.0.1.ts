import { createMigration } from '@suite/idb-migration-utils';
import { CALL_SOURCE_MCP } from '@suite-common/connect-popup';

import { type SuiteDBSchema } from '#src/storage/definitions';

/*
 Drop Connect permissions that an earlier version remembered for an MCP client under the name it
 declared. When the process lookup missed, that version stored the declared name as the process path
 too, so any client could claim such a grant by declaring the name. Suite no longer produces such a
 path, but the grant would stay listed in Settings > Connected apps as if it applied, and a process
 whose reported path happens to be that name would still match it.

 Done once here rather than on every load, because a live lookup can report a path equal to the
 process name too: the path is argv[0] on macOS (and on Linux before the lookup read the executable),
 a bare name for anything started from PATH. Such a live grant is dropped by this migration as well,
 once, and the user is asked again a single time; a load filter would drop it on every start.
*/
export default createMigration<SuiteDBSchema>('26.11.0.1', async (_db, tx) => {
    const store = tx.objectStore('connect');
    const connect = await store.get('connect');
    if (!connect || !Array.isArray(connect.permissions)) return;

    const permissions = connect.permissions.filter(
        // Persisted grants are not validated, so nothing here may throw on a malformed one; what
        // remains of such grants is dropped on load.
        app =>
            !(
                app?.type === CALL_SOURCE_MCP &&
                !!app.process &&
                app.process.fullPath === app.process.name
            ),
    );
    if (permissions.length === connect.permissions.length) return;

    await store.put({ ...connect, permissions }, 'connect');
});
