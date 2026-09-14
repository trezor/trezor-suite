import type { Horizon } from '@stellar/stellar-sdk';

type OperationRecord = Horizon.ServerApi.OperationRecord;
type EffectRecord = Horizon.ServerApi.EffectRecord;

export type OperationGroup = {
    transactionHash: string;
    operations: [OperationRecord, ...OperationRecord[]];
    /** `paging_token` of the last operation in the group */
    cursor: string;
    /**
     * The account's effects for every operation in the group. Empty when the effects read is off,
     * failed, or did not reach back this far, in which case the transaction is described from its
     * operations alone. Held per group because the account's net position for a multi-operation
     * transaction is the union of its operations' effects.
     */
    effects: EffectRecord[];
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
    effectsByOperationId?: ReadonlyMap<string, EffectRecord[]>,
): OperationGroup[] => {
    const groups: OperationGroup[] = [];

    operations.forEach(operation => {
        const currentGroup = groups[groups.length - 1];
        const effects = effectsByOperationId?.get(operation.id) ?? [];

        if (currentGroup?.transactionHash === operation.transaction_hash) {
            currentGroup.operations.push(operation);
            currentGroup.cursor = operation.paging_token;
            currentGroup.effects.push(...effects);
        } else {
            groups.push({
                transactionHash: operation.transaction_hash,
                operations: [operation],
                cursor: operation.paging_token,
                effects: [...effects],
            });
        }
    });

    return isWindowFull ? groups.slice(0, -1) : groups;
};
