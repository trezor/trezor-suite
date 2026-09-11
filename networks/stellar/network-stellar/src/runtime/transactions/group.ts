import type { Horizon } from '@stellar/stellar-sdk';

type OperationRecord = Horizon.ServerApi.OperationRecord;
type EffectRecord = Horizon.ServerApi.EffectRecord;

export type OperationGroup = {
    transactionHash: string;
    /** never empty — a group exists only because an operation created it */
    operations: [OperationRecord, ...OperationRecord[]];
    /** `paging_token` of the last operation in the group */
    cursor: string;
    /**
     * The account's effects for every operation in the group. Empty when the effects read is off,
     * failed, or did not reach back this far, in which case the transaction is described from its
     * operations alone.
     *
     * Held per group rather than per operation because the account's net position for a
     * multi-operation transaction is the union of its operations' effects.
     */
    effects: EffectRecord[];
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
