import type { Horizon } from '@stellar/stellar-sdk';

type OperationRecord = Horizon.ServerApi.OperationRecord;
type EffectRecord = Horizon.ServerApi.EffectRecord;

export type OperationGroup = {
    transactionHash: string;
    operations: [OperationRecord, ...OperationRecord[]];
    /** `paging_token` of the last operation in the group */
    cursor: string;
    /** The account's effects for every operation in the group; empty when unavailable. */
    effects: EffectRecord[];
};

/**
 * Horizon paginates operations, not transactions, so a full window can cut the last transaction in
 * half; that trailing group is dropped and re-fetched at the head of the next page.
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
