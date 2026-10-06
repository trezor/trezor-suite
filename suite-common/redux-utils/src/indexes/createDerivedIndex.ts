import { shallowEqual } from 'react-redux';

import { createIndexQueries, rememberIds, settleSnapshot, toChanges } from './indexSnapshot';
import {
    type DerivedIndexDefinition,
    type Index,
    type IndexId,
    type IndexSnapshot,
    type LookupEntities,
    type LookupIds,
    type LookupStateOf,
    type Lookups,
} from './indexTypes';

type LookupSnapshots = Record<string, IndexSnapshot<IndexId, unknown>>;

type Filed<TId extends IndexId, TEntity, TLookups> = {
    sourceSnapshot: IndexSnapshot<TId, unknown>;
    lookupSnapshots: LookupSnapshots;
    lookupIdsById: ReadonlyMap<TId, LookupIds<TLookups>>;
    snapshot: IndexSnapshot<TId, TEntity>;
};

/**
 * One entity per source entity, derived from it and from the entities it names in other indexes —
 * an asset and its rate into a priced asset. Maintained from what the source and the lookups say
 * changed: an entity is derived again only when its source entity changed or a lookup entity it
 * named did, so rates replaced with the same values, or a rate another asset uses, cost nothing.
 */
export const createDerivedIndex = <
    TState,
    TId extends IndexId,
    TSource,
    TEntity,
    TLookups extends Lookups<never> = Record<never, never>,
>({
    name,
    source,
    lookups = {} as TLookups,
    getLookupIds,
    derive,
    sort,
    isEqual = shallowEqual,
}: DerivedIndexDefinition<TState, TId, TSource, TLookups, TEntity>): Index<
    TState & LookupStateOf<TLookups>,
    TId,
    TEntity
> => {
    type State = TState & LookupStateOf<TLookups>;

    const lookupNames = Object.keys(lookups);
    const idOfEntity = new WeakMap<object, TId>();

    let cached: Filed<TId, TEntity, TLookups> | undefined;

    const lookupIdsOf = (entity: TSource): LookupIds<TLookups> => getLookupIds?.(entity) ?? {};

    const deriveOne = (
        entity: TSource,
        lookupIds: LookupIds<TLookups>,
        lookupSnapshots: LookupSnapshots,
    ): TEntity => {
        const named = {} as Record<string, unknown>;

        lookupNames.forEach(lookupName => {
            const lookupId = lookupIds[lookupName];
            named[lookupName] =
                lookupId === undefined
                    ? undefined
                    : lookupSnapshots[lookupName]?.byId.get(lookupId);
        });

        return derive(entity, named as LookupEntities<TLookups>);
    };

    const order = (byId: ReadonlyMap<TId, TEntity>): TId[] =>
        sort === undefined
            ? [...byId.keys()]
            : [...byId].sort(([, left], [, right]) => sort(left, right)).map(([id]) => id);

    const file = (
        sourceSnapshot: IndexSnapshot<TId, TSource>,
        lookupSnapshots: LookupSnapshots,
    ): Filed<TId, TEntity, TLookups> => {
        const byId = new Map<TId, TEntity>();
        const lookupIdsById = new Map<TId, LookupIds<TLookups>>();

        sourceSnapshot.ids.forEach(id => {
            const entity = sourceSnapshot.byId.get(id) as TSource;
            const lookupIds = lookupIdsOf(entity);
            lookupIdsById.set(id, lookupIds);
            byId.set(id, deriveOne(entity, lookupIds, lookupSnapshots));
        });
        rememberIds(idOfEntity, byId);

        return {
            sourceSnapshot,
            lookupSnapshots,
            lookupIdsById,
            snapshot: settleSnapshot(byId, order(byId), toChanges([], [], []), undefined),
        };
    };

    const changedLookupIds = (lookupSnapshots: LookupSnapshots, previous: LookupSnapshots) => {
        const changed: Record<string, ReadonlySet<IndexId>> = {};

        lookupNames.forEach(lookupName => {
            const snapshot = lookupSnapshots[lookupName];

            if (snapshot !== undefined && snapshot !== previous[lookupName]) {
                const { added, removed, updated } = snapshot.changes;
                changed[lookupName] = new Set([...added, ...removed, ...updated]);
            }
        });

        return changed;
    };

    const refile = (
        sourceSnapshot: IndexSnapshot<TId, TSource>,
        lookupSnapshots: LookupSnapshots,
        previous: Filed<TId, TEntity, TLookups>,
    ): Filed<TId, TEntity, TLookups> => {
        const changedSource = new Set<TId>([
            ...sourceSnapshot.changes.added,
            ...sourceSnapshot.changes.updated,
        ]);
        const changedLookups = changedLookupIds(lookupSnapshots, previous.lookupSnapshots);
        const namesChanged = Object.keys(changedLookups);

        const byId = new Map<TId, TEntity>();
        const lookupIdsById = new Map<TId, LookupIds<TLookups>>();
        const added: TId[] = [];
        const updated: TId[] = [];

        sourceSnapshot.ids.forEach(id => {
            const held = previous.snapshot.byId.get(id);
            const heldLookupIds = previous.lookupIdsById.get(id);
            const namesALookupChanged =
                heldLookupIds !== undefined &&
                namesChanged.some(lookupName =>
                    changedLookups[lookupName]?.has(
                        (heldLookupIds as Record<string, IndexId | undefined>)[
                            lookupName
                        ] as IndexId,
                    ),
                );

            if (
                held !== undefined &&
                heldLookupIds !== undefined &&
                !changedSource.has(id) &&
                !namesALookupChanged
            ) {
                byId.set(id, held);
                lookupIdsById.set(id, heldLookupIds);

                return;
            }

            const entity = sourceSnapshot.byId.get(id) as TSource;
            const lookupIds = lookupIdsOf(entity);
            const derived = deriveOne(entity, lookupIds, lookupSnapshots);
            lookupIdsById.set(id, lookupIds);

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
        rememberIds(idOfEntity, byId);

        return {
            sourceSnapshot,
            lookupSnapshots,
            lookupIdsById,
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
        const lookupSnapshots: LookupSnapshots = {};
        let haveLookupsChanged = cached === undefined;

        lookupNames.forEach(lookupName => {
            const snapshot = (lookups as Lookups<never>)[lookupName]?.read(state as never);

            if (snapshot !== undefined) {
                lookupSnapshots[lookupName] = snapshot;
                haveLookupsChanged ||= cached?.lookupSnapshots[lookupName] !== snapshot;
            }
        });

        if (cached?.sourceSnapshot === sourceSnapshot && !haveLookupsChanged) {
            return cached.snapshot;
        }

        cached =
            cached === undefined
                ? file(sourceSnapshot, lookupSnapshots)
                : refile(sourceSnapshot, lookupSnapshots, cached);

        return cached.snapshot;
    };

    return {
        ...createIndexQueries<State, TId, TEntity>(name, read, idOfEntity),
        createId: () => {
            throw new Error(
                `index "${name}" takes its ids from its source and has no parts to make one from`,
            );
        },
    };
};
