import { shallowEqual } from 'react-redux';

import { createIndexQueries, settleSnapshot, toChanges } from './indexSnapshot';
import {
    type DerivedIndexDefinition,
    type Index,
    type IndexId,
    type IndexSnapshot,
    type Join,
    type JoinIds,
    type JoinStateOf,
    type JoinedEntities,
} from './indexTypes';

type JoinSnapshots = Record<string, IndexSnapshot<IndexId, unknown>>;

type Filed<TId extends IndexId, TEntity, TJoin> = {
    sourceSnapshot: IndexSnapshot<TId, unknown>;
    joinSnapshots: JoinSnapshots;
    joinIdsById: ReadonlyMap<TId, JoinIds<TJoin>>;
    snapshot: IndexSnapshot<TId, TEntity>;
};

/**
 * One entity per source entity, derived from it and from the entities it names in other indexes —
 * an asset and its rate into a priced asset. Maintained from what the source and the join say
 * changed: an entity is made again only when its source entity changed or an entity it is joined
 * to did, so rates replaced with the same values, or a rate another asset uses, cost nothing.
 */
export const createDerivedIndex = <
    TState,
    TId extends IndexId,
    TSource,
    TEntity,
    TJoin extends Join<never> = Record<never, never>,
>({
    name,
    source,
    join = {} as TJoin,
    joinBy,
    toEntity,
    sort,
    isEqual = shallowEqual,
}: DerivedIndexDefinition<TState, TId, TSource, TJoin, TEntity>): Index<
    TState & JoinStateOf<TJoin>,
    TId,
    TEntity
> => {
    type State = TState & JoinStateOf<TJoin>;

    const joinNames = Object.keys(join);

    // What was built from a source snapshot, for as long as it lives; the last build is the
    // baseline a snapshot not seen before is maintained from. A joined index that moved under the
    // same source snapshot is caught by comparing its snapshots.
    const builds = new WeakMap<IndexSnapshot<TId, TSource>, Filed<TId, TEntity, TJoin>>();
    let last: Filed<TId, TEntity, TJoin> | undefined;

    const joinIdsOf = (entity: TSource): JoinIds<TJoin> => joinBy?.(entity) ?? {};

    const deriveOne = (
        entity: TSource,
        joinIds: JoinIds<TJoin>,
        joinSnapshots: JoinSnapshots,
    ): TEntity => {
        const named = {} as Record<string, unknown>;

        joinNames.forEach(joinName => {
            const joinId = joinIds[joinName];
            named[joinName] =
                joinId === undefined ? undefined : joinSnapshots[joinName]?.byId.get(joinId);
        });

        return toEntity(entity, named as JoinedEntities<TJoin>);
    };

    const order = (byId: ReadonlyMap<TId, TEntity>): TId[] =>
        sort === undefined
            ? [...byId.keys()]
            : [...byId].sort(([, left], [, right]) => sort(left, right)).map(([id]) => id);

    const file = (
        sourceSnapshot: IndexSnapshot<TId, TSource>,
        joinSnapshots: JoinSnapshots,
    ): Filed<TId, TEntity, TJoin> => {
        const byId = new Map<TId, TEntity>();
        const joinIdsById = new Map<TId, JoinIds<TJoin>>();

        sourceSnapshot.ids.forEach(id => {
            const entity = sourceSnapshot.byId.get(id) as TSource;
            const joinIds = joinIdsOf(entity);
            joinIdsById.set(id, joinIds);
            byId.set(id, deriveOne(entity, joinIds, joinSnapshots));
        });

        return {
            sourceSnapshot,
            joinSnapshots,
            joinIdsById,
            snapshot: settleSnapshot(byId, order(byId), toChanges([], [], []), undefined),
        };
    };

    const changedJoinIds = (joinSnapshots: JoinSnapshots, previous: JoinSnapshots) => {
        const changed: Record<string, ReadonlySet<IndexId>> = {};

        joinNames.forEach(joinName => {
            const snapshot = joinSnapshots[joinName];

            if (snapshot !== undefined && snapshot !== previous[joinName]) {
                const { added, removed, updated } = snapshot.changes;
                changed[joinName] = new Set([...added, ...removed, ...updated]);
            }
        });

        return changed;
    };

    const refile = (
        sourceSnapshot: IndexSnapshot<TId, TSource>,
        joinSnapshots: JoinSnapshots,
        previous: Filed<TId, TEntity, TJoin>,
    ): Filed<TId, TEntity, TJoin> => {
        const changedSource = new Set<TId>([
            ...sourceSnapshot.changes.added,
            ...sourceSnapshot.changes.updated,
        ]);
        const changedJoins = changedJoinIds(joinSnapshots, previous.joinSnapshots);
        const namesChanged = Object.keys(changedJoins);

        const byId = new Map<TId, TEntity>();
        const joinIdsById = new Map<TId, JoinIds<TJoin>>();
        const added: TId[] = [];
        const updated: TId[] = [];

        sourceSnapshot.ids.forEach(id => {
            const held = previous.snapshot.byId.get(id);
            const heldJoinIds = previous.joinIdsById.get(id);
            const aJoinChanged =
                heldJoinIds !== undefined &&
                namesChanged.some(joinName =>
                    changedJoins[joinName]?.has(
                        (heldJoinIds as Record<string, IndexId | undefined>)[joinName] as IndexId,
                    ),
                );

            if (
                held !== undefined &&
                heldJoinIds !== undefined &&
                !changedSource.has(id) &&
                !aJoinChanged
            ) {
                byId.set(id, held);
                joinIdsById.set(id, heldJoinIds);

                return;
            }

            const entity = sourceSnapshot.byId.get(id) as TSource;
            const joinIds = joinIdsOf(entity);
            const derived = deriveOne(entity, joinIds, joinSnapshots);
            joinIdsById.set(id, joinIds);

            if (held === undefined) {
                byId.set(id, derived);
                added.push(id);
            } else if (isEqual(held, derived)) {
                byId.set(id, held);
            } else {
                byId.set(id, derived);
                updated.push(id);
            }
        });

        const removed = previous.snapshot.ids.filter(id => !byId.has(id));

        return {
            sourceSnapshot,
            joinSnapshots,
            joinIdsById,
            snapshot: settleSnapshot(
                byId,
                order(byId),
                toChanges(added, removed, updated),
                previous.snapshot,
            ),
        };
    };

    const read = (state: State): IndexSnapshot<TId, TEntity> => {
        const sourceSnapshot = source.read(state);
        const joinSnapshots: JoinSnapshots = {};

        joinNames.forEach(joinName => {
            const snapshot = (join as Join<never>)[joinName]?.read(state as never);

            if (snapshot !== undefined) {
                joinSnapshots[joinName] = snapshot;
            }
        });

        const known = builds.get(sourceSnapshot);
        const haveJoinsMoved = (built: Filed<TId, TEntity, TJoin>) =>
            joinNames.some(joinName => built.joinSnapshots[joinName] !== joinSnapshots[joinName]);

        if (known !== undefined && !haveJoinsMoved(known)) {
            return known.snapshot;
        }

        last =
            last === undefined
                ? file(sourceSnapshot, joinSnapshots)
                : refile(sourceSnapshot, joinSnapshots, last);
        builds.set(sourceSnapshot, last);

        return last.snapshot;
    };

    return createIndexQueries(name, read);
};
