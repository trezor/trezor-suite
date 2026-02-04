import { DbWorkerInput, deriveShardOwner } from '@evolu/common/local-first';

import {
    SuiteSyncAccount,
    SuiteSyncAddress,
    SuiteSyncOutput,
    SuiteSyncWallet,
} from '@suite-common/suite-sync-storage';
import {
    SuiteSyncOwner,
    asSuiteSyncOwnerId,
    asSuiteSyncOwnerSecretHex,
} from '@suite-common/suite-types';
import { asAccountDescriptor, asWalletDescriptor } from '@suite-common/wallet-types';
import { createDeferred } from '@trezor/utils';

import { createEvoluInstanceFactory } from '../src/createEvoluInstance';
import { createEvoluStorageFactory } from '../src/evoluStorage';
import { createNodeEvoluDeps } from './utils/createNodeEvoluDeps';
import { createEvoluAppOwnerFromTrezorData } from '../src/createEvoluAppOwnerFromTrezorData';

const suiteSyncOwner: SuiteSyncOwner = {
    ownerId: asSuiteSyncOwnerId('yg0UgROParTpm60ltI3hDw'),
    ownerSecret: asSuiteSyncOwnerSecretHex(
        'e17818d7c458f171885280eeef2d70078c6842b51e18ec6f2f8c9f44d3d171fd0f49a3aeff32a560d7f823321fcd24f8d8773ffa59855c6447b11af88a2fd7b5',
    ),
};

const appOwner = createEvoluAppOwnerFromTrezorData({
    data: suiteSyncOwner.ownerSecret,
});

if (!appOwner.ok) {
    throw new Error('Invalid App owner');
}

const shardOwner1 = deriveShardOwner(appOwner.value, ['trezor-suite', '1']);

const createTestStorage = (nameSuffix: string) => {
    const mockEvoluStuff = createNodeEvoluDeps();

    const createEvoluInstance = createEvoluInstanceFactory({
        suiteSyncErrorHandler: () => {},
        evoluDeps: mockEvoluStuff.evoluDeps,
        _evoluDbNameSuffix: nameSuffix,
    });

    // This test shall not connect anywhere, websocket impl. is mocked to empty.
    // This localhost is to make sure it won't connect in case of misconfiguration.
    const relayUrl = 'http://localhost:4000';

    return {
        storage: createEvoluStorageFactory({ createEvoluInstance })({ suiteSyncOwner, relayUrl }),
        postMessageCalls: mockEvoluStuff.postMessageCalls,
    };
};

const assetMutationsToMatchShard1Owner = (postMessageCalls: DbWorkerInput[]) => {
    const mutations = postMessageCalls.filter(it => it.type === 'mutate');
    expect(mutations.length).toBe(1);
    expect(mutations[0].changes.length).toBe(1);
    expect(mutations[0].changes[0].ownerId).toBe(shardOwner1.id);
};

describe(createEvoluStorageFactory.name, () => {
    it('stores wallet data and notifies subscribers', async () => {
        const { storage, postMessageCalls } = createTestStorage('wallets');

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
        assetMutationsToMatchShard1Owner(postMessageCalls);

        unsubscribe();
        await storage.dispose();
    });

    it('stores account data and notifies subscribers', async () => {
        const { storage, postMessageCalls } = createTestStorage('accounts');

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
        assetMutationsToMatchShard1Owner(postMessageCalls);

        unsubscribe();
        await storage.dispose();
    });

    it('stores address data and notifies subscribers', async () => {
        const { storage, postMessageCalls } = createTestStorage('addresses');

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
        assetMutationsToMatchShard1Owner(postMessageCalls);

        unsubscribe();
        await storage.dispose();
    });

    it('stores output data and notifies subscribers', async () => {
        const { storage, postMessageCalls } = createTestStorage('outputs');

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
            outputIndex: '0',
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
                    outputIndex: '0',
                    label: 'Payment to Alice',
                    accountDescriptor: 'xpub123',
                    networkSymbol: 'btc',
                },
            ],
        ]);
        assetMutationsToMatchShard1Owner(postMessageCalls);

        unsubscribe();
        await storage.dispose();
    });
});
