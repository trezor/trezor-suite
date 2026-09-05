/* eslint-disable no-console */

import {
    AppName,
    type Evolu,
    type MutationValues,
    createOwnerWebSocketTransport,
    createQueryBuilder,
    getOrThrow,
} from '@evolu/common';
import { createEvolu } from '@evolu/common/local-first';
import { execFileSync } from 'child_process';
import path from 'path';

import { Schema, createEvoluAppOwnerFromTrezorData } from '@suite-common/suite-sync-evolu';
import { type SuiteSyncOwnerSecretHex } from '@suite-common/suite-sync-storage';

import { createNodeEvoluDeps } from './createEvoluNodeDeps';

export type EvoluClientInitParams = {
    ownerSecret: SuiteSyncOwnerSecretHex;
    relayUrl?: string;
};

type TableName = keyof typeof Schema;

export const RELAY_URL = 'http://localhost:4000';
export const QUOTA_URL = 'http://localhost:4001';
const RELAY_HEALTH_URL = 'http://localhost:4002';
const EVOLU_LOCAL_SERVER_NOT_RUNNING_ERROR =
    'Evolu relay is not running on localhost. Please start the Docker environment:\n' +
    'yarn workspace "@trezor/suite-e2e" docker:suite-sync';

export const createQuery = createQueryBuilder(Schema);

const REPO_ROOT = path.resolve(__dirname, '../../../');

export const logToRelayDocker = (message: string) => {
    try {
        execFileSync(
            'docker',
            [
                'compose',
                '-f',
                'docker/docker-compose.suite-ci-e2e.yml',
                'exec',
                '-T',
                '-e',
                `MARKER=${message}`,
                'suite-sync',
                'sh',
                '-c',
                'echo "[TEST] $MARKER" > /proc/1/fd/1',
            ],
            { cwd: REPO_ROOT },
        );
    } catch (e) {
        // Non-fatal: marker logging should not break tests
        console.warn('[logToRelayDocker] failed:', e);
    }
};

export class BaseEvoluClient {
    private _evolu?: Evolu<typeof Schema>;
    private _ownerId?: string;

    async init({ ownerSecret, relayUrl = RELAY_URL }: EvoluClientInitParams) {
        const run = createNodeEvoluDeps();
        const owner = createEvoluAppOwnerFromTrezorData({ data: ownerSecret });
        if (!owner.ok) {
            throw new Error(`Failed to parse owner: ${JSON.stringify(owner.error)}`);
        }

        this._ownerId = owner.value.id;
        console.log('[EvoluClient] init ownerId:', this._ownerId);
        logToRelayDocker(`EVOLU INIT: ownerId=${this._ownerId}`);

        const sanitizedOwnerId = owner.value.id.replaceAll('_', '-');
        const appName = AppName.orThrow(`trezor-suite-e2e-${sanitizedOwnerId}`);

        this._evolu = getOrThrow(
            await run(
                createEvolu(Schema, {
                    appName,
                    // Intentionally no transport, transport will be passed
                    // later on, so we can change the RelayUrl at any time.
                    transports: [
                        createOwnerWebSocketTransport({
                            url: relayUrl,
                            ownerId: owner.value.id,
                        }),
                    ],
                    appOwner: owner.value,
                }),
            ),
        );
    }

    get evolu() {
        if (!this._evolu) {
            throw new Error('EvoluClient not initialized. Call init() first.');
        }

        return this._evolu;
    }

    writeTo<T extends TableName>(table: T, object: MutationValues<(typeof Schema)[T], 'upsert'>) {
        console.log(`[EvoluClient] writeTo table=${table}:`, JSON.stringify(object));
        this.evolu.upsert(table, object);
    }

    async subscribeToTable(table: TableName) {
        const ownerId = (await this.evolu.appOwner).id;
        const query = createQuery(db =>
            db.selectFrom(table).where('ownerId', '=', ownerId).selectAll(),
        );

        return this.evolu.subscribeQuery(query)(() => {
            const rows = this.evolu.getQueryRows(query);
            console.log(
                `[EvoluClient] sync update table=${table}: ${rows.length} rows`,
                rows.length > 0 ? JSON.stringify(rows) : '(empty)',
            );
        });
    }

    async readFrom(table: TableName) {
        const ownerId = (await this.evolu.appOwner).id;
        const query = createQuery(db =>
            db.selectFrom(table).where('ownerId', '=', ownerId).selectAll(),
        );

        const rows = await this.evolu.loadQuery(query);
        console.log(
            `[EvoluClient] readFrom table=${table}: ${rows.length} rows`,
            rows.length > 0 ? JSON.stringify(rows) : '(empty)',
        );

        return rows;
    }

    async dispose() {
        console.log('[EvoluClient] dispose START ownerId:', this._ownerId);
        logToRelayDocker(`EVOLU DISPOSE START: ownerId=${this._ownerId}`);
        if (this._evolu) {
            await this._evolu[Symbol.asyncDispose]();
            this._evolu = undefined;
        }
        console.log('[EvoluClient] dispose DONE ownerId:', this._ownerId);
        this._ownerId = undefined;
    }
}

// Hardcoded quota data for test environment. The quota manager cannot store keys
// per-wallet, so these limits must be seeded into the DB before running Suite Sync tests.
// This will be refactored.
const QUOTA_STORAGE_LIMIT = 10486;
const QUOTA_PUBLIC_KEY =
    '0487472eec47aa28fa62ff3231f60b5c89751318a5598af5f93ab2aad9061ca25f53b352a97b855f16b11b795b715249c8dbfb6e47339f677e30d530f0e80bc4bb';
const QUOTA_TOTAL_STORAGE_SIZE = 1048576;
const QUOTA_UNSPENT_STORAGE_SIZE = 1038090;
const QUOTA_DB_CREDENTIALS = '-U suite-sync -d suite-sync-gate';

const runQuotaDbSql = (sql: string) =>
    execFileSync(
        'docker',
        [
            'compose',
            '-f',
            'docker/docker-compose.suite-ci-e2e.yml',
            'exec',
            '-T',
            'quota-db',
            'psql',
            ...QUOTA_DB_CREDENTIALS.split(' '),
            '--csv',
            '-c',
            sql,
        ],
        { cwd: REPO_ROOT },
    ).toString();

const parseCsvRows = (csv: string) => {
    const [headerLine, ...rowLines] = csv.trim().split('\n');
    const columns = headerLine?.split(',') ?? [];

    return rowLines.map(rowLine => {
        const values = rowLine.split(',');

        return Object.fromEntries(columns.map((column, index) => [column, values[index] ?? '']));
    });
};

const waitForRelayReady = async (maxWaitMs = 30_000) => {
    const pollIntervalMs = 500;
    const deadline = Date.now() + maxWaitMs;

    while (Date.now() < deadline) {
        try {
            await fetch(RELAY_HEALTH_URL);

            return;
        } catch {
            await new Promise(resolve => setTimeout(resolve, pollIntervalMs));
        }
    }
    throw new Error(`Evolu relay did not become healthy within ${maxWaitMs}ms after restart`);
};

export const wipeAndRestartEvoluRelayServer = async () => {
    execFileSync(
        'docker',
        [
            'compose',
            '-f',
            'docker/docker-compose.suite-ci-e2e.yml',
            'exec',
            '-T',
            'suite-sync',
            'rm',
            '-rf',
            '/app/data',
        ],
        { cwd: REPO_ROOT },
    );
    runQuotaDbSql(
        'TRUNCATE challenges, owner_storage_limits, pubkey_storage_limits RESTART IDENTITY CASCADE;',
    );
    execFileSync(
        'docker',
        [
            'compose',
            '-f',
            'docker/docker-compose.suite-ci-e2e.yml',
            'restart',
            'quota-db',
            'suite-sync',
        ],
        { cwd: REPO_ROOT },
    );
    await waitForRelayReady();
};

export const seedQuotaManagerData = ({ ownerId }: { ownerId: string }) => {
    const safeOwnerId = ownerId.replace(/'/g, "''");
    runQuotaDbSql(
        `INSERT INTO owner_storage_limits ("ownerId", "storageLimit") VALUES ('${safeOwnerId}', ${QUOTA_STORAGE_LIMIT}) ON CONFLICT DO NOTHING;`,
    );
    runQuotaDbSql(
        `INSERT INTO pubkey_storage_limits ("publicKey", "totalStorageSize", "unspentStorageSize") VALUES ('${QUOTA_PUBLIC_KEY}', ${QUOTA_TOTAL_STORAGE_SIZE}, ${QUOTA_UNSPENT_STORAGE_SIZE}) ON CONFLICT DO NOTHING;`,
    );
};

// Updates all registered devices; the wiped test environment has exactly one.
export const setDeviceUnspentStorageSize = ({
    unspentStorageSize,
}: {
    unspentStorageSize: number;
}) => {
    runQuotaDbSql(`UPDATE pubkey_storage_limits SET "unspentStorageSize" = ${unspentStorageSize};`);
};

export const setOwnerStorageLimit = ({
    ownerId,
    storageLimit,
}: {
    ownerId: string;
    storageLimit: number;
}) => {
    const safeOwnerId = ownerId.replace(/'/g, "''");
    runQuotaDbSql(
        `UPDATE owner_storage_limits SET "storageLimit" = ${storageLimit} WHERE "ownerId" = '${safeOwnerId}';`,
    );
};

export type QuotaManagerDeviceRow = {
    publicKey: string;
    totalStorageSize: number;
    unspentStorageSize: number;
};

export type QuotaManagerOwnerRow = {
    ownerId: string;
    storageLimit: number;
};

export const readQuotaManagerData = () => {
    const devices: QuotaManagerDeviceRow[] = parseCsvRows(
        runQuotaDbSql(
            'SELECT "publicKey", "totalStorageSize", "unspentStorageSize" FROM pubkey_storage_limits;',
        ),
    ).map(row => ({
        publicKey: row.publicKey ?? '',
        totalStorageSize: Number(row.totalStorageSize),
        unspentStorageSize: Number(row.unspentStorageSize),
    }));

    const owners: QuotaManagerOwnerRow[] = parseCsvRows(
        runQuotaDbSql('SELECT "ownerId", "storageLimit" FROM owner_storage_limits;'),
    ).map(row => ({
        ownerId: row.ownerId ?? '',
        storageLimit: Number(row.storageLimit),
    }));

    return { devices, owners };
};

export const checkEvoluRelayServerRunning = async () => {
    await fetch(RELAY_HEALTH_URL).catch(() => {
        throw new Error(EVOLU_LOCAL_SERVER_NOT_RUNNING_ERROR);
    });
};
