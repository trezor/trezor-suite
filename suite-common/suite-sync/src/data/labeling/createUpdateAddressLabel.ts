import {
    type EnsureWalletSuiteSyncOnDep,
    type UpdateAddressLabel,
} from '@suite-common/suite-sync-types';
import { type StaticSessionId } from '@trezor/connect';

import {
    type SuiteSyncAnalyticsDep,
    getLabelAction,
    reportLabelEvent,
} from '../../suiteSyncAnalytics';

type GetAddressLabelDep = {
    getAddressLabel: (deviceStaticSessionId: StaticSessionId, address: string) => string | null;
};

export type UpdateAddressLabelDeps = EnsureWalletSuiteSyncOnDep &
    SuiteSyncAnalyticsDep &
    GetAddressLabelDep;

export const createUpdateAddressLabel =
    (deps: UpdateAddressLabelDeps): UpdateAddressLabel =>
    async ({ deviceStaticSessionId, address, label, accountDescriptor, networkSymbol }) => {
        const previousLabel = deps.getAddressLabel(deviceStaticSessionId, address);

        const ensureWalletOnResult = await deps.ensureWalletSuiteSyncOn({
            deviceStaticSessionId,
            isWriteMode: true,
        });

        if (!ensureWalletOnResult.success) {
            return ensureWalletOnResult;
        }

        const result = await ensureWalletOnResult.payload.data.addresses.update({
            address,
            label,
            accountDescriptor,
            networkSymbol,
        });

        if (result.success && label) {
            reportLabelEvent(
                deps.analytics,
                'receive_address',
                networkSymbol,
                getLabelAction(previousLabel),
            );
        }

        return result;
    };
