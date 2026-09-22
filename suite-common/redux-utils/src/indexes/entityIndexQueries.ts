import { EMPTY_ENTITIES, EMPTY_ENTITY_IDS } from './emptyResults';
import {
    type EntityId,
    type EntityIndex,
    type EntityIndexSnapshot,
    type SecondaryKeyExtractors,
} from './entityIndexTypes';

const setsByList = new WeakMap<object, ReadonlySet<unknown>>();

const toIdSet = <TId extends EntityId>(ids: readonly TId[]): ReadonlySet<TId> => {
    const known = setsByList.get(ids);

    if (known !== undefined) {
        return known as ReadonlySet<TId>;
    }

    const set = new Set<TId>(ids);
    setsByList.set(ids, set);

    return set;
};

type Queries<
    TState,
    TEntity,
    TId extends EntityId,
    TSecondaryIndexes extends SecondaryKeyExtractors<TEntity>,
> = Pick<
    EntityIndex<TState, TEntity, TId, TSecondaryIndexes>,
    | 'getById'
    | 'getByIds'
    | 'getAllExcept'
    | 'getIds'
    | 'getBySecondaryKey'
    | 'getIdsBySecondaryKey'
>;

/**
 * The questions an index answers, each a lookup in the snapshot the read hands back.
 *
 * The two that take a list of ids remember their answer against the `byId` they read it from and
 * the list they were asked with, so asking again while neither changed is not a new array — what
 * a `useSelector` over one of them needs to stay still.
 */
export const createEntityIndexQueries = <
    TState,
    TEntity,
    TId extends EntityId,
    TSecondaryIndexes extends SecondaryKeyExtractors<TEntity>,
>(
    read: (state: TState) => EntityIndexSnapshot<TEntity, TId, TSecondaryIndexes>,
): Queries<TState, TEntity, TId, TSecondaryIndexes> => {
    const entitiesExcept = new WeakMap<object, WeakMap<object, readonly unknown[]>>();
    const entitiesByIds = new WeakMap<object, WeakMap<object, readonly unknown[]>>();

    const remember = (
        cache: WeakMap<object, WeakMap<object, readonly unknown[]>>,
        byId: object,
        against: object,
        entities: readonly TEntity[],
    ) => {
        const forMap = cache.get(byId) ?? new WeakMap<object, readonly unknown[]>();
        forMap.set(against, entities);
        cache.set(byId, forMap);
    };

    return {
        getById: (state, id) => read(state).getEntitiesById().get(id),

        getIds: state => read(state).getIds(),

        getAllExcept: (state, excluded) => {
            const byId = read(state).getEntitiesById();
            const excludedSet =
                excluded instanceof Set ? excluded : toIdSet(excluded as readonly TId[]);
            const known = entitiesExcept.get(byId)?.get(excludedSet);

            if (known !== undefined) {
                return known as readonly TEntity[];
            }

            const found: TEntity[] = [];

            for (const [id, entity] of byId) {
                if (!excludedSet.has(id)) {
                    found.push(entity);
                }
            }

            const entities = found.length === 0 ? EMPTY_ENTITIES : found;
            remember(entitiesExcept, byId, excludedSet, entities);

            return entities;
        },

        getByIds: (state, ids) => {
            const byId = read(state).getEntitiesById();
            const known = typeof ids === 'object' ? entitiesByIds.get(byId)?.get(ids) : undefined;

            if (known !== undefined) {
                return known as readonly TEntity[];
            }

            const found: TEntity[] = [];

            for (const id of ids) {
                const entity = byId.get(id);

                if (entity !== undefined) {
                    found.push(entity);
                }
            }

            const entities = found.length === 0 ? EMPTY_ENTITIES : found;

            // An iterable that is not an object — a generator — has nothing to remember it by.
            if (typeof ids === 'object') {
                remember(entitiesByIds, byId, ids, entities);
            }

            return entities;
        },

        getBySecondaryKey: (state, indexName, key) =>
            read(state).getSecondaryIndex(indexName).get(key)?.entities ?? EMPTY_ENTITIES,

        getIdsBySecondaryKey: (state, indexName, key) =>
            read(state).getSecondaryIndex(indexName).get(key)?.ids ?? EMPTY_ENTITY_IDS,
    };
};
