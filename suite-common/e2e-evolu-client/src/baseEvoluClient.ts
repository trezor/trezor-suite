import {
    AppName,
    Evolu,
    MutationValues,
    createOwnerWebSocketTransport,
    createQueryBuilder,
    getOrThrow,
} from '@evolu/common';
import { createEvolu } from '@evolu/common/local-first';
import { execSync } from 'child_process';

import { Schema, createEvoluAppOwnerFromTrezorData } from '@suite-common/suite-sync-evolu';
import { testCreateRunWithEvoluDeps } from '@suite-common/suite-sync-evolu/mocks';
import { SuiteSyncOwnerSecretHex } from '@suite-common/suite-sync-storage';

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

export class BaseEvoluClient {
    private _evolu?: Evolu<typeof Schema>;

    async init({ ownerSecret, relayUrl = RELAY_URL }: EvoluClientInitParams) {
        const run = await testCreateRunWithEvoluDeps();
        const owner = createEvoluAppOwnerFromTrezorData({ data: ownerSecret });
        if (!owner.ok) {
            throw new Error(`Failed to parse owner: ${JSON.stringify(owner.error)}`);
        }

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
        this.evolu.upsert(table, object as any);
    }

    async subscribeToTable(table: TableName) {
        const ownerId = (await this.evolu.appOwner).id;
        const query = createQuery(db =>
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
        const query = createQuery(db =>
            db.selectFrom(table).where('ownerId', '=', ownerId).selectAll(),
        );

        return await this.evolu.loadQuery(query);
    }
}

export const wipeEvoluRelayData = () => {
    execSync(
        'docker compose -f docker/docker-compose.suite-ci-e2e.yml exec -T suite-sync rm -rf /app/data',
        { cwd: '../../' },
    );
};

export const restartEvoluRelayServer = () => {
    execSync(
        'docker compose -f docker/docker-compose.suite-ci-e2e.yml restart quota-db suite-sync',
        { cwd: '../../' },
    );
};

export const checkEvoluRelayServerRunning = async () => {
    await fetch(RELAY_HEALTH_URL).catch(() => {
        throw new Error(EVOLU_LOCAL_SERVER_NOT_RUNNING_ERROR);
    });
};
