import { type Evolu, SimpleName } from '@evolu/common';
import {
    type Upsertable,
    createEvolu,
    createOwnerWebSocketTransport,
} from '@evolu/common/local-first';
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

export class BaseEvoluClient {
    private _evolu?: Evolu<typeof Schema>;

    init({ ownerSecret, relayUrl = RELAY_URL }: EvoluClientInitParams) {
        const deps = createNodeEvoluDeps();

        const owner = createEvoluAppOwnerFromTrezorData({ data: ownerSecret });
        if (!owner.ok) {
            throw new Error(`Failed to parse owner: ${JSON.stringify(owner.error)}`);
        }

        const sanitizedOwnerId = owner.value.id.replaceAll('_', '-');
        const clientDatabaseName = SimpleName.orThrow(`trezor-suite-e2e-${sanitizedOwnerId}`);

        this._evolu = createEvolu(deps)(Schema, {
            name: clientDatabaseName,
            transports: [
                createOwnerWebSocketTransport({
                    url: relayUrl,
                    ownerId: owner.value.id,
                }),
            ],
            externalAppOwner: owner.value,
            encryptionKey: owner.value.encryptionKey,
        });

        this._evolu.subscribeError(() => {
            console.error('Evolu Error:', this._evolu?.getError());
        });
    }

    get evolu() {
        if (!this._evolu) {
            throw new Error('EvoluClient not initialized. Call init() first.');
        }

        return this._evolu;
    }

    writeTo<T extends TableName>(table: T, object: Upsertable<(typeof Schema)[T]>) {
        const upsertResult = this.evolu.upsert(table, object as any);
        if (!upsertResult.ok) {
            throw new Error(
                `Upsert to Evolu relay failed: ${JSON.stringify(upsertResult.error, null, 2)}`,
            );
        }
    }

    async subscribeToTable(table: TableName) {
        const ownerId = (await this.evolu.appOwner).id;
        const query = this.evolu.createQuery(db =>
            db.selectFrom(table).where('ownerId', '=', ownerId).selectAll(),
        );

        return this.evolu.subscribeQuery(query)(() => {
            const rows = this.evolu.getQueryRows(query);
            console.error(
                `Evolu subscription update for table "${table}": ${JSON.stringify(rows, null, 2)}`,
            );
        });
    }

    async readFrom(table: TableName) {
        const ownerId = (await this.evolu.appOwner).id;
        const query = this.evolu.createQuery(db =>
            db.selectFrom(table).where('ownerId', '=', ownerId).selectAll(),
        );

        return await this.evolu.loadQuery(query);
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

const REPO_ROOT = path.resolve(__dirname, '../../../');

export const wipeAndRestartEvoluRelayServer = () => {
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
            '-c',
            'TRUNCATE challenges, owner_storage_limits, pubkey_storage_limits RESTART IDENTITY CASCADE;',
        ],
        { cwd: REPO_ROOT },
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
};

export const seedQuotaManagerData = ({ ownerId }: { ownerId: string }) => {
    const safeOwnerId = ownerId.replace(/'/g, "''");
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
            '-c',
            `INSERT INTO owner_storage_limits ("ownerId", "storageLimit") VALUES ('${safeOwnerId}', ${QUOTA_STORAGE_LIMIT}) ON CONFLICT DO NOTHING;`,
        ],
        { cwd: REPO_ROOT },
    );
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
            '-c',
            `INSERT INTO pubkey_storage_limits ("publicKey", "totalStorageSize", "unspentStorageSize") VALUES ('${QUOTA_PUBLIC_KEY}', ${QUOTA_TOTAL_STORAGE_SIZE}, ${QUOTA_UNSPENT_STORAGE_SIZE}) ON CONFLICT DO NOTHING;`,
        ],
        { cwd: REPO_ROOT },
    );
};

export const checkEvoluRelayServerRunning = async () => {
    await fetch(RELAY_HEALTH_URL).catch(() => {
        throw new Error(EVOLU_LOCAL_SERVER_NOT_RUNNING_ERROR);
    });
};
