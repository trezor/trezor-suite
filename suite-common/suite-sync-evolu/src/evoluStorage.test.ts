import { type Run, testCreateWebSocket } from '@evolu/common';
import type { EvoluPlatformDeps } from '@evolu/common/local-first';

import {
    type SuiteSyncAccount,
    type SuiteSyncAddress,
    type SuiteSyncOutput,
    type SuiteSyncOwner,
    type SuiteSyncWallet,
    asSuiteSyncOwnerId,
    asSuiteSyncOwnerSecretHex,
} from '@suite-common/suite-sync-storage';
import { asNetworkSymbol } from '@suite-common/wallet-config';
import { asAccountDescriptor } from '@suite-common/wallet-types';
import { asWalletDescriptor } from '@trezor/device-utils';
import { createDeferred } from '@trezor/utils';

import { createEvoluInstanceFactory } from './createEvoluInstance';
import { createEvoluStorageFactory } from './evoluStorage';
import { testCreateRunWithEvoluDeps } from '../mocks/testCreateRunWithEvoluDeps';

const btcSymbol = asNetworkSymbol('btc');

const suiteSyncOwner: SuiteSyncOwner = {
    ownerId: asSuiteSyncOwnerId('yg0UgROParTpm60ltI3hDw'),
    ownerSecret: asSuiteSyncOwnerSecretHex(
        'e17818d7c458f171885280eeef2d70078c6842b51e18ec6f2f8c9f44d3d171fd0f49a3aeff32a560d7f823321fcd24f8d8773ffa59855c6447b11af88a2fd7b5',
    ),
};

const createTestStorage = async (run: Run<EvoluPlatformDeps>) => {
    const evoluInstanceFactory = createEvoluInstanceFactory({ run });

    return await createEvoluStorageFactory({ evoluInstanceFactory })({ suiteSyncOwner });
};

describe(createEvoluStorageFactory.name, () => {
    it('forces a new sync round using the current relay', async () => {
        const createWebSocket = testCreateWebSocket();
        const firstSync = createDeferred<void>();
        const nextSync = createDeferred<void>();
        await using run = await testCreateRunWithEvoluDeps({
            createWebSocket: (url, options) => async taskRun => {
                const result = await createWebSocket(url, options)(taskRun);
                if (!result.ok) return result;

                return {
                    ...result,
                    value: {
                        ...result.value,
                        send: data => {
                            const sent = result.value.send(data);
                            if (createWebSocket.sentMessages.length === 1) firstSync.resolve();
                            if (createWebSocket.sentMessages.length === 3) nextSync.resolve();

                            return sent;
                        },
                    },
                };
            },
        });
        const storage = await createTestStorage(run);

        await storage.updateRelayUrl('ws://relay.example.com');
        await firstSync.promise;
        await storage.forceResync();
        await nextSync.promise;

        // Unsubscribing and subscribing again must send a fresh sync request to the same relay.
        expect(createWebSocket.sentMessages[2]).toEqual(createWebSocket.sentMessages[0]);
        await storage.dispose();
    });

    it('does not enable syncing when forceResync is called before connecting', async () => {
        await using run = await testCreateRunWithEvoluDeps({
            createWebSocket: testCreateWebSocket({ throwOnCreate: true }),
        });
        const storage = await createTestStorage(run);

        await storage.forceResync();

        await storage.dispose();
    });

    it('does not resume syncing after disconnecting or disposing the storage', async () => {
        await using run = await testCreateRunWithEvoluDeps({
            createWebSocket: testCreateWebSocket(),
        });
        const evolu = await createEvoluInstanceFactory({ run })({ suiteSyncOwner });
        const useOwner = jest.spyOn(evolu, 'useOwner');
        const storage = await createEvoluStorageFactory({
            evoluInstanceFactory: () => Promise.resolve(evolu),
        })({ suiteSyncOwner });
        await storage.updateRelayUrl('ws://relay.example.com');

        await storage.disconnectRelay();
        await storage.forceResync();

        expect(useOwner).toHaveBeenCalledTimes(1);

        await storage.dispose();
        await storage.forceResync();

        expect(useOwner).toHaveBeenCalledTimes(1);
    });

    it('stores wallet data and notifies subscribers', async () => {
        await using run = await testCreateRunWithEvoluDeps({
            createWebSocket: testCreateWebSocket({ throwOnCreate: true }),
        });
        const storage = await createTestStorage(run);
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

        unsubscribe();
        await storage.dispose();
    });

    it('stores account data and notifies subscribers', async () => {
        await using run = await testCreateRunWithEvoluDeps({
            createWebSocket: testCreateWebSocket({ throwOnCreate: true }),
        });
        const storage = await createTestStorage(run);

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
            networkSymbol: btcSymbol,
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

        unsubscribe();
        await storage.dispose();
    });

    it('stores address data and notifies subscribers', async () => {
        await using run = await testCreateRunWithEvoluDeps({
            createWebSocket: testCreateWebSocket({ throwOnCreate: true }),
        });
        const storage = await createTestStorage(run);

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
            networkSymbol: btcSymbol,
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

        unsubscribe();
        await storage.dispose();
    });

    it('stores output data and notifies subscribers', async () => {
        await using run = await testCreateRunWithEvoluDeps({
            createWebSocket: testCreateWebSocket({ throwOnCreate: true }),
        });
        const storage = await createTestStorage(run);

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
            networkSymbol: btcSymbol,
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

        unsubscribe();
        await storage.dispose();
    });
});
