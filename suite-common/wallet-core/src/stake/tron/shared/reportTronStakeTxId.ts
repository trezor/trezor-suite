import { type ReportStakingTxIdsKind, reportStakingTxIds } from '@suite-common/earn-staking-api';

export const reportTronStakeTxId = async (
    txid: string,
    kind: ReportStakingTxIdsKind,
): Promise<boolean> => {
    try {
        await reportStakingTxIds({ body: { txid, network: 'tron', kind } });

        return true;
    } catch {
        return false;
    }
};
