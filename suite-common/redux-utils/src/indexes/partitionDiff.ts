import { type EntityId } from './entityIndexTypes';
import { areSame } from './identities';
import { type BuiltPartition, type WalkedPartition } from './partitionWalk';

export type PartitionDiff<TEntity, TId extends EntityId> = {
    partitions: Map<string, BuiltPartition<TEntity, TId>>;
    walked: WalkedPartition<TEntity, TId>[];
    gonePartitions: BuiltPartition<TEntity, TId>[];
    /** Ids a dirty or vanished partition used to hold; whether they are gone is decided later. */
    possiblyRemoved: TId[];
    entityCount: number;
    isPartitionOrderKept: boolean;
};

/**
 * What a write did to the source, by reference: a partition the reducer did not replace is the
 * one that was walked before, and only the rest is walked again.
 */
export const diffPartitions = <TPartition, TEntity, TId extends EntityId>({
    sourcePartitions,
    previousPartitions,
    walk,
}: {
    sourcePartitions: Iterable<readonly [key: string, partition: TPartition]>;
    previousPartitions: ReadonlyMap<string, BuiltPartition<TEntity, TId>> | undefined;
    walk: (partition: TPartition) => BuiltPartition<TEntity, TId>;
}): PartitionDiff<TEntity, TId> => {
    const partitions = new Map<string, BuiltPartition<TEntity, TId>>();
    const walked: WalkedPartition<TEntity, TId>[] = [];
    const possiblyRemoved: TId[] = [];
    let entityCount = 0;

    for (const [partitionKey, partition] of sourcePartitions) {
        const previousPartition = previousPartitions?.get(partitionKey);
        const isUntouched = previousPartition?.partition === partition;
        const built = isUntouched && previousPartition ? previousPartition : walk(partition);

        partitions.set(partitionKey, built);
        walked.push({ key: partitionKey, built, isDirty: !isUntouched });
        entityCount += built.ids.length;

        if (!isUntouched && previousPartition) {
            previousPartition.ids.forEach(id => possiblyRemoved.push(id));
        }
    }

    const gonePartitions: BuiltPartition<TEntity, TId>[] = [];

    previousPartitions?.forEach((previousPartition, partitionKey) => {
        if (!partitions.has(partitionKey)) {
            gonePartitions.push(previousPartition);
            previousPartition.ids.forEach(id => possiblyRemoved.push(id));
        }
    });

    return {
        partitions,
        walked,
        gonePartitions,
        possiblyRemoved,
        entityCount,
        // Only then can a key nothing dirty touched keep the array it had: the order of what is
        // under it comes from the order of the partitions.
        isPartitionOrderKept:
            previousPartitions !== undefined &&
            gonePartitions.length === 0 &&
            areSame([...partitions.keys()], [...previousPartitions.keys()]),
    };
};
