import { type EntityId, type EntityIndexChanges } from './entityIndexTypes';

/**
 * What a rebuild did to the entities: an id the build before did not hold was added, one holding a
 * different entity was updated, and one it held that this build does not was removed.
 */
export const changesOf = <TEntity, TId extends EntityId>({
    byId,
    previousById,
}: {
    byId: ReadonlyMap<TId, TEntity>;
    previousById: ReadonlyMap<TId, TEntity>;
}): EntityIndexChanges<TId> => {
    const added: TId[] = [];
    const updated: TId[] = [];
    const removed: TId[] = [];

    byId.forEach((entity, id) => {
        const previousEntity = previousById.get(id);

        if (previousEntity === undefined) {
            added.push(id);
        } else if (previousEntity !== entity) {
            updated.push(id);
        }
    });

    previousById.forEach((_entity, id) => {
        if (!byId.has(id)) {
            removed.push(id);
        }
    });

    return { added, removed, updated };
};
