import { Upsertable } from '@evolu/common/local-first';
import { expect, test } from '@playwright/test';
import { diff } from 'jest-diff';
import { isEqual, omit, orderBy } from 'lodash';

import {
    BaseEvoluClient,
    EvoluClientInitParams,
    checkEvoluRelayServerRunning,
    seedQuotaManagerData,
    wipeAndRestartEvoluRelayServer,
} from '@suite-common/e2e-evolu-client';
import { Schema } from '@suite-common/suite-sync-evolu';

import { step } from '../common';

type TableName = keyof typeof Schema;
const allTables = Object.keys(Schema) as TableName[];

export class EvoluClient extends BaseEvoluClient {
    @step()
    override async init(params: EvoluClientInitParams) {
        await super.init(params);
    }

    @step()
    override writeTo<T extends TableName>(table: T, object: Upsertable<(typeof Schema)[T]>) {
        super.writeTo(table, object as any);
    }

    @step()
    seedQuotaManagerData() {
        seedQuotaManagerData();
    }

    @step()
    override async subscribeToTable(table: TableName) {
        return await super.subscribeToTable(table);
    }

    @step()
    override async readFrom(table: TableName) {
        return await super.readFrom(table);
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
    await checkEvoluRelayServerRunning();
    await test.step('Wipe and restart Evolu Relay server', wipeAndRestartEvoluRelayServer);
};
