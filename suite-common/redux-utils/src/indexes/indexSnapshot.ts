import { type Index, type IndexChanges, type IndexId, type IndexSnapshot } from './indexTypes';
import { EMPTY_INDEX_ENTITIES, EMPTY_INDEX_IDS, haveSameMembers } from './indexUtils';

export const NO_CHANGES: IndexChanges<never> = {
    added: EMPTY_INDEX_IDS,
    removed: EMPTY_INDEX_IDS,
    updated: EMPTY_INDEX_IDS,
};

export const EMPTY_SNAPSHOT: IndexSnapshot<never, never> = {
    ids: EMPTY_INDEX_IDS,
    entities: EMPTY_INDEX_ENTITIES,
    byId: new Map<never, never>(),
    changes: NO_CHANGES,
};

export const toChanges = <TId extends IndexId>(
    added: TId[],
    removed: TId[],
    updated: TId[],
): IndexChanges<TId> =>
    added.length + removed.length + updated.length > 0 ? { added, removed, updated } : NO_CHANGES;

/**
 * A snapshot over a filled `byId`, settled against the one before: `ids` and `entities` keep their
 * arrays while members and order stand, and a build that changed nothing is the build before.
 */
export const settleSnapshot = <TId extends IndexId, TEntity>(
    byId: ReadonlyMap<TId, TEntity>,
    orderedIds: TId[],
    changes: IndexChanges<TId>,
    previous: IndexSnapshot<TId, TEntity> | undefined,
): IndexSnapshot<TId, TEntity> => {
    const emptySnapshot = EMPTY_SNAPSHOT as IndexSnapshot<TId, TEntity>;

    if (orderedIds.length === 0) {
        return changes === NO_CHANGES ? emptySnapshot : { ...emptySnapshot, changes };
    }

    if (
        previous !== undefined &&
        changes === NO_CHANGES &&
        haveSameMembers(previous.ids, orderedIds)
    ) {
        return previous.changes === NO_CHANGES ? previous : { ...previous, changes };
    }

    const entities = orderedIds.map(id => byId.get(id) as TEntity);

    return {
        ids:
            previous !== undefined && haveSameMembers(previous.ids, orderedIds)
                ? previous.ids
                : orderedIds,
        entities:
            previous !== undefined && haveSameMembers(previous.entities, entities)
                ? previous.entities
                : entities,
        byId,
        changes,
    };
};

/** The lookups every index answers, over its `read`. */
export const createIndexQueries = <TState, TId extends IndexId, TEntity>(
    name: string,
    read: (state: TState) => IndexSnapshot<TId, TEntity>,
): Index<TState, TId, TEntity> => ({
    name,
    read,
    getIds: state => read(state).ids,
    getEntities: state => read(state).entities,
    getById: (state, id) => read(state).byId.get(id),
});
