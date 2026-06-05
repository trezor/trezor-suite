import {
    type EnsureWalletSuiteSyncOnDep,
    type UpdateAddressLabel,
    type WriteAddressLabelDep,
} from '@suite-common/suite-sync-types';

export type UpdateAddressLabelDeps = EnsureWalletSuiteSyncOnDep & WriteAddressLabelDep;

export const createUpdateAddressLabel =
    (deps: UpdateAddressLabelDeps): UpdateAddressLabel =>
    async data => {
        const ensureWalletOnResult = await deps.ensureWalletSuiteSyncOn({
            deviceStaticSessionId: data.deviceStaticSessionId,
            isWriteMode: true,
        });

        if (!ensureWalletOnResult.success) {
            return ensureWalletOnResult;
        }

        return deps.writeAddressLabel({ storage: ensureWalletOnResult.payload, data });
    };
