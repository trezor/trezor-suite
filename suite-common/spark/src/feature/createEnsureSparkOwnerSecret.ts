import type { PlatformEncryptionDep } from '@suite-common/platform-encryption';
import {
    selectIsSuiteSyncEnabled,
    selectSuiteSyncOwnerForDeviceStaticId,
} from '@suite-common/suite-sync';
import {
    type SuiteSyncOwnerSecretHex,
    deserializeSuiteSyncOwner,
} from '@suite-common/suite-sync-storage';
import type {
    EnsureWalletSuiteSyncOnDep,
    TurnOnSuiteSyncDep,
} from '@suite-common/suite-sync-types';
import { type Result, err, ok } from '@trezor/type-utils';

export type DeviceStaticSessionId = NonNullable<
    Parameters<typeof selectSuiteSyncOwnerForDeviceStaticId>[1]
>;

export type SparkServiceError = {
    message: string;
};

export type EnsureSparkOwnerSecretParams = {
    deviceStaticSessionId: DeviceStaticSessionId;
};

export type EnsureSparkOwnerSecret = (
    params: EnsureSparkOwnerSecretParams,
) => Promise<Result<SuiteSyncOwnerSecretHex, SparkServiceError>>;

export type EnsureSparkOwnerSecretResult = Result<SuiteSyncOwnerSecretHex, SparkServiceError>;

export type EnsureSparkOwnerSecretDep = {
    ensureSparkOwnerSecret: EnsureSparkOwnerSecret;
};

export type EnsureSparkOwnerSecretDeps = PlatformEncryptionDep &
    EnsureWalletSuiteSyncOnDep &
    TurnOnSuiteSyncDep & {
        getState: () => unknown;
    };

const mapSuiteSyncError = (error: { message?: string; type: string }) =>
    error.message ?? error.type;

export const createEnsureSparkOwnerSecret =
    (deps: EnsureSparkOwnerSecretDeps): EnsureSparkOwnerSecret =>
    async ({
        deviceStaticSessionId,
    }: EnsureSparkOwnerSecretParams): Promise<EnsureSparkOwnerSecretResult> => {
        const currentState = deps.getState();
        const encryptedOwner = selectSuiteSyncOwnerForDeviceStaticId(
            currentState as never,
            deviceStaticSessionId,
        );

        if (encryptedOwner === null) {
            if (!selectIsSuiteSyncEnabled(currentState as never)) {
                const turnOnSuiteSyncResult = await deps.turnOnSuiteSync({
                    deviceStaticSessionId,
                });

                if (!turnOnSuiteSyncResult.success) {
                    return err({ message: mapSuiteSyncError(turnOnSuiteSyncResult.error) });
                }
            }

            const ensureSuiteSyncResult = await deps.ensureWalletSuiteSyncOn({
                deviceStaticSessionId,
                isWriteMode: false,
            });

            if (!ensureSuiteSyncResult.success) {
                return err({ message: mapSuiteSyncError(ensureSuiteSyncResult.error) });
            }
        }

        const nextEncryptedOwner = selectSuiteSyncOwnerForDeviceStaticId(
            deps.getState() as never,
            deviceStaticSessionId,
        );

        if (nextEncryptedOwner === null) {
            return err({ message: 'Suite Sync owner is unavailable for the selected wallet.' });
        }

        const decryptResult = await deps.platformEncryption.decrypt({
            value: nextEncryptedOwner,
        });

        if (!decryptResult.success) {
            return err({ message: decryptResult.error.type });
        }

        const suiteSyncOwner = deserializeSuiteSyncOwner(decryptResult.payload);

        return ok(suiteSyncOwner.ownerSecret);
    };
