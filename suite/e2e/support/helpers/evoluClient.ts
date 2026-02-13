import { Evolu, SimpleName, getOrThrow } from '@evolu/common';
import { Upsertable, createEvolu, createOwnerWebSocketTransport } from '@evolu/common/local-first';
import { expect, test } from '@playwright/test';
import { execSync } from 'child_process';
import { diff } from 'jest-diff';
import { isEqual, omit, orderBy } from 'lodash';

import { Schema, createEvoluAppOwnerFromTrezorData } from '@suite-common/suite-sync-evolu';
import { SuiteSyncOwnerSecretHex } from '@suite-common/suite-types';

import { createNodeEvoluDeps } from './createEvoluNodeDeps';
import { step } from '../common';

type TableName = keyof typeof Schema;
const allTables = Object.keys(Schema) as TableName[];

export class EvoluClient {
    private _evolu?: Evolu<typeof Schema>;

    @step()
    async init({
        ownerSecret,
        //TODO: replace with one source definition
        relayUrl = 'http://localhost:4000',
    }: {
        ownerSecret: SuiteSyncOwnerSecretHex;
        relayUrl?: string;
    }) {
        const { deps } = await createNodeEvoluDeps();

        const owner = createEvoluAppOwnerFromTrezorData({ data: ownerSecret });
        if (!owner.ok) {
            throw new Error(`Failed to parse owner: ${JSON.stringify(owner.error)}`);
        }

        //db name just on client side
        //TODO: I think it is not used not at all because of how deps are created
        const sanitizedOwnerId = owner.value.id.replaceAll('_', '-');
        const databaseName = getOrThrow(SimpleName.from(`trezor-suite-e2e-${sanitizedOwnerId}`));

        this._evolu = createEvolu(deps)(Schema, {
            name: databaseName,
            transports: [
                createOwnerWebSocketTransport({
                    url: relayUrl,
                    ownerId: owner.value.id,
                }),
            ],
            externalAppOwner: owner.value,
            // This turns on the Encryption-at-rest (encryption of the SQLLite file),
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
    async readFrom(table: TableName) {
        return await this.evolu.loadQuery(
            this.evolu.createQuery(db => db.selectFrom(table).selectAll()),
        );
    }

    // Suite sync by design will first return data from local storage
    // and then update it with data from the server.
    // Because of that we need to retry reads until we get expected data
    @step()
    async readWithRetryFrom(table: TableName) {
        const result = await expect(async () => {
            const data = await this.readFrom(table);
            expect(data).not.toEqual([]);

            return data;
        }).toPass({ timeout: 5_000 });

        return result;
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
            const actualOmitted = actualData.map(item => omit(item, omitFields));
            // Unfortunately label is the only guaranteed property for ordering
            // might not be sufficient for more advance test scenarios. YAGNI for now.
            const actualOrdered = orderBy(actualOmitted, ['label']);
            const expectedOrdered = orderBy(expectedData, ['label']);
            if (!isEqual(expectedOrdered, actualOrdered)) {
                throw new Error(
                    `Table "${table}" data does not match.\nDiff:\n${diff(expectedOrdered, actualOrdered)}`,
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
