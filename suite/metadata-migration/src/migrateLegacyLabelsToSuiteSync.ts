import type { TrezorDeviceWithState } from '@suite-common/suite-types';
import { parseDeviceStaticSessionId } from '@suite-common/wallet-utils';
import { err, ok } from '@trezor/type-utils';
import type { Result } from '@trezor/type-utils';

import type { MigrateAccountLabelsDep } from './entities/createMigrateAccountLabels';
import type { MigrateAddressLabelsDep } from './entities/createMigrateAddressLabels';
import type { MigrateOutputLabelsDep } from './entities/createMigrateOutputLabels';
import type {
    MigrateWalletLabelsDep,
    MigrateWalletLabelsParams,
} from './entities/createMigrateWalletLabels';
import type {
    GetAccountsByDeviceState,
    GetCurrentAccountLabels,
    GetLegacyAccountLabels,
    MigrationCounts,
    MigrationError,
} from './legacyLabelsMigration';
import { createAccountLabelsParams } from './migrationUtils';

export type MigrateLegacyLabelsToSuiteSync = (
    selectedDevice: TrezorDeviceWithState,
) => Promise<Result<MigrationCounts, MigrationError>>;

export type MigrateLegacyLabelsToSuiteSyncDeps = {
    getAccountsByDeviceState: GetAccountsByDeviceState;
    getLegacyAccountLabels: GetLegacyAccountLabels;
    getCurrentAccountLabels: GetCurrentAccountLabels;
} & MigrateWalletLabelsDep &
    MigrateAccountLabelsDep &
    MigrateAddressLabelsDep &
    MigrateOutputLabelsDep;

export const createMigrateLegacyLabelsToSuiteSync =
    (deps: MigrateLegacyLabelsToSuiteSyncDeps): MigrateLegacyLabelsToSuiteSync =>
    async selectedDevice => {
        let changed = 0;
        let skipped = 0;

        const deviceStaticSessionId = selectedDevice.state.staticSessionId;
        const { walletDescriptor } = parseDeviceStaticSessionId(deviceStaticSessionId);
        const walletLabelsParams: MigrateWalletLabelsParams = {
            deviceStaticSessionId,
            walletDescriptor,
        };
        const walletLabelsResult = await deps.migrateWalletLabels(walletLabelsParams);

        if (!walletLabelsResult.success) {
            return err({
                ...walletLabelsResult.error,
                deviceStaticSessionId,
            });
        }

        changed += walletLabelsResult.payload.changed;
        skipped += walletLabelsResult.payload.skipped;

        const accounts = deps.getAccountsByDeviceState(deviceStaticSessionId);

        for (const account of accounts) {
            const legacyAccountLabels = deps.getLegacyAccountLabels(account.key);
            const currentAccountLabels = deps.getCurrentAccountLabels(
                createAccountLabelsParams(account),
            );

            const accountLabelsResult = await deps.migrateAccountLabels({
                account,
                legacyAccountLabels,
                currentAccountLabels,
            });

            if (!accountLabelsResult.success) {
                return err({
                    ...accountLabelsResult.error,
                    deviceStaticSessionId,
                });
            }

            changed += accountLabelsResult.payload.changed;
            skipped += accountLabelsResult.payload.skipped;

            const addressLabelsResult = await deps.migrateAddressLabels({
                account,
                legacyAccountLabels,
                currentAccountLabels,
            });

            if (!addressLabelsResult.success) {
                return err({
                    ...addressLabelsResult.error,
                    deviceStaticSessionId,
                });
            }

            changed += addressLabelsResult.payload.changed;
            skipped += addressLabelsResult.payload.skipped;

            const outputLabelsResult = await deps.migrateOutputLabels({
                account,
                legacyAccountLabels,
                currentAccountLabels,
            });

            if (!outputLabelsResult.success) {
                return err({
                    ...outputLabelsResult.error,
                    deviceStaticSessionId,
                });
            }

            changed += outputLabelsResult.payload.changed;
            skipped += outputLabelsResult.payload.skipped;
        }

        return ok({ changed, skipped });
    };
