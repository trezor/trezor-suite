import type { Horizon } from '@stellar/stellar-sdk';

type OperationRecord = Horizon.ServerApi.OperationRecord;

export type OperationGroup = {
    transactionHash: string;
    /** never empty — a group exists only because an operation created it */
    operations: [OperationRecord, ...OperationRecord[]];
    /** `paging_token` of the last operation in the group */
    cursor: string;
};

/**
 * Horizon paginates operations, not transactions, so a fetch window can cut a transaction in
 * half. Operations are ordered by TOID, which makes every operation of one transaction
 * adjacent, so consecutive records can be grouped and a possibly-truncated trailing group
 * dropped — it is re-fetched at the head of the next page.
 *
 * Pass `isWindowFull` when Horizon returned as many records as were requested; a shorter
 * response means the end of the account history was reached and every group is complete.
 */
export const groupOperationsByTransaction = (
    operations: OperationRecord[],
    isWindowFull: boolean,
): OperationGroup[] => {
    const groups: OperationGroup[] = [];

    operations.forEach(operation => {
        const currentGroup = groups[groups.length - 1];

        if (currentGroup?.transactionHash === operation.transaction_hash) {
            currentGroup.operations.push(operation);
            currentGroup.cursor = operation.paging_token;
        } else {
            groups.push({
                transactionHash: operation.transaction_hash,
                operations: [operation],
                cursor: operation.paging_token,
            });
        }
    });

    return isWindowFull ? groups.slice(0, -1) : groups;
};
