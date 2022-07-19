import DB = require('better-sqlite3');

// https://github.com/WiseLibs/better-sqlite3/blob/HEAD/docs/api.md
// https://github.com/WiseLibs/better-sqlite3/issues/262
export class StorageBase {
    protected db: DB.Database;

    protected constructor(path: string) {
        this.db = new DB(path);
    }

    dispose() {
        this.db.close();
    }
}
