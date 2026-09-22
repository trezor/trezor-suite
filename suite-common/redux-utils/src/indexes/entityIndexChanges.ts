import { type EntityId, type EntityIndexChanges } from './entityIndexTypes';
import { type WalkedPartition } from './partitionWalk';

/**
 * What a rebuild did to the entities, read off the partitions it walked: an id the previous build
 * did not hold was added, one holding a different entity was updated, and one a dirty or vanished
 * partition held that nothing holds now was removed.
 */
export const changesOf = <TEntity, TId extends EntityId>({
    walked,
    byId,
    previousById,
    possiblyRemoved,
}: {
    walked: readonly WalkedPartition<TEntity, TId>[];
    byId: ReadonlyMap<TId, TEntity>;
    previousById: ReadonlyMap<TId, TEntity>;
    possiblyRemoved: readonly TId[];
}): EntityIndexChanges<TId> => {
    const added: TId[] = [];
    const updated: TId[] = [];

    for (const { built: partition, isDirty } of walked) {
        if (!isDirty) {
            continue;
        }

        partition.ids.forEach((id, position) => {
            const previousEntity = previousById.get(id);

            if (previousEntity === undefined) {
                added.push(id);
            } else if (previousEntity !== partition.entities[position]) {
                updated.push(id);
            }
        });
    }

    return { added, removed: possiblyRemoved.filter(id => !byId.has(id)), updated };
};
