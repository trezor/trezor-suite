import { EMPTY_ENTITY_IDS } from './emptyResults';
import { type EntityId } from './entityIndexTypes';
import { type WalkedPartition } from './partitionWalk';

export type Identities<TEntity, TId extends EntityId> = {
    ids: readonly TId[];
    byId: ReadonlyMap<TId, TEntity>;
};

export const areSame = <TItem>(left: readonly TItem[], right: readonly TItem[]) =>
    left.length === right.length && left.every((item, index) => item === right[index]);

/** Ids in the order they were first seen; an id held twice resolves to the last entity with it. */
export const identitiesOf = <TEntity, TId extends EntityId>(
    walked: readonly WalkedPartition<TEntity, TId>[],
): Identities<TEntity, TId> => {
    const byId = new Map<TId, TEntity>();
    const ids: TId[] = [];

    for (const { built } of walked) {
        const { ids: partitionIds, entities } = built;

        for (let position = 0; position < partitionIds.length; position++) {
            const id = partitionIds[position] as TId;

            if (!byId.has(id)) {
                ids.push(id);
            }
            byId.set(id, entities[position] as TEntity);
        }
    }

    return { ids: ids.length === 0 ? EMPTY_ENTITY_IDS : ids, byId };
};

/** Holds the partitions it was walked with and nothing else, so a build cannot keep the one before it alive. */
export const lazyIdentitiesOf = <TEntity, TId extends EntityId>(
    walked: readonly WalkedPartition<TEntity, TId>[],
) => {
    let built: Identities<TEntity, TId> | undefined;

    return () => (built ??= identitiesOf(walked));
};
