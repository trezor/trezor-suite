import { EMPTY_ENTITY_IDS } from './emptyResults';
import { type EntityId } from './entityIndexTypes';

export type PrimaryIndex<TEntity, TId extends EntityId> = {
    ids: readonly TId[];
    byId: ReadonlyMap<TId, TEntity>;
};

/**
 * Every entity of the source by the id it gives, in the order the source holds them.
 *
 * An id belongs to one entity: two of them would make what the index answers depend on which
 * question was asked, so the map that would have resolved them says so instead.
 */
export const buildPrimaryIndex = <TSource, TEntity, TId extends EntityId>({
    source,
    toEntities,
    getId,
    name,
}: {
    source: TSource;
    toEntities: (source: TSource) => Iterable<TEntity>;
    getId: (entity: TEntity) => TId;
    name: string;
}): PrimaryIndex<TEntity, TId> => {
    const byId = new Map<TId, TEntity>();
    const ids: TId[] = [];

    for (const entity of toEntities(source)) {
        const id = getId(entity);

        if (byId.has(id)) {
            throw new Error(`entity index "${name}" was given two entities with the id ${id}`);
        }

        ids.push(id);
        byId.set(id, entity);
    }

    return { ids: ids.length === 0 ? EMPTY_ENTITY_IDS : ids, byId };
};
