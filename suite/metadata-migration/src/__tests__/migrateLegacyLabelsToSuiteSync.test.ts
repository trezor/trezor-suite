import { createMockDeps } from '@suite-common/dependency-injection';
import { isTrezorDeviceWithState } from '@suite-common/device';
import type { AllLabelsForAccount } from '@suite-common/suite-sync';
import {
    createSuiteSyncAddressId,
    createSuiteSyncOutputId,
    createSuiteSyncUpdateError,
} from '@suite-common/suite-sync-storage';
import type { SuiteSyncAddress, SuiteSyncOutput } from '@suite-common/suite-sync-storage';
import type { TrezorDeviceWithState } from '@suite-common/suite-types';
import { mockSuiteDevice } from '@suite-common/suite-types/mocks';
import type { NetworkSymbol } from '@suite-common/wallet-config';
import { asAccountDescriptor, asTxTargetId } from '@suite-common/wallet-types';
import { mockWalletAccount } from '@suite-common/wallet-types/mocks';
import type { StaticSessionId } from '@trezor/connect';
import { err, ok } from '@trezor/type-utils';

import {
    type MigrateAccountLabelsDeps,
    createMigrateAccountLabels,
} from '../entities/createMigrateAccountLabels';
import {
    type MigrateAddressLabelsDeps,
    createMigrateAddressLabels,
} from '../entities/createMigrateAddressLabels';
import {
    type MigrateOutputLabelsDeps,
    createMigrateOutputLabels,
} from '../entities/createMigrateOutputLabels';
import {
    type MigrateWalletLabelsDeps,
    createMigrateWalletLabels,
} from '../entities/createMigrateWalletLabels';
import {
    type GetCurrentAccountLabels,
    type GetLegacyAccountLabels,
} from '../legacyLabelsMigration';
import {
    type MigrateLegacyLabelsToSuiteSync,
    type MigrateLegacyLabelsToSuiteSyncDeps,
    createMigrateLegacyLabelsToSuiteSync,
} from '../migrateLegacyLabelsToSuiteSync';

const createDevice = (staticSessionId: StaticSessionId): TrezorDeviceWithState => {
    const device = mockSuiteDevice({
        connected: true,
        available: true,
        id: 'device-id',
        state: { staticSessionId },
    });

    if (!isTrezorDeviceWithState(device)) {
        throw new Error('Expected device with static session id');
    }

    return device;
};

const createAccount = (params: {
    descriptor: string;
    symbol: NetworkSymbol;
    deviceState: StaticSessionId;
}) =>
    mockWalletAccount({
        deviceState: params.deviceState,
        descriptor: asAccountDescriptor(params.descriptor),
        symbol: params.symbol,
    });

const getLegacyAccountLabels: GetLegacyAccountLabels = () => ({
    accountLabel: undefined,
    addressLabels: {},
    outputLabels: {},
});

const createCurrentAccountLabels = (
    overrides: Partial<AllLabelsForAccount> = {},
): AllLabelsForAccount => ({
    accountLabel: null,
    addressLabels: [],
    outputLabels: [],
    ...overrides,
});

const getCurrentAccountLabels: GetCurrentAccountLabels = () => createCurrentAccountLabels();

const createSuiteSyncAddressLabel = (
    address: string,
    label: string,
    accountDescriptor = asAccountDescriptor('descriptor-1'),
    networkSymbol: NetworkSymbol = 'btc',
): SuiteSyncAddress => ({
    id: createSuiteSyncAddressId(address, networkSymbol),
    address,
    label,
    accountDescriptor,
    networkSymbol,
});

const createSuiteSyncOutputLabel = (
    txId: string,
    txTargetId: string,
    label: string,
    accountDescriptor = asAccountDescriptor('descriptor-1'),
    networkSymbol: NetworkSymbol = 'btc',
): SuiteSyncOutput => {
    const targetId = asTxTargetId(txTargetId);

    return {
        id: createSuiteSyncOutputId(txId, targetId),
        txId,
        txTargetId: targetId,
        label,
        accountDescriptor,
        networkSymbol,
    };
};

const createMigrate = (
    overrides: Partial<
        MigrateLegacyLabelsToSuiteSyncDeps &
            MigrateWalletLabelsDeps &
            MigrateAccountLabelsDeps &
            MigrateAddressLabelsDeps &
            MigrateOutputLabelsDeps
    > = {},
): MigrateLegacyLabelsToSuiteSync => {
    const deps = createMockDeps({
        getDevices: () => [createDevice('device@wallet:1')],
        getAccountsByDeviceState: () => [],
        getLegacyWalletLabels: () => ({ walletLabel: 'Legacy wallet' }),
        getLegacyAccountLabels,
        getCurrentWalletLabel: () => null,
        getCurrentAccountLabels,
        updateWalletLabel: () => Promise.resolve(ok()),
        updateAccountLabel: () => Promise.resolve(ok()),
        updateAddressLabel: () => Promise.resolve(ok()),
        updateOutputLabel: () => Promise.resolve(ok()),
        ...overrides,
    });

    return createMigrateLegacyLabelsToSuiteSync({
        getDevices: deps.getDevices,
        getAccountsByDeviceState: deps.getAccountsByDeviceState,
        getLegacyAccountLabels: deps.getLegacyAccountLabels,
        getCurrentAccountLabels: deps.getCurrentAccountLabels,

        migrateWalletLabels: createMigrateWalletLabels({
            getLegacyWalletLabels: deps.getLegacyWalletLabels,
            getCurrentWalletLabel: deps.getCurrentWalletLabel,
            updateWalletLabel: deps.updateWalletLabel,
        }),
        migrateAccountLabels: createMigrateAccountLabels({
            updateAccountLabel: deps.updateAccountLabel,
        }),
        migrateAddressLabels: createMigrateAddressLabels({
            updateAddressLabel: deps.updateAddressLabel,
        }),
        migrateOutputLabels: createMigrateOutputLabels({
            updateOutputLabel: deps.updateOutputLabel,
        }),
    });
};

describe(createMigrateLegacyLabelsToSuiteSync.name, () => {
    it('migrates missing wallet, account, address, and output labels', async () => {
        const updateWalletLabel = jest.fn(() => Promise.resolve(ok()));
        const updateAccountLabel = jest.fn(() => Promise.resolve(ok()));
        const updateAddressLabel = jest.fn(() => Promise.resolve(ok()));
        const updateOutputLabel = jest.fn(() => Promise.resolve(ok()));

        const migrateLegacyLabelsToSuiteSync = createMigrate({
            getDevices: () => [createDevice('device@wallet:1')],
            getAccountsByDeviceState: () => [
                createAccount({
                    descriptor: 'descriptor-1',
                    symbol: 'btc',
                    deviceState: 'device@wallet:1',
                }),
            ],
            getLegacyWalletLabels: () => ({ walletLabel: 'Legacy wallet' }),
            getLegacyAccountLabels: () => ({
                accountLabel: 'Legacy account',
                addressLabels: { address1: 'Legacy address' },
                outputLabels: { tx1: { '0': 'Legacy output' } },
            }),
            updateWalletLabel,
            updateAccountLabel,
            updateAddressLabel,
            updateOutputLabel,
        });

        const result = await migrateLegacyLabelsToSuiteSync();

        expect(result).toEqual(ok({ changed: 4, skipped: 0 }));

        expect(updateWalletLabel).toHaveBeenCalledTimes(1);
        expect(updateAccountLabel).toHaveBeenCalledTimes(1);
        expect(updateAddressLabel).toHaveBeenCalledTimes(1);
        expect(updateOutputLabel).toHaveBeenCalledTimes(1);
    });

    it('skips labels already present in SuiteSync and ignores devices without static session id', async () => {
        const migrateLegacyLabelsToSuiteSync = createMigrate({
            getDevices: () =>
                [createDevice('device@wallet:1'), mockSuiteDevice()].filter(
                    isTrezorDeviceWithState,
                ),
            getAccountsByDeviceState: () => [
                createAccount({
                    descriptor: 'descriptor-1',
                    symbol: 'btc',
                    deviceState: 'device@wallet:1',
                }),
            ],
            getLegacyWalletLabels: () => ({ walletLabel: 'Legacy wallet' }),
            getLegacyAccountLabels: () => ({
                accountLabel: 'Legacy account',
                addressLabels: { address1: 'Legacy address' },
                outputLabels: { tx1: { '0': 'Legacy output' } },
            }),
            getCurrentWalletLabel: () => 'SuiteSync wallet',
            getCurrentAccountLabels: () =>
                createCurrentAccountLabels({
                    accountLabel: 'SuiteSync account',
                    addressLabels: [createSuiteSyncAddressLabel('address1', 'SuiteSync address')],
                    outputLabels: [createSuiteSyncOutputLabel('tx1', '0', 'SuiteSync output')],
                }),
        });

        const result = await migrateLegacyLabelsToSuiteSync();

        expect(result).toEqual(ok({ changed: 0, skipped: 4 }));
    });

    it('is idempotent across repeated runs', async () => {
        let hasWalletLabel = false;

        const updateWalletLabel = jest.fn(() => {
            hasWalletLabel = true;

            return Promise.resolve(ok());
        });

        const migrateLegacyLabelsToSuiteSync = createMigrate({
            getCurrentWalletLabel: () => (hasWalletLabel ? 'Legacy wallet' : null),
            updateWalletLabel,
        });

        const firstRun = await migrateLegacyLabelsToSuiteSync();
        const secondRun = await migrateLegacyLabelsToSuiteSync();

        expect(firstRun).toEqual(ok({ changed: 1, skipped: 0 }));
        expect(secondRun).toEqual(ok({ changed: 0, skipped: 1 }));

        expect(updateWalletLabel).toHaveBeenCalledTimes(1);
    });

    it('returns typed failure when a SuiteSync update fails', async () => {
        const migrateLegacyLabelsToSuiteSync = createMigrate({
            updateWalletLabel: () =>
                Promise.resolve(err(createSuiteSyncUpdateError({ reason: 'boom' }))),
        });

        await expect(migrateLegacyLabelsToSuiteSync()).resolves.toEqual({
            success: false,
            error: {
                type: 'update-failed',
                entity: 'wallet',
                deviceStaticSessionId: 'device@wallet:1',
                cause: createSuiteSyncUpdateError({ reason: 'boom' }),
            },
        });
    });
});
