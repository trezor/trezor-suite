import { EMPTY_ENTITY_IDS } from './emptyResults';
import { type EntityId } from './entityIndexTypes';
import { type WalkedSource } from './sourceWalk';

export type Identities<TEntity, TId extends EntityId> = {
    ids: readonly TId[];
    byId: ReadonlyMap<TId, TEntity>;
};

export const areSame = <TItem>(left: readonly TItem[], right: readonly TItem[]) =>
    left.length === right.length && left.every((item, index) => item === right[index]);

/**
 * The ids in the order the source holds them, and what each one is.
 *
 * An id belongs to one entity: two of them would make what the index answers depend on which
 * question was asked, so the map that would have resolved them says so instead.
 */
export const identitiesOf = <TEntity, TId extends EntityId>(
    walked: WalkedSource<TEntity, TId>,
    name: string,
): Identities<TEntity, TId> => {
    const { ids: walkedIds, entities } = walked;
    const byId = new Map<TId, TEntity>();
    const ids: TId[] = [];

    for (let position = 0; position < walkedIds.length; position++) {
        const id = walkedIds[position] as TId;

        if (byId.has(id)) {
            throw new Error(`entity index "${name}" was given two entities with the id ${id}`);
        }

        ids.push(id);
        byId.set(id, entities[position] as TEntity);
    }

    return { ids: ids.length === 0 ? EMPTY_ENTITY_IDS : ids, byId };
};
