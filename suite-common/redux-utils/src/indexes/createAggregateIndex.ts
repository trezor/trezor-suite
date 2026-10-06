import { shallowEqual } from 'react-redux';

import {
    createIndexQueries,
    createRevisions,
    settleSnapshot,
    toChanges,
    wayTo,
} from './indexSnapshot';
import {
    type AggregateIndexDefinition,
    type Index,
    type IndexId,
    type IndexSnapshot,
} from './indexTypes';

type Filed<TSourceId extends IndexId, TId extends IndexId, TItem, TEntity> = {
    sourceSnapshot: IndexSnapshot<TSourceId, unknown>;
    itemsBySourceId: ReadonlyMap<TSourceId, readonly TItem[]>;
    /** Which source entities contribute to an id, in order of first appearance. */
    sourceIdsById: ReadonlyMap<TId, readonly TSourceId[]>;
    snapshot: IndexSnapshot<TId, TEntity>;
};

/**
 * Many source entities folded into one entity per id — accounts into the assets they hold. Each
 * source entity expands into items once, while it is the same object; the items sharing an id are
 * folded into its entity. Maintained from what the source says changed: a write to one source
 * entity re-expands that entity and re-folds the ids it contributed to before and after, and the
 * rest of the entities are not looked at.
 */
export const createAggregateIndex = <
    TState,
    TSourceId extends IndexId,
    TSource,
    TItem,
    TId extends IndexId,
    TEntity,
>({
    name,
    source,
    expand,
    getId,
    reduce,
    isEqual = shallowEqual,
}: AggregateIndexDefinition<TState, TSourceId, TSource, TItem, TId, TEntity>): Index<
    TState,
    TId,
    TEntity
> => {
    const expansions = new WeakMap<object, readonly TItem[]>();
    // What was built from a source snapshot, for as long as that snapshot lives — so a store whose
    // snapshot comes back is answered without a build. The last build is the baseline a snapshot
    // not seen before is maintained from.
    const builds = new WeakMap<
        IndexSnapshot<TSourceId, TSource>,
        Filed<TSourceId, TId, TItem, TEntity>
    >();
    const nextRevision = createRevisions();
    let last: Filed<TSourceId, TId, TItem, TEntity> | undefined;

    const expandOnce = (entity: TSource): readonly TItem[] => {
        if (typeof entity !== 'object' || entity === null) {
            return Array.from(expand(entity));
        }

        const known = expansions.get(entity);

        if (known !== undefined) {
            return known;
        }

        const expanded = Array.from(expand(entity));
        expansions.set(entity, expanded);

        return expanded;
    };

    const idsOf = (items: readonly TItem[]): TId[] => {
        const ids: TId[] = [];

        items.forEach(item => {
            const id = getId(item);

            if (id !== undefined && !ids.includes(id)) {
                ids.push(id);
            }
        });

        return ids;
    };

    const fold = (
        id: TId,
        sourceIds: readonly TSourceId[],
        itemsBySourceId: ReadonlyMap<TSourceId, readonly TItem[]>,
    ): TEntity => {
        let accumulated: TEntity | undefined;

        sourceIds.forEach(sourceId => {
            itemsBySourceId.get(sourceId)?.forEach(item => {
                if (getId(item) === id) {
                    accumulated = reduce(accumulated, item);
                }
            });
        });

        return accumulated as TEntity;
    };

    const file = (
        sourceSnapshot: IndexSnapshot<TSourceId, TSource>,
    ): Filed<TSourceId, TId, TItem, TEntity> => {
        const itemsBySourceId = new Map<TSourceId, readonly TItem[]>();
        const sourceIdsById = new Map<TId, TSourceId[]>();

        sourceSnapshot.ids.forEach(sourceId => {
            const items = expandOnce(sourceSnapshot.byId.get(sourceId) as TSource);
            itemsBySourceId.set(sourceId, items);

            idsOf(items).forEach(id => {
                const held = sourceIdsById.get(id);

                if (held === undefined) {
                    sourceIdsById.set(id, [sourceId]);
                } else {
                    held.push(sourceId);
                }
            });
        });

        const byId = new Map<TId, TEntity>();
        sourceIdsById.forEach((sourceIds, id) =>
            byId.set(id, fold(id, sourceIds, itemsBySourceId)),
        );

        return {
            sourceSnapshot,
            itemsBySourceId,
            sourceIdsById,
            snapshot: settleSnapshot(
                byId,
                [...byId.keys()],
                toChanges([], [], []),
                undefined,
                nextRevision,
            ),
        };
    };

    const refile = (
        sourceSnapshot: IndexSnapshot<TSourceId, TSource>,
        previous: Filed<TSourceId, TId, TItem, TEntity>,
    ): Filed<TSourceId, TId, TItem, TEntity> => {
        const { added, removed, updated } = sourceSnapshot.changes;

        if (added.length + removed.length + updated.length === 0) {
            return { ...previous, sourceSnapshot };
        }

        const itemsBySourceId = new Map(previous.itemsBySourceId);
        const sourceIdsById = new Map(previous.sourceIdsById);
        const touched = new Set<TId>();

        const drop = (id: TId, sourceId: TSourceId) => {
            const kept = (sourceIdsById.get(id) ?? []).filter(held => held !== sourceId);

            if (kept.length === 0) {
                sourceIdsById.delete(id);
            } else {
                sourceIdsById.set(id, kept);
            }
        };

        removed.forEach(sourceId => {
            idsOf(itemsBySourceId.get(sourceId) ?? []).forEach(id => {
                touched.add(id);
                drop(id, sourceId);
            });
            itemsBySourceId.delete(sourceId);
        });

        [...added, ...updated].forEach(sourceId => {
            const before = idsOf(itemsBySourceId.get(sourceId) ?? []);
            const items = expandOnce(sourceSnapshot.byId.get(sourceId) as TSource);
            const after = idsOf(items);
            itemsBySourceId.set(sourceId, items);

            before.forEach(id => {
                touched.add(id);

                if (!after.includes(id)) {
                    drop(id, sourceId);
                }
            });
            after.forEach(id => {
                touched.add(id);

                if (!before.includes(id)) {
                    sourceIdsById.set(id, [...(sourceIdsById.get(id) ?? []), sourceId]);
                }
            });
        });

        // Only the touched ids are folded again; the map keeps the order of first appearance, with
        // the ids that are new at the end.
        const byId = new Map(previous.snapshot.byId);
        const addedIds: TId[] = [];
        const removedIds: TId[] = [];
        const updatedIds: TId[] = [];

        touched.forEach(id => {
            const sourceIds = sourceIdsById.get(id);

            if (sourceIds === undefined) {
                byId.delete(id);
                removedIds.push(id);

                return;
            }

            const entity = fold(id, sourceIds, itemsBySourceId);
            const held = previous.snapshot.byId.get(id);

            if (held === undefined) {
                byId.set(id, entity);
                addedIds.push(id);
            } else if (!isEqual(held, entity)) {
                byId.set(id, entity);
                updatedIds.push(id);
            }
        });

        return {
            sourceSnapshot,
            itemsBySourceId,
            sourceIdsById,
            snapshot: settleSnapshot(
                byId,
                [...byId.keys()],
                toChanges(addedIds, removedIds, updatedIds),
                previous.snapshot,
                nextRevision,
            ),
        };
    };

    const read = (state: TState): IndexSnapshot<TId, TEntity> => {
        const sourceSnapshot = source.read(state);
        const known = builds.get(sourceSnapshot);

        if (known !== undefined) {
            return known.snapshot;
        }

        const way = wayTo(last?.sourceSnapshot, sourceSnapshot);

        if (last !== undefined && way === 'same') {
            last = { ...last, sourceSnapshot };
        } else if (last !== undefined && way === 'changes') {
            last = refile(sourceSnapshot, last);
        } else {
            last = file(sourceSnapshot);
        }
        builds.set(sourceSnapshot, last);

        return last.snapshot;
    };

    return createIndexQueries(name, read);
};
