import {
    type EnsureWalletSuiteSyncOnDep,
    type UpdateOutputLabel,
} from '@suite-common/suite-sync-types';
import { type TxTargetId } from '@suite-common/wallet-types';
import { type StaticSessionId } from '@trezor/connect';

import {
    type SuiteSyncAnalyticsDep,
    getLabelAction,
    reportLabelEvent,
} from '../../suiteSyncAnalytics';

type GetOutputLabelDep = {
    getOutputLabel: (
        txId: string,
        txTargetId: TxTargetId,
        deviceStaticSessionId: StaticSessionId,
    ) => string | null;
};

export type UpdateOutputLabelDeps = EnsureWalletSuiteSyncOnDep &
    SuiteSyncAnalyticsDep &
    GetOutputLabelDep;

export const createUpdateOutputLabel =
    (deps: UpdateOutputLabelDeps): UpdateOutputLabel =>
    async ({
        txTargetId,
        label,
        accountDescriptor,
        txId,
        networkSymbol,
        deviceStaticSessionId,
    }) => {
        const previousLabel = deps.getOutputLabel(txId, txTargetId, deviceStaticSessionId);

        const ensureWalletOnResult = await deps.ensureWalletSuiteSyncOn({
            deviceStaticSessionId,
            isWriteMode: true,
        });

        if (!ensureWalletOnResult.success) {
            return ensureWalletOnResult;
        }

        const result = await ensureWalletOnResult.payload.data.outputs.update({
            txId,
            txTargetId,
            label,
            accountDescriptor,
            networkSymbol,
        });

        if (result.success && label) {
            reportLabelEvent(
                deps.analytics,
                'output',
                networkSymbol,
                getLabelAction(previousLabel),
            );
        }

        return result;
    };
