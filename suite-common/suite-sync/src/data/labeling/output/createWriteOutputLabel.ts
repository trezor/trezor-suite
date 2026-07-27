import { type WriteOutputLabel } from '@suite-common/suite-sync-types';
import { type TxTargetId } from '@suite-common/wallet-types';
import { type StaticSessionId } from '@trezor/connect';

import {
    type SuiteSyncAnalyticsDep,
    getLabelAction,
    reportLabelEvent,
} from '../../../suiteSyncAnalytics';

type GetOutputLabelDep = {
    getOutputLabel: (
        txId: string,
        txTargetId: TxTargetId,
        deviceStaticSessionId: StaticSessionId,
    ) => string | null;
};

export type WriteOutputLabelDeps = SuiteSyncAnalyticsDep & GetOutputLabelDep;

export const createWriteOutputLabel =
    (deps: WriteOutputLabelDeps): WriteOutputLabel =>
    ({
        storage,
        data: { txTargetId, label, accountDescriptor, txId, networkSymbol, deviceStaticSessionId },
    }) => {
        const previousLabel = deps.getOutputLabel(txId, txTargetId, deviceStaticSessionId);

        const result = storage.data.outputs.update({
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
