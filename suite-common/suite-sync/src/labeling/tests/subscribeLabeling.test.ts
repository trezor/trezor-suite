import {
    AccountLabel,
    AddressLabel,
    OutputLabel,
    SuiteSyncStorage,
    WalletLabel,
} from '@suite-common/suite-sync-storage';
import { asAccountDescriptor, asWalletDescriptor } from '@suite-common/wallet-types';
import { StaticSessionId } from '@trezor/connect';
import { err, ok } from '@trezor/type-utils';

import { mockNotExpected } from '../../../tests/utils';
import { RefreshSuiteKeysUnavailable } from '../../refreshSuiteSyncKeys';
import { createSubscriptionStorage } from '../../storage/subscriptionStorage';
import { createSubscribeLabeling } from '../subscribeLabeling';

const deviceStaticSessionId: StaticSessionId = '1@2:3';

type StorageSubscriptions = {
    accountLabels: ((payload: AccountLabel) => void)[];
    addressLabels: ((payload: AddressLabel) => void)[];
    outputLabels: ((payload: OutputLabel) => void)[];
    walletLabels: ((payload: WalletLabel) => void)[];
};

const createSuiteSyncStorageMock = (subscriptions?: StorageSubscriptions): SuiteSyncStorage => ({
    accountLabels: {
        subscribe: jest.fn(onChange => {
            subscriptions?.accountLabels.push(onChange);

            return () => {};
        }),
        update: mockNotExpected('update'),
    },
    addressLabels: {
        subscribe: jest.fn(onChange => {
            subscriptions?.addressLabels.push(onChange);

            return () => {};
        }),
        update: mockNotExpected('update'),
    },
    outputLabels: {
        subscribe: jest.fn(onChange => {
            subscriptions?.outputLabels.push(onChange);

            return () => {};
        }),
        update: mockNotExpected('update'),
    },
    walletLabels: {
        subscribe: jest.fn(onChange => {
            subscriptions?.walletLabels.push(onChange);

            return () => {};
        }),
        update: mockNotExpected('update'),
    },
    dispose: mockNotExpected('dispose'),
    updateRelayUrl: mockNotExpected('updateRelayUrl'),
});

describe(createSubscribeLabeling.name, () => {
    it('fails when storage is not available', async () => {
        const subscribeLabeling = createSubscribeLabeling({
            dispatch: () => {},
            ensureStorage: () => Promise.resolve(err(RefreshSuiteKeysUnavailable())),
            subscriptionStorage: createSubscriptionStorage(),
        });

        const result = await subscribeLabeling({ deviceStaticSessionId });

        expect(!result.ok && result.error.type).toBe('RefreshSuiteKeysUnavailable');
    });

    it('subscribes labeling', async () => {
        const storage = createSuiteSyncStorageMock();
        const subscribeLabeling = createSubscribeLabeling({
            dispatch: () => {},
            ensureStorage: () => Promise.resolve(ok(storage)),
            subscriptionStorage: createSubscriptionStorage(),
        });

        const result = await subscribeLabeling({ deviceStaticSessionId });

        expect(result.ok).toBe(true);

        expect(storage.walletLabels.subscribe).toHaveBeenCalledTimes(1);
        expect(storage.accountLabels.subscribe).toHaveBeenCalledTimes(1);
        expect(storage.addressLabels.subscribe).toHaveBeenCalledTimes(1);
        expect(storage.outputLabels.subscribe).toHaveBeenCalledTimes(1);
    });

    it('subscription emit actions', async () => {
        const subscriptions: StorageSubscriptions = {
            walletLabels: [],
            accountLabels: [],
            addressLabels: [],
            outputLabels: [],
        };

        const actions: any[] = [];
        const storage = createSuiteSyncStorageMock(subscriptions);
        const subscribeLabeling = createSubscribeLabeling({
            dispatch: (action: any) => actions.push(action),
            ensureStorage: () => Promise.resolve(ok(storage)),
            subscriptionStorage: createSubscriptionStorage(),
        });

        const result = await subscribeLabeling({ deviceStaticSessionId });

        expect(result.ok).toBe(true);

        subscriptions.walletLabels.forEach(it =>
            it({ walletDescriptor: asWalletDescriptor('1'), label: 'Wallet Label' }),
        );
        expect(actions).toStrictEqual([
            {
                payload: { label: 'Wallet Label', walletDescriptor: '1' },
                type: '@suite/labeling/set-device-label',
            },
        ]);

        actions.pop();
        subscriptions.accountLabels.forEach(it =>
            it({
                accountDescriptor: asAccountDescriptor('account-1'),
                label: 'Account for Drugs',
                networkSymbol: 'btc',
            }),
        );
        expect(actions).toStrictEqual([
            {
                payload: {
                    accountDescriptor: 'account-1',
                    label: 'Account for Drugs',
                    networkSymbol: 'btc',
                    walletDescriptor: '1',
                },
                type: '@suite/labeling/set-account-label',
            },
        ]);

        actions.pop();
        subscriptions.addressLabels.forEach(it =>
            it({
                networkSymbol: 'btc',
                accountDescriptor: asAccountDescriptor('account-1'),
                address: 'address',
                label: 'Address for drugs',
            }),
        );
        expect(actions).toStrictEqual([
            {
                payload: {
                    accountDescriptor: 'account-1',
                    address: 'address',
                    label: 'Address for drugs',
                    networkSymbol: 'btc',
                    walletDescriptor: '1',
                },
                type: '@suite/labeling/set-address-label',
            },
        ]);

        actions.pop();
        subscriptions.outputLabels.forEach(it =>
            it({
                networkSymbol: 'btc',
                accountDescriptor: asAccountDescriptor('account-1'),
                txId: 'transaction-id',
                outputIndex: 0,
                label: 'Output spend for buying drugs',
            }),
        );
        expect(actions).toStrictEqual([
            {
                payload: {
                    accountDescriptor: 'account-1',
                    label: 'Output spend for buying drugs',
                    networkSymbol: 'btc',
                    walletDescriptor: '1',
                    outputIndex: 0,
                    txId: 'transaction-id',
                },
                type: '@suite/labeling/set-output-label',
            },
        ]);
    });
});
