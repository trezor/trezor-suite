import { Evolu, SimpleName } from '@evolu/common';
import { Upsertable, createEvolu, createOwnerWebSocketTransport } from '@evolu/common/local-first';
import { expect, test } from '@playwright/test';
import { execSync } from 'child_process';
import { diff } from 'jest-diff';
import { isEqual, omit, orderBy } from 'lodash';

import { Schema, createEvoluAppOwnerFromTrezorData } from '@suite-common/suite-sync-evolu';
import { SuiteSyncOwnerSecretHex } from '@suite-common/suite-sync-storage';

import { createNodeEvoluDeps } from './createEvoluNodeDeps';
import { step } from '../common';

type TableName = keyof typeof Schema;
const allTables = Object.keys(Schema) as TableName[];

export const RELAY_URL = 'http://localhost:4000';
export const QUOTA_URL = 'http://localhost:4001';
const RELAY_HEALTH_URL = 'http://localhost:4002';
const EVOLU_LOCAL_SERVER_NOT_RUNNING_ERROR =
    'Evolu relay is not running on localhost. Please start the Docker environment:\n' +
    'yarn workspace "@trezor/suite-e2e" docker:suite-sync';

export class EvoluClient {
    private _evolu?: Evolu<typeof Schema>;

    @step()
    async checkServerRunning() {
        await fetch(RELAY_HEALTH_URL).catch(() => {
            throw new Error(EVOLU_LOCAL_SERVER_NOT_RUNNING_ERROR);
        });
    }

    @step()
    init({
        ownerSecret,
        relayUrl = RELAY_URL,
    }: {
        ownerSecret: SuiteSyncOwnerSecretHex;
        relayUrl?: string;
    }) {
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

    @step()
    writeTo<T extends TableName>(table: T, object: Upsertable<(typeof Schema)[T]>) {
        const upsertResult = this.evolu.upsert(table, object as any);
        if (!upsertResult.ok) {
            throw new Error(
                `Upsert to Evolu relay failed: ${JSON.stringify(upsertResult.error, null, 2)}`,
            );
        }
    }

    @step()
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

    @step()
    async readFrom(table: TableName) {
        const ownerId = (await this.evolu.appOwner).id;
        const query = this.evolu.createQuery(db =>
            db.selectFrom(table).where('ownerId', '=', ownerId).selectAll(),
        );

        return await this.evolu.loadQuery(query);
    }

    @step()
    async debugReadAllTablesAndThrow() {
        const allDataPromise = allTables.map(async table => await this.readFrom(table));
        await expect(async () => {
            const allData = await Promise.all(allDataPromise);
            // test if any tables are empty
            if (allData.some(item => item.length === 0)) {
                // we want to throw even partial results so we can debug
                throw new Error(`Evolu Data: ${JSON.stringify(allData, null, 2)}`);
            }

            // we have collected all data, throw it for debugging purposes
            throw new Error(`Evolu Data: ${JSON.stringify(allData, null, 2)}`);
        }).toPass({ timeout: 3_000, intervals: [1000, 2000, 2500] });
    }

    // Suite sync by design will first return data from local storage
    // and then update it with data from the server.
    // Because of that we need to retry reads until we get expected data
    @step()
    async expectInTable<T extends TableName>(
        table: T,
        expectedData: object[],
        options?: {
            softExpect?: boolean;
            omit?: string[];
            timeout?: number;
        },
    ) {
        const omitFields = options?.omit ?? ['id', 'createdAt'];
        const timeout = options?.timeout ?? 5_000;
        const expectFn = options?.softExpect ? expect.soft : expect;

        await expectFn(async () => {
            const actualData = await this.readFrom(table);
            // Sort by createdAt (ascending) before omitting so rows are in insertion order.
            // Expected data must be provided in the same chronological order.
            const actualOmitted = orderBy(actualData, ['createdAt']).map(item =>
                omit(item, omitFields),
            );
            if (!isEqual(expectedData, actualOmitted)) {
                throw new Error(
                    `Table "${table}" data does not match.\nDiff:\n${diff(expectedData, actualOmitted)}`,
                );
            }
        }).toPass({ timeout });
    }
}

export const wipeAndRestartEvoluServer = async () => {
    await test.step('Wipe Evolu Relay data', () => {
        execSync(
            'docker compose -f docker/docker-compose.suite-ci-e2e.yml exec -T suite-sync rm -rf /app/data',
            {
                cwd: '../../',
            },
        );
    });

    await test.step('Restart Evolu Relay server', () => {
        execSync(
            'docker compose -f docker/docker-compose.suite-ci-e2e.yml restart quota-db suite-sync',
            {
                cwd: '../../',
            },
        );
    });
};
