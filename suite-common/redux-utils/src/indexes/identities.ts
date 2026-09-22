import { EMPTY_ENTITY_IDS } from './emptyResults';
import { type EntityId } from './entityIndexTypes';
import { type WalkedPartition } from './partitionWalk';

export type Identities<TEntity, TId extends EntityId> = {
    ids: readonly TId[];
    byId: ReadonlyMap<TId, TEntity>;
};

export const areSame = <TItem>(left: readonly TItem[], right: readonly TItem[]) =>
    left.length === right.length && left.every((item, index) => item === right[index]);

/**
 * The ids in the order the partitions hold them, and what each one is.
 *
 * An id belongs to one entity: two of them would make what the index answers depend on which
 * question was asked, so the map that would have resolved them says so instead.
 */
export const identitiesOf = <TEntity, TId extends EntityId>(
    walked: readonly WalkedPartition<TEntity, TId>[],
    name: string,
): Identities<TEntity, TId> => {
    const byId = new Map<TId, TEntity>();
    const ids: TId[] = [];

    for (const { built } of walked) {
        const { ids: partitionIds, entities } = built;

        for (let position = 0; position < partitionIds.length; position++) {
            const id = partitionIds[position] as TId;

            if (byId.has(id)) {
                throw new Error(`entity index "${name}" was given two entities with the id ${id}`);
            }

            ids.push(id);
            byId.set(id, entities[position] as TEntity);
        }
    }

    return { ids: ids.length === 0 ? EMPTY_ENTITY_IDS : ids, byId };
};

/** Holds the partitions it was walked with and nothing else, so a build cannot keep the one before it alive. */
export const lazyIdentitiesOf = <TEntity, TId extends EntityId>(
    walked: readonly WalkedPartition<TEntity, TId>[],
    name: string,
) => {
    let built: Identities<TEntity, TId> | undefined;

    return () => (built ??= identitiesOf(walked, name));
};
