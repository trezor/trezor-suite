import { type AccountLabels, type WalletLabels } from '@suite-common/metadata-types';
import type {
    AllLabelsForAccount,
    SelectAllLabelsForAccountParams,
} from '@suite-common/suite-sync';
import { type SuiteSyncUpdateError } from '@suite-common/suite-sync-storage';
import { type EnsureWalletSuiteSyncOnErrors } from '@suite-common/suite-sync-types';
import { type TrezorDeviceWithState } from '@suite-common/suite-types';
import type { Account, AccountKey, WalletDescriptor } from '@suite-common/wallet-types';
import { type StaticSessionId } from '@trezor/connect';

export type MigrationCounts = {
    changed: number;
    skipped: number;
};

export type MigrationError = {
    type: 'update-failed';
    entity: 'wallet' | 'account' | 'address' | 'output';
    deviceStaticSessionId: StaticSessionId;
    cause: EnsureWalletSuiteSyncOnErrors | SuiteSyncUpdateError;
};

export type GetDevices = () => TrezorDeviceWithState[];
export type GetAccountsByDeviceState = (deviceState: StaticSessionId) => Account[];
export type GetLegacyWalletLabels = (deviceState: StaticSessionId) => WalletLabels;
export type GetLegacyAccountLabels = (accountKey: AccountKey) => AccountLabels;
export type GetCurrentWalletLabel = (walletDescriptor: WalletDescriptor) => string | null;
export type GetCurrentAccountLabels = (
    params: SelectAllLabelsForAccountParams,
) => AllLabelsForAccount;
