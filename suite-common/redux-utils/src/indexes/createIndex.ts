import { shallowEqual } from 'react-redux';

import { createIndexQueries, settleSnapshot, toChanges } from './indexSnapshot';
import {
    type Index,
    type IndexDefinition,
    type IndexId,
    type IndexSnapshot,
    type IndexSource,
    type ResolvedIndexId,
} from './indexTypes';

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

        return settleSnapshot(byId, ids, toChanges(added, removed, updated), previous);
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
        ...createIndexQueries<TState, TId, TEntity>(name, read, new WeakMap()),
        getId,
        asId: value => value as TId,
        createId,
    };
};
