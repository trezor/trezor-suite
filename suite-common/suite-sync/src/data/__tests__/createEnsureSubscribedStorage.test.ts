import { createMockDeps } from '@suite-common/dependency-injection';
import {
    type EntityListener,
    type SuiteSyncAccount,
    type SuiteSyncAddress,
    type SuiteSyncOutput,
    type SuiteSyncWallet,
    createSuiteSyncAccountId,
    createSuiteSyncAddressId,
    createSuiteSyncOutputId,
} from '@suite-common/suite-sync-storage';
import { type SuiteSyncListener } from '@suite-common/suite-sync-types';
import { asAccountDescriptor, asWalletDescriptor } from '@suite-common/wallet-types';
import { type StaticSessionId } from '@trezor/connect';
import { err, ok } from '@trezor/type-utils';

import { createSuiteSyncStorageMock } from '../../../tests/createSuiteSyncStorageMock.mock';
import { SuiteSyncUnavailableOnDeviceError } from '../../createEnsureSuiteSyncKeys';
import { createStorageIdFromDeviceStaticSessionId } from '../../storage/createStorageIdFromDeviceStaticSessionId';
import { createSubscriptionStorage } from '../../storage/createSubscriptionStorage';
import {
    type CreateEnsureSubscribedStorageDeps,
    createEnsureSubscribedStorage,
} from '../createEnsureSubscribedStorage';

const deviceStaticSessionId: StaticSessionId = '1@2:3';

const createListenerMock = (): SuiteSyncListener => ({
    onUnsubscribe: jest.fn(),
    onEntityChange: {
        accounts: jest.fn(),
        addresses: jest.fn(),
        outputs: jest.fn(),
        wallets: jest.fn(),
    },
});

type StorageSubscriptions = {
    accounts: EntityListener<SuiteSyncAccount>[];
    addresses: EntityListener<SuiteSyncAddress>[];
    outputs: EntityListener<SuiteSyncOutput>[];
    wallets: EntityListener<SuiteSyncWallet>[];
};

const createStorageWithEmitters = (storageEmitter: StorageSubscriptions) =>
    createSuiteSyncStorageMock({
        accounts: {
            subscribe: onChange => {
                storageEmitter.accounts.push(onChange);

                return () => {};
            },
        },
        addresses: {
            subscribe: onChange => {
                storageEmitter.addresses.push(onChange);

                return () => {};
            },
        },
        outputs: {
            subscribe: onChange => {
                storageEmitter.outputs.push(onChange);

                return () => {};
            },
        },
        wallets: {
            subscribe: onChange => {
                storageEmitter.wallets.push(onChange);

                return () => {};
            },
        },
    });

describe(createEnsureSubscribedStorage.name, () => {
    it('fails when storage is not available', async () => {
        const suiteSyncListener = createListenerMock();
        const storageResult = err(SuiteSyncUnavailableOnDeviceError());

        const deps = createMockDeps<CreateEnsureSubscribedStorageDeps>({
            ensureStorage: () => Promise.resolve(storageResult),
            subscriptionStorage: createSubscriptionStorage(),
            suiteSyncListener,
        });

        const ensureSubscribedStorage = createEnsureSubscribedStorage(deps);
        const result = await ensureSubscribedStorage({ deviceStaticSessionId, isWriteMode: false });

        expect(deps.ensureStorage).toHaveBeenCalledWith({
            deviceStaticSessionId,
            isWriteMode: false,
        });
        expect(result).toBe(storageResult);
    });

    it('returns early when subscription already exists', async () => {
        const suiteSyncListener = createListenerMock();
        const storage = createSuiteSyncStorageMock({
            wallets: { subscribe: () => () => {} },
            accounts: { subscribe: () => () => {} },
            addresses: { subscribe: () => () => {} },
            outputs: { subscribe: () => () => {} },
        });

        const subscriptionStorage = createSubscriptionStorage();
        // Pre-populate subscription storage to simulate existing subscription
        const storageId = createStorageIdFromDeviceStaticSessionId(deviceStaticSessionId);
        subscriptionStorage.add({
            storageId,
            unsubscribe: jest.fn(),
        });

        const deps = createMockDeps<CreateEnsureSubscribedStorageDeps>({
            ensureStorage: () => Promise.resolve(ok(storage)),
            subscriptionStorage,
            suiteSyncListener,
        });

        const ensureSubscribedStorage = createEnsureSubscribedStorage(deps);
        const result = await ensureSubscribedStorage({ deviceStaticSessionId, isWriteMode: false });

        expect(deps.ensureStorage).toHaveBeenCalledWith({
            deviceStaticSessionId,
            isWriteMode: false,
        });
        expect(result.success && result.payload).toBe(storage);
    });

    it('subscribes labeling', async () => {
        const suiteSyncListener = createListenerMock();
        const storage = createSuiteSyncStorageMock({
            wallets: { subscribe: () => () => {} },
            accounts: { subscribe: () => () => {} },
            addresses: { subscribe: () => () => {} },
            outputs: { subscribe: () => () => {} },
        });

        const deps = createMockDeps<CreateEnsureSubscribedStorageDeps>({
            ensureStorage: () => Promise.resolve(ok(storage)),
            subscriptionStorage: createSubscriptionStorage(),
            suiteSyncListener,
        });

        const ensureSubscribedStorage = createEnsureSubscribedStorage(deps);
        const result = await ensureSubscribedStorage({ deviceStaticSessionId, isWriteMode: false });

        expect(deps.ensureStorage).toHaveBeenCalledWith({
            deviceStaticSessionId,
            isWriteMode: false,
        });
        expect(result.success).toBe(true);

        expect(storage.data.wallets.subscribe).toHaveBeenCalledTimes(1);
        expect(storage.data.accounts.subscribe).toHaveBeenCalledTimes(1);
        expect(storage.data.addresses.subscribe).toHaveBeenCalledTimes(1);
        expect(storage.data.outputs.subscribe).toHaveBeenCalledTimes(1);
    });

    it('subscription emit actions', async () => {
        const suiteSyncListener = createListenerMock();

        const storageEmitters: StorageSubscriptions = {
            wallets: [],
            accounts: [],
            addresses: [],
            outputs: [],
        };

        const storage = createStorageWithEmitters(storageEmitters);

        const deps = createMockDeps<CreateEnsureSubscribedStorageDeps>({
            ensureStorage: () => Promise.resolve(ok(storage)),
            subscriptionStorage: createSubscriptionStorage(),
            suiteSyncListener,
        });

        const ensureSubscribedStorage = createEnsureSubscribedStorage(deps);

        const result = await ensureSubscribedStorage({ deviceStaticSessionId, isWriteMode: false });

        expect(result.success).toBe(true);

        storageEmitters.wallets.forEach(it =>
            it.onChange([{ walletDescriptor: asWalletDescriptor('1'), label: 'Wallet Label' }]),
        );
        expect(suiteSyncListener.onEntityChange.wallets).toHaveBeenCalledWith(
            deviceStaticSessionId,
            [{ label: 'Wallet Label', walletDescriptor: '1' }],
        );

        storageEmitters.accounts.forEach(it =>
            it.onChange([
                {
                    id: createSuiteSyncAccountId(asAccountDescriptor('account-1'), 'btc'),
                    accountDescriptor: asAccountDescriptor('account-1'),
                    label: 'Account for Drugs',
                    networkSymbol: 'btc',
                },
            ]),
        );
        expect(suiteSyncListener.onEntityChange.accounts).toHaveBeenCalledWith(
            deviceStaticSessionId,
            [
                {
                    id: 'account-1-btc',
                    accountDescriptor: 'account-1',
                    label: 'Account for Drugs',
                    networkSymbol: 'btc',
                },
            ],
        );

        storageEmitters.addresses.forEach(it =>
            it.onChange([
                {
                    id: createSuiteSyncAddressId('address', 'btc'),
                    networkSymbol: 'btc',
                    accountDescriptor: asAccountDescriptor('account-1'),
                    address: 'address',
                    label: 'Address for drugs',
                },
            ]),
        );
        expect(suiteSyncListener.onEntityChange.addresses).toHaveBeenCalledWith(
            deviceStaticSessionId,
            [
                {
                    id: 'address-btc',
                    accountDescriptor: 'account-1',
                    address: 'address',
                    label: 'Address for drugs',
                    networkSymbol: 'btc',
                },
            ],
        );

        storageEmitters.outputs.forEach(it =>
            it.onChange([
                {
                    id: createSuiteSyncOutputId('transaction-id', '0'),
                    networkSymbol: 'btc',
                    accountDescriptor: asAccountDescriptor('account-1'),
                    txId: 'transaction-id',
                    txTargetId: '0',
                    label: 'Output spend for buying drugs',
                },
            ]),
        );
        expect(suiteSyncListener.onEntityChange.wallets).toHaveBeenCalledWith(
            deviceStaticSessionId,
            [{ label: 'Wallet Label', walletDescriptor: '1' }],
        );
    });
});
