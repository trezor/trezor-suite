import { captureException, withScope } from '@sentry/core';

import {
    EARN_API_BASE_URL,
    type ReportStakingTxIdsKind,
    reportStakingTxIds,
} from '@suite-common/earn-staking-api';

export const reportTronStakeTxId = async (
    txid: string,
    kind: ReportStakingTxIdsKind,
): Promise<boolean> => {
    try {
        await reportStakingTxIds({ body: { txid, network: 'tron', kind } });

        return true;
    } catch (error) {
        withScope(scope => {
            scope.setTag('error.code', 'tron_staking_txid_report_failed');
            scope.setTag('error.source', EARN_API_BASE_URL);
            scope.setTag('error.kind', kind);
            scope.setExtra('errorMessage', error instanceof Error ? error.message : String(error));
            captureException(new Error('Failed to report Tron staking txid to the Earn API.'));
        });

        return false;
    }
};
