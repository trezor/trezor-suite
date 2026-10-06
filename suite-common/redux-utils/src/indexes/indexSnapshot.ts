import { type Index, type IndexChanges, type IndexId, type IndexSnapshot } from './indexTypes';
import { EMPTY_INDEX_ENTITIES, EMPTY_INDEX_IDS, haveSameMembers, toIdSet } from './indexUtils';

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

/** The lookups every index answers, over its `read`. Ids and entities are remembered per array. */
export const createIndexQueries = <TState, TId extends IndexId, TEntity>(
    name: string,
    read: (state: TState) => IndexSnapshot<TId, TEntity>,
    idOfEntity: WeakMap<object, TId>,
): Omit<Index<TState, TId, TEntity>, 'createId'> => {
    const entitiesByIds = new WeakMap<
        ReadonlyMap<TId, TEntity>,
        WeakMap<readonly TId[], readonly TEntity[]>
    >();

    return {
        name,
        read,
        getId: entity => {
            const id =
                typeof entity === 'object' && entity !== null ? idOfEntity.get(entity) : undefined;

            if (id === undefined) {
                throw new Error(`index "${name}" does not hold the given entity`);
            }

            return id;
        },
        asId: value => value as TId,
        getIds: state => read(state).ids,
        getIdSet: state => toIdSet(read(state).ids),
        getEntities: state => read(state).entities,
        getById: (state, id) => read(state).byId.get(id),
        getByIds: (state, ids) => {
            const { byId } = read(state);
            const known = entitiesByIds.get(byId)?.get(ids);

            if (known !== undefined) {
                return known;
            }

            const found: TEntity[] = [];

            for (const id of ids) {
                if (byId.has(id)) {
                    found.push(byId.get(id) as TEntity);
                }
            }

            const entities = found.length === 0 ? EMPTY_INDEX_ENTITIES : found;
            const forById = entitiesByIds.get(byId) ?? new WeakMap();
            forById.set(ids, entities);
            entitiesByIds.set(byId, forById);

            return entities;
        },
    };
};

export const rememberIds = <TId extends IndexId, TEntity>(
    idOfEntity: WeakMap<object, TId>,
    byId: ReadonlyMap<TId, TEntity>,
) => {
    byId.forEach((entity, id) => {
        if (typeof entity === 'object' && entity !== null) {
            idOfEntity.set(entity, id);
        }
    });
};
