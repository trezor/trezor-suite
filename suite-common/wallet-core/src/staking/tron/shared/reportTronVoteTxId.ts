import { captureException, withScope } from '@sentry/core';

import { earnStakingWorkerBaseUrl, reportStakingTxIds } from '@suite-common/earn-staking-api';

export const reportTronVoteTxId = async (txid: string): Promise<boolean> => {
    try {
        await reportStakingTxIds({ body: { txid, network: 'tron', kind: 'vote' } });

        return true;
    } catch (error) {
        const baseUrl = await earnStakingWorkerBaseUrl.get();

        withScope(scope => {
            scope.setTag('error.code', 'tron_staking_txid_report_failed');
            scope.setTag('error.source', baseUrl);
            scope.setTag('error.kind', 'vote');
            scope.setExtra('errorMessage', error instanceof Error ? error.message : String(error));
            captureException(new Error('Failed to report Tron staking txid to the Earn API.'));
        });

        return false;
    }
};
