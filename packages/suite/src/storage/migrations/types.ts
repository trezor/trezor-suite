import type { OnUpgradeFunc } from '@trezor/suite-storage';
import type { SuiteDBSchema } from '../definitions';
import type { CustomBackend } from '@wallet-types/backend';
import type { Network } from '@wallet-types';
import type { DBWalletAccountTransaction } from '@trezor/suite/src/storage/definitions';

export type WalletWithBackends = {
    backends?: Partial<{
        [coin in Network['symbol']]: Omit<CustomBackend, 'coin'>;
    }>;
};

export type DBWalletAccountTransactionCompatible = {
    order: DBWalletAccountTransaction['order'];
    tx: DBWalletAccountTransaction['tx'] & { totalSpent: string };
};

export type DBMigration = (params: {
    db: Parameters<OnUpgradeFunc<SuiteDBSchema>>[0];
    oldVersion: Parameters<OnUpgradeFunc<SuiteDBSchema>>[1];
    newVersion: Parameters<OnUpgradeFunc<SuiteDBSchema>>[2];
    transaction: Parameters<OnUpgradeFunc<SuiteDBSchema>>[3];
}) => void | Promise<void>;
