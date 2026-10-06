import { shallowEqual } from 'react-redux';

import {
    type Index,
    type IndexChanges,
    type IndexDefinition,
    type IndexId,
    type IndexSnapshot,
    type IndexSource,
    type ResolvedIndexId,
} from './indexTypes';
import { EMPTY_INDEX_ENTITIES, EMPTY_INDEX_IDS, haveSameMembers, toIdSet } from './indexUtils';

const NO_CHANGES: IndexChanges<never> = {
    added: EMPTY_INDEX_IDS,
    removed: EMPTY_INDEX_IDS,
    updated: EMPTY_INDEX_IDS,
};

const EMPTY_SNAPSHOT: IndexSnapshot<never, never> = {
    ids: EMPTY_INDEX_IDS,
    entities: EMPTY_INDEX_ENTITIES,
    byId: new Map<never, never>(),
    changes: NO_CHANGES,
};

const isIndex = <TState, TEntity>(
    source: IndexSource<TState, TEntity>,
): source is Exclude<IndexSource<TState, TEntity>, (state: TState) => unknown> =>
    typeof source !== 'function';

/**
 * An index over the entities a selector gives: every entity filed by id, read lazily, and matched
 * against the build before so that an entity the selector rebuilt unchanged keeps the object a
 * component already holds. Each build also tells which ids were added, removed and updated —
 * what a secondary index maintains itself from.
 *
 * The selector owns the shape: it flattens, aggregates, orders and gives every entity its id. The
 * index owns identity: `ids` keeps its array while its members and order stand, an entity keeps
 * its object while it is equal to the one held, and a read against an unchanged source returns the
 * very same snapshot.
 */
export const createIndex = <
    TState,
    TEntity,
    TName extends string,
    TGivenId extends IndexId,
    TParts = never,
>(
    definition: IndexDefinition<TState, TEntity, TName, TGivenId, TParts>,
): Index<TState, ResolvedIndexId<TName, TGivenId>, TEntity, TParts> => {
    type TId = ResolvedIndexId<TName, TGivenId>;
    type Snapshot = IndexSnapshot<TId, TEntity>;

    const { name, source, isEqual = shallowEqual } = definition;
    const createGivenId = definition.createId;
    // Without `getId` the entity itself has the parts — the types ask for that, the compiler cannot
    // see it from in here — so the maker is read as taking the entity.
    const makeIdFromEntity = createGivenId as unknown as
        ((entity: TEntity) => TGivenId) | undefined;
    const getGivenId =
        definition.getId ??
        ((entity: TEntity) => {
            if (makeIdFromEntity === undefined) {
                throw new Error(`index "${name}" was given neither getId nor createId`);
            }

            return makeIdFromEntity(entity);
        });

    const getId = (entity: TEntity) => getGivenId(entity) as TId;
    const createId = (parts: TParts) => {
        if (createGivenId === undefined) {
            throw new Error(`index "${name}" was given no createId`);
        }

        return createGivenId(parts) as TId;
    };
    const emptySnapshot = EMPTY_SNAPSHOT as Snapshot;
    const entitiesByIds = new WeakMap<
        ReadonlyMap<TId, TEntity>,
        WeakMap<readonly TId[], readonly TEntity[]>
    >();

    let cached: { sourceValue: unknown; snapshot: Snapshot } | undefined;

    const build = (sourceEntities: Iterable<TEntity>, previous: Snapshot | undefined): Snapshot => {
        const byId = new Map<TId, TEntity>();
        const ids: TId[] = [];
        const added: TId[] = [];
        const updated: TId[] = [];

        for (const entity of sourceEntities) {
            const id = getId(entity);

            if (byId.has(id)) {
                throw new Error(`index "${name}" was given two entities with the id ${id}`);
            }

            const held = previous?.byId.get(id);

            if (held === undefined) {
                byId.set(id, entity);

                if (previous !== undefined) {
                    added.push(id);
                }
            } else if (held === entity || isEqual(held, entity)) {
                byId.set(id, held);
            } else {
                byId.set(id, entity);
                updated.push(id);
            }

            ids.push(id);
        }

        const removed = previous?.ids.filter(id => !byId.has(id)) ?? [];
        const hasChanges = added.length + removed.length + updated.length > 0;
        const changes: IndexChanges<TId> = hasChanges ? { added, removed, updated } : NO_CHANGES;

        if (ids.length === 0) {
            return hasChanges ? { ...emptySnapshot, changes } : emptySnapshot;
        }

        if (previous !== undefined && !hasChanges && haveSameMembers(previous.ids, ids)) {
            return previous.changes === NO_CHANGES ? previous : { ...previous, changes };
        }

        const entities = ids.map(id => byId.get(id) as TEntity);

        return {
            ids: previous !== undefined && haveSameMembers(previous.ids, ids) ? previous.ids : ids,
            entities:
                previous !== undefined && haveSameMembers(previous.entities, entities)
                    ? previous.entities
                    : entities,
            byId,
            changes,
        };
    };

    const read = (state: TState): Snapshot => {
        const sourceValue = isIndex(source) ? source.read(state) : source(state);

        if (cached?.sourceValue === sourceValue) {
            return cached.snapshot;
        }

        const sourceEntities = isIndex(source)
            ? (sourceValue as { entities: readonly TEntity[] }).entities
            : (sourceValue as Iterable<TEntity>);

        const snapshot = build(sourceEntities, cached?.snapshot);
        cached = { sourceValue, snapshot };

        return snapshot;
    };

    return {
        name,
        read,
        getId,
        asId: value => value as TId,
        createId,
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
