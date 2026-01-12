import {
    EntityListener,
    SuiteSyncAccount,
    SuiteSyncAddress,
    SuiteSyncOutput,
    SuiteSyncStorage,
    SuiteSyncWallet,
    createSuiteSyncAccountId,
    createSuiteSyncAddressId,
    createSuiteSyncOutputId,
} from '@suite-common/suite-sync-storage';
import { SuiteSyncListener } from '@suite-common/suite-sync-types';
import { asAccountDescriptor, asWalletDescriptor } from '@suite-common/wallet-types';
import { StaticSessionId } from '@trezor/connect';
import { err, ok } from '@trezor/type-utils';

import { mockNotExpected } from '../../../tests/utils';
import { RefreshSuiteKeysUnavailable } from '../../createRefreshSuiteSyncKeys';
import { createSubscriptionStorage } from '../../storage/createSubscriptionStorage';
import { createSubscribeSuiteSyncData } from '../subscribeSuiteSyncData';

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

const createSuiteSyncStorageMock = (storageEmitter?: StorageSubscriptions): SuiteSyncStorage => ({
    data: {
        accounts: {
            subscribe: jest.fn(onChange => {
                storageEmitter?.accounts.push(onChange);

                return () => {};
            }),
            update: mockNotExpected('update'),
        },
        addresses: {
            subscribe: jest.fn(onChange => {
                storageEmitter?.addresses.push(onChange);

                return () => {};
            }),
            update: mockNotExpected('update'),
        },
        outputs: {
            subscribe: jest.fn(onChange => {
                storageEmitter?.outputs.push(onChange);

                return () => {};
            }),
            update: mockNotExpected('update'),
        },
        wallets: {
            subscribe: jest.fn(onChange => {
                storageEmitter?.wallets.push(onChange);

                return () => {};
            }),
            update: mockNotExpected('update'),
        },
    },
    dispose: mockNotExpected('dispose'),
    updateRelayUrl: mockNotExpected('updateRelayUrl'),
});

describe(createSubscribeSuiteSyncData.name, () => {
    it('fails when storage is not available', async () => {
        const suiteSyncListener = createListenerMock();
        const subscribeLabeling = createSubscribeSuiteSyncData({
            ensureStorage: () => Promise.resolve(err(RefreshSuiteKeysUnavailable())),
            subscriptionStorage: createSubscriptionStorage(),
            suiteSyncListener,
        });

        const result = await subscribeLabeling({ deviceStaticSessionId });

        expect(!result.success && result.error.type).toBe('RefreshSuiteKeysUnavailable');
    });

    it('subscribes labeling', async () => {
        const suiteSyncListener = createListenerMock();
        const storage = createSuiteSyncStorageMock();

        const subscribeLabeling = createSubscribeSuiteSyncData({
            ensureStorage: () => Promise.resolve(ok(storage)),
            subscriptionStorage: createSubscriptionStorage(),
            suiteSyncListener,
        });

        const result = await subscribeLabeling({ deviceStaticSessionId });

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

        const storage = createSuiteSyncStorageMock(storageEmitters);
        const subscribeLabeling = createSubscribeSuiteSyncData({
            ensureStorage: () => Promise.resolve(ok(storage)),
            subscriptionStorage: createSubscriptionStorage(),
            suiteSyncListener,
        });

        const result = await subscribeLabeling({ deviceStaticSessionId });

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
                    id: createSuiteSyncOutputId('transaction-id', 0),
                    networkSymbol: 'btc',
                    accountDescriptor: asAccountDescriptor('account-1'),
                    txId: 'transaction-id',
                    outputIndex: 0,
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
