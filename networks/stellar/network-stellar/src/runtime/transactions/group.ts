import type { Horizon } from '@stellar/stellar-sdk';

type OperationRecord = Horizon.ServerApi.OperationRecord;

export type OperationGroup = {
    transactionHash: string;
    operations: [OperationRecord, ...OperationRecord[]];
    /** `paging_token` of the last operation in the group */
    cursor: string;
};

/**
 * Horizon paginates operations, not transactions, so a window can cut a transaction in half.
 * Operations are ordered by TOID, which makes one transaction's operations adjacent, so a
 * possibly-truncated trailing group is dropped and re-fetched at the head of the next page.
 * `isWindowFull` says Horizon filled the request; a shorter response means every group is whole.
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
