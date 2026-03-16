import {
    type EnsureWalletSuiteSyncOnDep,
    type UpdateAddressLabel,
} from '@suite-common/suite-sync-types';

export type UpdateAddressLabelDeps = EnsureWalletSuiteSyncOnDep;

export const createUpdateAddressLabel =
    (deps: UpdateAddressLabelDeps): UpdateAddressLabel =>
    async ({ deviceStaticSessionId, address, label, accountDescriptor, networkSymbol }) => {
        const ensureWalletOnResult = await deps.ensureWalletSuiteSyncOn({
            deviceStaticSessionId,
            isWriteMode: true,
        });

        if (!ensureWalletOnResult.success) {
            return ensureWalletOnResult;
        }

        return ensureWalletOnResult.payload.data.addresses.update({
            address,
            label,
            accountDescriptor,
            networkSymbol,
        });
    };
