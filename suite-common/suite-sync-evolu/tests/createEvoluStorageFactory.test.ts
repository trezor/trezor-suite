import { type Evolu, OwnerId, Run, createQueryBuilder, testCreateWebSocket } from '@evolu/common';
import { EvoluPlatformDeps } from '@evolu/common/local-first';

import {
    SuiteSyncAccount,
    SuiteSyncAddress,
    SuiteSyncOutput,
    SuiteSyncOwner,
    SuiteSyncWallet,
    asSuiteSyncOwnerId,
    asSuiteSyncOwnerSecretHex,
} from '@suite-common/suite-sync-storage';
import { asAccountDescriptor, asWalletDescriptor } from '@suite-common/wallet-types';
import { createDeferred } from '@trezor/utils';

import { testCreateRunWithEvoluDeps } from '../mocks/testCreateRunWithEvoluDeps';
import { createEvoluInstanceFactory } from '../src/createEvoluInstance';
import { createEvoluStorageFactory } from '../src/evoluStorage';
import { Schema } from '../src/schema';

const suiteSyncOwner: SuiteSyncOwner = {
    ownerId: asSuiteSyncOwnerId('yg0UgROParTpm60ltI3hDw'),
    ownerSecret: asSuiteSyncOwnerSecretHex(
        'e17818d7c458f171885280eeef2d70078c6842b51e18ec6f2f8c9f44d3d171fd0f49a3aeff32a560d7f823321fcd24f8d8773ffa59855c6447b11af88a2fd7b5',
    ),
};

const createQuery = createQueryBuilder(Schema);

const createTestStorage = async (run: Run<EvoluPlatformDeps>) => {
    const instance = await createEvoluInstanceFactory({ run })({ suiteSyncOwner });
    const storage = await createEvoluStorageFactory({
        createEvoluInstance: () => Promise.resolve(instance),
    })({ suiteSyncOwner });

    return {
        ...instance,
        storage,
    };
};

type ExpectOwnerIdToUseShardOwnerParams = {
    evolu: Evolu<typeof Schema>;
    ownerId: OwnerId | null;
    expectedOwnerId: OwnerId;
};

const expectOwnerIdToUseShardOwner = async ({
    evolu,
    ownerId: rowOwnerId,
    expectedOwnerId: shardOwnerId,
}: ExpectOwnerIdToUseShardOwnerParams) => {
    const appOwnerId = (await evolu.appOwner).id;

    expect(rowOwnerId).toBe(shardOwnerId);
    expect(rowOwnerId).not.toBe(appOwnerId);
};

describe(createEvoluStorageFactory.name, () => {
    it('stores wallet data and notifies subscribers', async () => {
        await using run = await testCreateRunWithEvoluDeps({
            createWebSocket: testCreateWebSocket({ throwOnCreate: true }),
        });
        const { evolu, shardOwner, storage } = await createTestStorage(run);
        const receivedWallets: SuiteSyncWallet[][] = [];
        const resolved = createDeferred<void>();

        const unsubscribe = storage.data.wallets.subscribe({
            onChange: data => {
                receivedWallets.push(data);
                resolved.resolve();
            },
        });

        const updateResult = storage.data.wallets.update({
            walletDescriptor: asWalletDescriptor('xpub123'),
            label: 'My Bitcoin Wallet',
        });

        expect(updateResult.success).toBe(true);

        await resolved.promise;

        expect(receivedWallets.length).toBe(1);
        expect(receivedWallets).toStrictEqual([
            [{ label: 'My Bitcoin Wallet', walletDescriptor: 'xpub123' }],
        ]);

        const rows = await evolu.loadQuery(createQuery(db => db.selectFrom('wallet').selectAll()));

        expect(rows).toHaveLength(1);
        await expectOwnerIdToUseShardOwner({
            evolu,
            ownerId: rows[0].ownerId,
            expectedOwnerId: shardOwner.id,
        });

        unsubscribe();
        await storage.dispose();
    });

    it('stores account data and notifies subscribers', async () => {
        await using run = await testCreateRunWithEvoluDeps({
            createWebSocket: testCreateWebSocket({ throwOnCreate: true }),
        });
        const { evolu, shardOwner, storage } = await createTestStorage(run);

        const receivedAccounts: SuiteSyncAccount[][] = [];
        const resolved = createDeferred<void>();

        const unsubscribe = storage.data.accounts.subscribe({
            onChange: data => {
                receivedAccounts.push(data);
                resolved.resolve();
            },
        });

        const updateResult = storage.data.accounts.update({
            accountDescriptor: asAccountDescriptor('xpub123'),
            networkSymbol: 'btc',
            label: 'My Bitcoin Account',
        });

        expect(updateResult.success).toBe(true);

        await resolved.promise;

        expect(receivedAccounts.length).toBe(1);
        expect(receivedAccounts).toStrictEqual([
            [
                {
                    id: 'xpub123-btc',
                    accountDescriptor: 'xpub123',
                    networkSymbol: 'btc',
                    label: 'My Bitcoin Account',
                },
            ],
        ]);

        const rows = await evolu.loadQuery(createQuery(db => db.selectFrom('account').selectAll()));

        expect(rows).toHaveLength(1);
        await expectOwnerIdToUseShardOwner({
            evolu,
            ownerId: rows[0].ownerId,
            expectedOwnerId: shardOwner.id,
        });

        unsubscribe();
        await storage.dispose();
    });

    it('stores address data and notifies subscribers', async () => {
        await using run = await testCreateRunWithEvoluDeps({
            createWebSocket: testCreateWebSocket({ throwOnCreate: true }),
        });
        const { evolu, shardOwner, storage } = await createTestStorage(run);

        const receivedAddresses: SuiteSyncAddress[][] = [];
        const resolved = createDeferred<void>();

        const unsubscribe = storage.data.addresses.subscribe({
            onChange: data => {
                receivedAddresses.push(data);
                resolved.resolve();
            },
        });

        const updateResult = storage.data.addresses.update({
            address: 'bc1test123',
            label: 'My Receive Address',
            accountDescriptor: asAccountDescriptor('xpub123'),
            networkSymbol: 'btc',
        });

        expect(updateResult.success).toBe(true);

        await resolved.promise;

        expect(receivedAddresses.length).toBe(1);
        expect(receivedAddresses).toStrictEqual([
            [
                {
                    id: 'bc1test123-btc',
                    address: 'bc1test123',
                    label: 'My Receive Address',
                    accountDescriptor: 'xpub123',
                    networkSymbol: 'btc',
                },
            ],
        ]);

        const rows = await evolu.loadQuery(createQuery(db => db.selectFrom('address').selectAll()));

        expect(rows).toHaveLength(1);
        await expectOwnerIdToUseShardOwner({
            evolu,
            ownerId: rows[0].ownerId,
            expectedOwnerId: shardOwner.id,
        });

        unsubscribe();
        await storage.dispose();
    });

    it('stores output data and notifies subscribers', async () => {
        await using run = await testCreateRunWithEvoluDeps({
            createWebSocket: testCreateWebSocket({ throwOnCreate: true }),
        });
        const { evolu, shardOwner, storage } = await createTestStorage(run);

        const receivedOutputs: SuiteSyncOutput[][] = [];
        const resolved = createDeferred<void>();

        const unsubscribe = storage.data.outputs.subscribe({
            onChange: data => {
                receivedOutputs.push(data);
                resolved.resolve();
            },
        });

        const updateResult = storage.data.outputs.update({
            txId: 'abc123txid',
            txTargetId: '0',
            label: 'Payment to Alice',
            accountDescriptor: asAccountDescriptor('xpub123'),
            networkSymbol: 'btc',
        });

        expect(updateResult.success).toBe(true);

        await resolved.promise;

        expect(receivedOutputs.length).toBe(1);
        expect(receivedOutputs).toStrictEqual([
            [
                {
                    id: 'abc123txid-0',
                    txId: 'abc123txid',
                    txTargetId: '0',
                    label: 'Payment to Alice',
                    accountDescriptor: 'xpub123',
                    networkSymbol: 'btc',
                },
            ],
        ]);

        const rows = await evolu.loadQuery(createQuery(db => db.selectFrom('output').selectAll()));

        expect(rows).toHaveLength(1);
        await expectOwnerIdToUseShardOwner({
            evolu,
            ownerId: rows[0].ownerId,
            expectedOwnerId: shardOwner.id,
        });

        unsubscribe();
        await storage.dispose();
    });
});
