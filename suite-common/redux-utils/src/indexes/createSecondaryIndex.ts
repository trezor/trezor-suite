import {
    type IndexId,
    type IndexKey,
    type IndexSnapshot,
    type KeyMaker,
    type SecondaryIndex,
    type SecondaryIndexDefinition,
} from './indexTypes';
import { EMPTY_INDEX_ENTITIES, EMPTY_INDEX_IDS, haveSameMembers } from './indexUtils';

const EMPTY_KEYS: readonly never[] = [];

const isMany = <TParts>(parts: TParts | readonly TParts[]): parts is readonly TParts[] =>
    Array.isArray(parts);

type Filed<TKey extends IndexKey, TId extends IndexId, TEntity> = {
    primary: IndexSnapshot<TId, TEntity>;
    idsByKey: ReadonlyMap<TKey, readonly TId[]>;
    keysById: ReadonlyMap<TId, readonly TKey[]>;
    keys: readonly TKey[];
};

/**
 * A lookup over an index by a key other than the id: one key names many ids. Built lazily on
 * the first read, and from then on maintained from what the index says changed — only the entities
 * that were added or updated are asked where they belong, and only the keys they moved between
 * get a new list. A key's list keeps its array while its members and order stand, so a component
 * watching one key is not re-rendered by a write under another.
 */
export const createSecondaryIndex = <
    TState,
    TId extends IndexId,
    TEntity,
    TKey extends IndexKey,
    TParts = never,
>(
    definition: SecondaryIndexDefinition<TState, TId, TEntity, TKey, TParts>,
): SecondaryIndex<TState, TKey, TId, TEntity> &
    ([TParts] extends [never] ? unknown : KeyMaker<TParts, TKey>) => {
    const { name, source } = definition;
    const createGivenKey = definition.createKey;
    const createKey = (parts: TParts): TKey => {
        if (createGivenKey === undefined) {
            throw new Error(`secondary index "${name}" was given no createKey`);
        }

        return createGivenKey(parts);
    };
    // With `createKey`, what `getKeys` answers are parts and the entity stands in for them by
    // default; without it, `getKeys` answers keys.
    const getKeys = (entity: TEntity): TKey | readonly TKey[] | undefined => {
        if (createGivenKey === undefined) {
            return definition.getKeys(entity);
        }

        const parts = definition.getKeys?.(entity) ?? (entity as unknown as TParts);

        return isMany(parts) ? parts.map(createKey) : createKey(parts);
    };

    const entitiesByIds = new WeakMap<
        readonly TId[],
        { byId: ReadonlyMap<TId, TEntity>; entities: readonly TEntity[] }
    >();

    // What was filed from a primary snapshot, for as long as it lives; the last filing is the
    // baseline a snapshot not seen before is maintained from.
    const filings = new WeakMap<IndexSnapshot<TId, TEntity>, Filed<TKey, TId, TEntity>>();
    let last: Filed<TKey, TId, TEntity> | undefined;

    const keysOf = (entity: TEntity): readonly TKey[] => {
        const keys = getKeys(entity);

        if (keys === undefined) {
            return EMPTY_KEYS;
        }

        return typeof keys === 'string' ? [keys] : keys;
    };

    const listAll = (
        primary: IndexSnapshot<TId, TEntity>,
        keysById: ReadonlyMap<TId, readonly TKey[]>,
    ) => {
        const lists = new Map<TKey, TId[]>();

        primary.ids.forEach(id => {
            keysById.get(id)?.forEach(key => {
                const list = lists.get(key);

                if (list === undefined) {
                    lists.set(key, [id]);
                } else {
                    list.push(id);
                }
            });
        });

        return lists;
    };

    // Lists whose members did not move keep the array a component may be watching.
    const settle = (
        lists: ReadonlyMap<TKey, readonly TId[]>,
        previous: ReadonlyMap<TKey, readonly TId[]> | undefined,
    ): ReadonlyMap<TKey, readonly TId[]> => {
        if (previous === undefined) {
            return lists;
        }

        const settled = new Map<TKey, readonly TId[]>();

        lists.forEach((list, key) => {
            const held = previous.get(key);
            settled.set(key, held !== undefined && haveSameMembers(held, list) ? held : list);
        });

        return settled;
    };

    const file = (primary: IndexSnapshot<TId, TEntity>): Filed<TKey, TId, TEntity> => {
        const keysById = new Map<TId, readonly TKey[]>();

        primary.ids.forEach(id => {
            keysById.set(id, keysOf(primary.byId.get(id) as TEntity));
        });

        const idsByKey = listAll(primary, keysById);

        return { primary, idsByKey, keysById, keys: [...idsByKey.keys()] };
    };

    const refile = (
        primary: IndexSnapshot<TId, TEntity>,
        previous: Filed<TKey, TId, TEntity>,
    ): Filed<TKey, TId, TEntity> => {
        const { added, removed, updated } = primary.changes;
        const keysById = new Map(previous.keysById);
        const touched = new Set<TKey>();

        removed.forEach(id => {
            keysById.get(id)?.forEach(key => touched.add(key));
            keysById.delete(id);
        });

        [...added, ...updated].forEach(id => {
            const next = keysOf(primary.byId.get(id) as TEntity);
            const held = keysById.get(id) ?? EMPTY_KEYS;

            if (!haveSameMembers(held, next)) {
                held.forEach(key => touched.add(key));
                next.forEach(key => touched.add(key));
                keysById.set(id, next);
            }
        });

        // The order of the lists is the order of the ids, so a reordered or re-membered id list
        // refiles everything; while it stands, only the touched keys are listed again.
        if (primary.ids !== previous.primary.ids) {
            const idsByKey = settle(listAll(primary, keysById), previous.idsByKey);
            const keys = [...idsByKey.keys()];

            return {
                primary,
                idsByKey,
                keysById,
                keys: haveSameMembers(previous.keys, keys) ? previous.keys : keys,
            };
        }

        if (touched.size === 0) {
            return { ...previous, primary, keysById };
        }

        const idsByKey = new Map(previous.idsByKey);

        touched.forEach(key => {
            const list = primary.ids.filter(id => keysById.get(id)?.includes(key));

            if (list.length === 0) {
                idsByKey.delete(key);
            } else {
                idsByKey.set(key, list);
            }
        });

        const keys = [...idsByKey.keys()];

        return {
            primary,
            idsByKey,
            keysById,
            keys: haveSameMembers(previous.keys, keys) ? previous.keys : keys,
        };
    };

    const read = (state: TState): Filed<TKey, TId, TEntity> => {
        const primary = source.read(state);
        const known = filings.get(primary);

        if (known !== undefined) {
            return known;
        }

        last = last === undefined ? file(primary) : refile(primary, last);
        filings.set(primary, last);

        return last;
    };

    const getIds = (state: TState, key: TKey): readonly TId[] =>
        read(state).idsByKey.get(key) ?? EMPTY_INDEX_IDS;

    const index: SecondaryIndex<TState, TKey, TId, TEntity> & KeyMaker<TParts, TKey> = {
        name,
        getIds,
        getKeys: state => read(state).keys,
        createKey,
        getEntities: (state, key) => {
            const ids = getIds(state, key);

            if (ids.length === 0) {
                return EMPTY_INDEX_ENTITIES;
            }

            const { byId } = read(state).primary;
            const known = entitiesByIds.get(ids);

            if (known?.byId === byId) {
                return known.entities;
            }

            const entities = ids.map(id => byId.get(id) as TEntity);
            const settled =
                known !== undefined && haveSameMembers(known.entities, entities)
                    ? known.entities
                    : entities;
            entitiesByIds.set(ids, { byId, entities: settled });

            return settled;
        },
    };

    return index;
};
